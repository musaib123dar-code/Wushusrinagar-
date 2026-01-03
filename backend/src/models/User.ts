import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { User } from '../../../shared/types/index.js';

export class UserModel {
  static async create(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, first_name as "firstName", last_name as "lastName", 
                 avatar, created_at as "createdAt", updated_at as "updatedAt"`,
      [userData.email, userData.username, passwordHash, userData.firstName, userData.lastName]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, username, first_name as "firstName", last_name as "lastName",
              avatar, created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1 AND is_active = true`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT id, email, username, password_hash, first_name as "firstName", 
              last_name as "lastName", avatar, created_at as "createdAt", 
              updated_at as "updatedAt"
       FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );

    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, username, first_name as "firstName", last_name as "lastName",
              avatar, created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE username = $1 AND is_active = true`,
      [username]
    );

    return result.rows[0] || null;
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.avatar !== undefined) {
      fields.push(`avatar = $${paramCount++}`);
      values.push(updates.avatar);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, username, first_name as "firstName", last_name as "lastName",
                 avatar, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  static async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) return false;

    return bcrypt.compare(password, user.password_hash);
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );
  }

  static async delete(id: string): Promise<void> {
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
  }

  static async list(limit: number = 50, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const [usersResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, email, username, first_name as "firstName", last_name as "lastName",
                avatar, created_at as "createdAt", updated_at as "updatedAt"
         FROM users WHERE is_active = true
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = true')
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }
}
