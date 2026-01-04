import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db';
import { config } from '../config/database';
import { User, CreateUserRequest, LoginRequest, AuthResponse } from '../../../shared/types';

export class UserModel {
  /**
   * Create a new user
   */
  static async create(userData: CreateUserRequest): Promise<User> {
    const { email, username, firstName, lastName, password } = userData;
    
    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first();
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const [userId] = await db('users').insert({
      id: uuidv4(),
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      password_hash: passwordHash,
      is_online: false,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    // Return created user (without password)
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const user = await db('users')
      .select('id', 'email', 'username', 'first_name', 'last_name', 'avatar', 'is_online', 'last_seen', 'created_at', 'updated_at')
      .where('id', id)
      .first();
    
    if (!user) return null;
    
    return this.mapDatabaseToUser(user);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users')
      .select('*')
      .where('email', email)
      .first();
    
    if (!user) return null;
    
    return this.mapDatabaseToUser(user);
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users')
      .select('*')
      .where('username', username)
      .first();
    
    if (!user) return null;
    
    return this.mapDatabaseToUser(user);
  }

  /**
   * Validate user credentials
   */
  static async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await db('users')
      .select('*')
      .where('email', email)
      .first();
    
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return null;
    
    return this.mapDatabaseToUser(user);
  }

  /**
   * Update user online status
   */
  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db('users')
      .update({
        is_online: isOnline,
        last_seen: new Date(),
        updated_at: new Date()
      })
      .where('id', userId);
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const allowedUpdates = ['firstName', 'lastName', 'avatar'];
    const dbUpdates: any = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (allowedUpdates.includes(key)) {
        dbUpdates[`${key.replace(/([A-Z])/g, '_$1').toLowerCase()}`] = value;
      }
    });
    
    dbUpdates.updated_at = new Date();
    
    const [updatedUser] = await db('users')
      .where('id', userId)
      .update(dbUpdates)
      .returning('id');
    
    if (!updatedUser) return null;
    
    return this.findById(userId);
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await db('users')
      .select('password_hash')
      .where('id', userId)
      .first();
    
    if (!user) return false;
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) return false;
    
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await db('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where('id', userId);
    
    return true;
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(user: User): AuthResponse {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenExpiry }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.jwt.refreshTokenSecret,
      { expiresIn: config.jwt.refreshTokenExpiry }
    );
    
    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);
    
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: userId,
      token,
      expires_at: expiresAt,
      created_at: new Date()
    });
  }

  /**
   * Verify refresh token
   */
  static async verifyRefreshToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshTokenSecret) as any;
      
      if (decoded.type !== 'refresh') return null;
      
      // Check if token exists and not expired
      const tokenRecord = await db('refresh_tokens')
        .where('token', token)
        .where('expires_at', '>', new Date())
        .first();
      
      if (!tokenRecord) return null;
      
      return this.findById(decoded.userId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<boolean> {
    const deleted = await db('refresh_tokens')
      .where('token', token)
      .delete();
    
    return deleted > 0;
  }

  /**
   * Revoke all refresh tokens for user
   */
  static async revokeAllRefreshTokens(userId: string): Promise<void> {
    await db('refresh_tokens')
      .where('user_id', userId)
      .delete();
  }

  /**
   * Clean up expired refresh tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    await db('refresh_tokens')
      .where('expires_at', '<', new Date())
      .delete();
  }

  /**
   * Get online users
   */
  static async getOnlineUsers(): Promise<User[]> {
    const users = await db('users')
      .select('id', 'email', 'username', 'first_name', 'last_name', 'avatar', 'is_online', 'last_seen', 'created_at', 'updated_at')
      .where('is_online', true)
      .orderBy('last_seen', 'desc');
    
    return users.map(this.mapDatabaseToUser);
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const users = await db('users')
      .select('id', 'email', 'username', 'first_name', 'last_name', 'avatar', 'is_online', 'last_seen', 'created_at', 'updated_at')
      .where(function() {
        this.where('first_name', 'ilike', `%${query}%`)
          .orWhere('last_name', 'ilike', `%${query}%`)
          .orWhere('username', 'ilike', `%${query}%`)
          .orWhere('email', 'ilike', `%${query}%`);
      })
      .limit(limit)
      .orderBy('first_name');
    
    return users.map(this.mapDatabaseToUser);
  }

  /**
   * Map database user to API user
   */
  private static mapDatabaseToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      avatar: dbUser.avatar,
      isOnline: dbUser.is_online,
      lastSeen: new Date(dbUser.last_seen),
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }
}