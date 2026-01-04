import { Request, Response } from 'express';
import { MessageModel } from '../models/Message';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../../../shared/types';

export class MessageController {
  /**
   * Send a message in a meeting
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId, content, type, replyToId, mentions } = req.body;

      if (!content || !meetingId) {
        res.status(400).json({
          success: false,
          message: 'Content and meeting ID are required'
        });
        return;
      }

      if (content.length > 2000) {
        res.status(400).json({
          success: false,
          message: 'Message content too long (max 2000 characters)'
        });
        return;
      }

      const message = await MessageModel.sendMessage({
        meetingId,
        content,
        type,
        replyToId,
        mentions
      }, req.user.id);

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message sent successfully'
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }

  /**
   * Get messages for a meeting
   */
  static async getMeetingMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const before = req.query.before as string;

      if (!meetingId) {
        res.status(400).json({
          success: false,
          message: 'Meeting ID is required'
        });
        return;
      }

      if (limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100'
        });
        return;
      }

      const messages = await MessageModel.getMeetingMessages(meetingId, limit, offset, before);

      const response: ApiResponse = {
        success: true,
        data: messages,
        message: 'Messages retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get messages'
      });
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          message: 'Content is required'
        });
        return;
      }

      if (content.length > 2000) {
        res.status(400).json({
          success: false,
          message: 'Message content too long (max 2000 characters)'
        });
        return;
      }

      const message = await MessageModel.editMessage(messageId, req.user.id, content);

      const response: ApiResponse = {
        success: true,
        data: message,
        message: 'Message edited successfully'
      };

      res.json(response);
    } catch (error: any) {
      const statusCode = error.message.includes('permission') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to edit message'
      });
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { messageId } = req.params;

      const success = await MessageModel.deleteMessage(messageId, req.user.id);

      const response: ApiResponse = {
        success: true,
        message: 'Message deleted successfully'
      };

      res.json(response);
    } catch (error: any) {
      const statusCode = error.message.includes('permission') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete message'
      });
    }
  }

  /**
   * Search messages in a meeting
   */
  static async searchMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;
      const { query, limit } = req.query;

      if (!meetingId || !query) {
        res.status(400).json({
          success: false,
          message: 'Meeting ID and search query are required'
        });
        return;
      }

      if (typeof query !== 'string' || query.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
        return;
      }

      const searchLimit = limit ? Math.min(parseInt(limit as string), 50) : 20;
      const messages = await MessageModel.searchMessages(meetingId, query, searchLimit);

      const response: ApiResponse = {
        success: true,
        data: messages,
        message: 'Messages searched successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search messages'
      });
    }
  }

  /**
   * Get mentions for a user
   */
  static async getMentions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await MessageModel.getMentions(req.user.id, limit, offset);

      const response: ApiResponse = {
        success: true,
        data: messages,
        message: 'Mentions retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get mentions'
      });
    }
  }

  /**
   * Get message statistics for a meeting
   */
  static async getMessageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      if (!meetingId) {
        res.status(400).json({
          success: false,
          message: 'Meeting ID is required'
        });
        return;
      }

      const stats = await MessageModel.getMessageStats(meetingId);

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Message statistics retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get message statistics'
      });
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { messageId } = req.params;

      await MessageModel.markAsRead(messageId, req.user.id);

      const response: ApiResponse = {
        success: true,
        message: 'Message marked as read'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark message as read'
      });
    }
  }
}