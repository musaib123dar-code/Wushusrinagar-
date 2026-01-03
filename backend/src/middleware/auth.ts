import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
        username: payload.username
      };
    }

    next();
  } catch (error) {
    next();
  }
};
