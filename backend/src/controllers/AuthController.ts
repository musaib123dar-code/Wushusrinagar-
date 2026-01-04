import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../../../shared/types';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, firstName, lastName, password } = req.body;

      // Basic validation
      if (!email || !username || !firstName || !lastName || !password) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      const user = await UserModel.create({
        email,
        username,
        firstName,
        lastName,
        password
      });

      const tokens = UserModel.generateTokens(user);
      await UserModel.storeRefreshToken(user.id, tokens.refreshToken);

      const response: ApiResponse = {
        success: true,
        data: {
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        },
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const user = await UserModel.validateCredentials(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Update user online status
      await UserModel.updateOnlineStatus(user.id, true);

      const tokens = UserModel.generateTokens(user);
      await UserModel.storeRefreshToken(user.id, tokens.refreshToken);

      const response: ApiResponse = {
        success: true,
        data: {
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        },
        message: 'Login successful'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
        return;
      }

      const user = await UserModel.verifyRefreshToken(refreshToken);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      const tokens = UserModel.generateTokens(user);
      
      // Revoke old refresh token and store new one
      await UserModel.revokeRefreshToken(refreshToken);
      await UserModel.storeRefreshToken(user.id, tokens.refreshToken);

      const response: ApiResponse = {
        success: true,
        data: {
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        },
        message: 'Token refreshed successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Revoke refresh token
      if (refreshToken) {
        await UserModel.revokeRefreshToken(refreshToken);
      }

      // Update user online status
      if (req.user) {
        await UserModel.updateOnlineStatus(req.user.id, false);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: req.user,
        message: 'Profile retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { firstName, lastName, avatar } = req.body;
      const updates: any = {};

      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (avatar) updates.avatar = avatar;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
        return;
      }

      const updatedUser = await UserModel.updateProfile(req.user.id, updates);
      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
        return;
      }

      const success = await UserModel.changePassword(req.user.id, currentPassword, newPassword);
      if (!success) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Revoke all refresh tokens to force re-login
      await UserModel.revokeAllRefreshTokens(req.user.id);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Search users
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const users = await UserModel.searchUsers(query, limit ? parseInt(limit as string) : 10);

      const response: ApiResponse = {
        success: true,
        data: users,
        message: 'Users found'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Search failed'
      });
    }
  }

  /**
   * Get online users
   */
  static async getOnlineUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.getOnlineUsers();

      const response: ApiResponse = {
        success: true,
        data: users,
        message: 'Online users retrieved'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get online users'
      });
    }
  }
}