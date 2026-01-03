import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { AuthService } from '../services/authService.js';
import { AuthRequest } from '../middleware/auth.js';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email, username, and password are required'
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: 'Username already taken'
        });
      }

      const user = await UserModel.create({
        email,
        username,
        password,
        firstName,
        lastName
      });

      const accessToken = AuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      const refreshToken = AuthService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      await AuthService.saveRefreshToken(user.id, refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const isValid = await UserModel.verifyPassword(email, password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const accessToken = AuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      const refreshToken = AuthService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      await AuthService.saveRefreshToken(user.id, refreshToken);

      res.json({
        success: true,
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const storedToken = await AuthService.findRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      const payload = AuthService.verifyRefreshToken(refreshToken);

      const newAccessToken = AuthService.generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        username: payload.username
      });

      const newRefreshToken = AuthService.generateRefreshToken({
        userId: payload.userId,
        email: payload.email,
        username: payload.username
      });

      await AuthService.revokeRefreshToken(refreshToken);
      await AuthService.saveRefreshToken(payload.userId, newRefreshToken);

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });
    } catch (error: any) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.revokeRefreshToken(refreshToken);
      }

      if (req.user) {
        await AuthService.revokeAllUserTokens(req.user.userId);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { firstName, lastName, avatar } = req.body;

      const user = await UserModel.update(req.user.userId, {
        firstName,
        lastName,
        avatar
      });

      res.json({
        success: true,
        data: { user }
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
}
