import { Response } from 'express';
import { MeetingModel } from '../models/Meeting.js';
import { AuthRequest } from '../middleware/auth.js';
import { MeetingStatus } from '../../../shared/types/index.js';

export class MeetingController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const {
        title,
        description,
        scheduledStartTime,
        scheduledEndTime,
        password,
        maxParticipants,
        settings
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'Meeting title is required'
        });
      }

      const meeting = await MeetingModel.create({
        title,
        description,
        hostId: req.user.userId,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
        scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : undefined,
        password,
        maxParticipants,
        settings
      });

      res.status(201).json({
        success: true,
        data: { meeting }
      });
    } catch (error: any) {
      console.error('Create meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create meeting'
      });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: { meeting }
      });
    } catch (error: any) {
      console.error('Get meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meeting'
      });
    }
  }

  static async getByCode(req: AuthRequest, res: Response) {
    try {
      const { code } = req.params;

      const meeting = await MeetingModel.findByCode(code);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found'
        });
      }

      res.json({
        success: true,
        data: { meeting }
      });
    } catch (error: any) {
      console.error('Get meeting by code error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meeting'
      });
    }
  }

  static async listByHost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { meetings, total } = await MeetingModel.listByHost(
        req.user.userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: {
          meetings,
          pagination: {
            total,
            limit,
            offset,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error: any) {
      console.error('List meetings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list meetings'
      });
    }
  }

  static async listUpcoming(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const meetings = await MeetingModel.listUpcoming(limit);

      res.json({
        success: true,
        data: { meetings }
      });
    } catch (error: any) {
      console.error('List upcoming meetings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list upcoming meetings'
      });
    }
  }

  static async start(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { id } = req.params;

      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found'
        });
      }

      if (meeting.hostId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Only the host can start the meeting'
        });
      }

      const updatedMeeting = await MeetingModel.updateStatus(id, MeetingStatus.LIVE);

      res.json({
        success: true,
        data: { meeting: updatedMeeting }
      });
    } catch (error: any) {
      console.error('Start meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start meeting'
      });
    }
  }

  static async end(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { id } = req.params;

      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found'
        });
      }

      if (meeting.hostId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Only the host can end the meeting'
        });
      }

      const updatedMeeting = await MeetingModel.updateStatus(id, MeetingStatus.ENDED);

      res.json({
        success: true,
        data: { meeting: updatedMeeting }
      });
    } catch (error: any) {
      console.error('End meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end meeting'
      });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const { id } = req.params;

      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: 'Meeting not found'
        });
      }

      if (meeting.hostId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'Only the host can delete the meeting'
        });
      }

      await MeetingModel.delete(id);

      res.json({
        success: true,
        message: 'Meeting deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete meeting error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete meeting'
      });
    }
  }
}
