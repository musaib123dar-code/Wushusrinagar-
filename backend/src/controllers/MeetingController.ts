import { Request, Response } from 'express';
import { MeetingModel } from '../models/Meeting';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../../../shared/types';

export class MeetingController {
  /**
   * Create a new meeting
   */
  static async createMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const {
        title,
        description,
        isPrivate,
        password,
        maxParticipants,
        startTime,
        duration,
        recordingEnabled,
        chatEnabled,
        screenShareEnabled
      } = req.body;

      // Basic validation
      if (!title || !startTime || !maxParticipants) {
        res.status(400).json({
          success: false,
          message: 'Title, start time, and max participants are required'
        });
        return;
      }

      if (new Date(startTime) <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Start time must be in the future'
        });
        return;
      }

      if (maxParticipants < 1 || maxParticipants > 100) {
        res.status(400).json({
          success: false,
          message: 'Max participants must be between 1 and 100'
        });
        return;
      }

      const meeting = await MeetingModel.create(req.user.id, {
        title,
        description,
        isPrivate: isPrivate || false,
        password,
        maxParticipants,
        startTime: new Date(startTime),
        duration,
        recordingEnabled: recordingEnabled || false,
        chatEnabled: chatEnabled !== false,
        screenShareEnabled: screenShareEnabled !== false
      });

      const response: ApiResponse = {
        success: true,
        data: meeting,
        message: 'Meeting created successfully'
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create meeting'
      });
    }
  }

  /**
   * Get meeting by ID
   */
  static async getMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      const meeting = await MeetingModel.findById(meetingId);
      if (!meeting) {
        res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: meeting,
        message: 'Meeting retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meeting'
      });
    }
  }

  /**
   * Get user's meetings
   */
  static async getUserMeetings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const meetings = await MeetingModel.findByHost(req.user.id, limit, offset);

      const response: PaginatedResponse<Meeting> = {
        success: true,
        data: meetings,
        message: 'Meetings retrieved successfully',
        pagination: {
          page,
          limit,
          total: meetings.length,
          totalPages: Math.ceil(meetings.length / limit)
        }
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get meetings'
      });
    }
  }

  /**
   * Get upcoming meetings for user
   */
  static async getUpcomingMeetings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const meetings = await MeetingModel.findUpcomingByUser(req.user.id, limit);

      const response: ApiResponse = {
        success: true,
        data: meetings,
        message: 'Upcoming meetings retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get upcoming meetings'
      });
    }
  }

  /**
   * Join a meeting
   */
  static async joinMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;
      const { password } = req.body;

      const meeting = await MeetingModel.findById(meetingId);
      if (!meeting) {
        res.status(404).json({
          success: false,
          message: 'Meeting not found'
        });
        return;
      }

      // Check if meeting is private and password is required
      if (meeting.isPrivate && meeting.password && meeting.password !== password) {
        res.status(403).json({
          success: false,
          message: 'Invalid meeting password'
        });
        return;
      }

      // Check if meeting has started or is scheduled
      if (meeting.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'This meeting has been cancelled'
        });
        return;
      }

      if (meeting.status === 'ended') {
        res.status(400).json({
          success: false,
          message: 'This meeting has already ended'
        });
        return;
      }

      const participant = await MeetingModel.joinMeeting(meetingId, req.user.id);

      const response: ApiResponse = {
        success: true,
        data: participant,
        message: 'Successfully joined meeting'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to join meeting'
      });
    }
  }

  /**
   * Leave a meeting
   */
  static async leaveMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;

      const success = await MeetingModel.leaveMeeting(meetingId, req.user.id);
      if (!success) {
        res.status(400).json({
          success: false,
          message: 'Failed to leave meeting or not a participant'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Successfully left meeting'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to leave meeting'
      });
    }
  }

  /**
   * Start a meeting (host only)
   */
  static async startMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;

      const success = await MeetingModel.startMeeting(meetingId, req.user.id);
      if (!success) {
        res.status(403).json({
          success: false,
          message: 'Only the host can start the meeting'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Meeting started successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start meeting'
      });
    }
  }

  /**
   * End a meeting (host only)
   */
  static async endMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;

      const success = await MeetingModel.endMeeting(meetingId, req.user.id);
      if (!success) {
        res.status(403).json({
          success: false,
          message: 'Only the host can end the meeting'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Meeting ended successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to end meeting'
      });
    }
  }

  /**
   * Cancel a meeting (host only)
   */
  static async cancelMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;

      const success = await MeetingModel.cancelMeeting(meetingId, req.user.id);
      if (!success) {
        res.status(403).json({
          success: false,
          message: 'Only the host can cancel the meeting'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Meeting cancelled successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel meeting'
      });
    }
  }

  /**
   * Get meeting participants
   */
  static async getParticipants(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      const participants = await MeetingModel.getParticipants(meetingId);

      const response: ApiResponse = {
        success: true,
        data: participants,
        message: 'Participants retrieved successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get participants'
      });
    }
  }

  /**
   * Update participant media state
   */
  static async updateMediaState(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;
      const { isMuted, isVideoEnabled, isScreenSharing } = req.body;

      const success = await MeetingModel.updateParticipantMediaState(meetingId, req.user.id, {
        isMuted,
        isVideoEnabled,
        isScreenSharing
      });

      if (!success) {
        res.status(400).json({
          success: false,
          message: 'Failed to update media state or not a participant'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Media state updated successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update media state'
      });
    }
  }

  /**
   * Delete a meeting (host only)
   */
  static async deleteMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { meetingId } = req.params;

      const success = await MeetingModel.deleteMeeting(meetingId, req.user.id);
      if (!success) {
        res.status(403).json({
          success: false,
          message: 'Only the host can delete the meeting'
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Meeting deleted successfully'
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete meeting'
      });
    }
  }
}