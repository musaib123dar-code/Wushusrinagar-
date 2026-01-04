import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/db';
import { UserModel } from '../models/User';
import { MeetingModel } from '../models/Meeting';
import { 
  SocketEvents, 
  SignalMessage, 
  SignalType, 
  ParticipantMediaState,
  MeetingParticipant,
  Message
} from '../../../shared/types';
import { MessageModel } from '../models/Message';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
  meetingId?: string;
}

export class SignalingServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private meetingParticipants: Map<string, Set<string>> = new Map(); // meetingId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: config.socket.cors,
      transports: config.socket.transports
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      socket.on('user:join', (data, callback) => this.handleUserJoin(socket, data, callback));
      socket.on('user:leave', (data, callback) => this.handleUserLeave(socket, data, callback));
      
      // WebRTC signaling
      socket.on('webrtc:offer', (data, callback) => this.handleWebRTCOffer(socket, data, callback));
      socket.on('webrtc:answer', (data, callback) => this.handleWebRTCAnswer(socket, data, callback));
      socket.on('webrtc:ice-candidate', (data, callback) => this.handleICECandidate(socket, data, callback));
      
      // Media events
      socket.on('media:state-changed', (data, callback) => this.handleMediaStateChange(socket, data, callback));
      socket.on('screen-share:started', (data, callback) => this.handleScreenShareStart(socket, data, callback));
      socket.on('screen-share:stopped', (data, callback) => this.handleScreenShareStop(socket, data, callback));
      
      // Chat events
      socket.on('chat:message', (data, callback) => this.handleChatMessage(socket, data, callback));
      
      // Meeting events
      socket.on('meeting:start', (data, callback) => this.handleMeetingStart(socket, data, callback));
      socket.on('meeting:end', (data, callback) => this.handleMeetingEnd(socket, data, callback));
      
      // Recording events
      socket.on('recording:start', (data, callback) => this.handleRecordingStart(socket, data, callback));
      socket.on('recording:stop', (data, callback) => this.handleRecordingStop(socket, data, callback));
      
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as any;
      const user = await UserModel.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  private async handleUserJoin(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Verify user can join meeting
      const meeting = await MeetingModel.findById(meetingId);
      if (!meeting) {
        callback?.({ error: 'Meeting not found' });
        return;
      }

      // Join socket room
      socket.join(meetingId);
      
      // Add user to meeting participants
      const participant = await MeetingModel.joinMeeting(meetingId, socket.userId);
      
      // Store socket info
      this.connectedUsers.set(socket.userId, socket);
      
      // Track meeting participants
      if (!this.meetingParticipants.has(meetingId)) {
        this.meetingParticipants.set(meetingId, new Set());
      }
      this.meetingParticipants.get(meetingId)!.add(socket.userId);
      
      // Notify other participants
      socket.to(meetingId).emit('meeting:participant-joined', { participant });
      
      // Send current participants to new user
      const participants = await MeetingModel.getParticipants(meetingId);
      socket.emit('meeting:participants', { participants });
      
      callback?.({ success: true, participant });
      
      console.log(`User ${socket.userId} joined meeting ${meetingId}`);
    } catch (error: any) {
      console.error('Error in handleUserJoin:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleUserLeave(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Leave socket room
      socket.leave(meetingId);
      
      // Remove from meeting participants
      await MeetingModel.leaveMeeting(meetingId, socket.userId);
      
      // Update tracking
      this.connectedUsers.delete(socket.userId);
      const participants = this.meetingParticipants.get(meetingId);
      if (participants) {
        participants.delete(socket.userId);
        if (participants.size === 0) {
          this.meetingParticipants.delete(meetingId);
        }
      }
      
      // Notify other participants
      socket.to(meetingId).emit('meeting:participant-left', { 
        userId: socket.userId, 
        meetingId 
      });
      
      callback?.({ success: true });
      
      console.log(`User ${socket.userId} left meeting ${meetingId}`);
    } catch (error: any) {
      console.error('Error in handleUserLeave:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleWebRTCOffer(socket: AuthenticatedSocket, data: SignalMessage, callback?: Function): Promise<void> {
    try {
      const targetSocket = this.connectedUsers.get(data.to);
      if (!targetSocket) {
        callback?.({ error: 'Target user not found' });
        return;
      }

      targetSocket.emit('webrtc:offer', data);
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleWebRTCOffer:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleWebRTCAnswer(socket: AuthenticatedSocket, data: SignalMessage, callback?: Function): Promise<void> {
    try {
      const targetSocket = this.connectedUsers.get(data.to);
      if (!targetSocket) {
        callback?.({ error: 'Target user not found' });
        return;
      }

      targetSocket.emit('webrtc:answer', data);
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleWebRTCAnswer:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleICECandidate(socket: AuthenticatedSocket, data: SignalMessage, callback?: Function): Promise<void> {
    try {
      const targetSocket = this.connectedUsers.get(data.to);
      if (!targetSocket) {
        callback?.({ error: 'Target user not found' });
        return;
      }

      targetSocket.emit('webrtc:ice-candidate', data);
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleICECandidate:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleMediaStateChange(socket: AuthenticatedSocket, data: { meetingId: string; mediaState: ParticipantMediaState }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId, mediaState } = data;
      
      // Update database
      await MeetingModel.updateParticipantMediaState(meetingId, socket.userId, {
        isMuted: mediaState.isMuted,
        isVideoEnabled: mediaState.isVideoEnabled,
        isScreenSharing: mediaState.isScreenSharing
      });
      
      // Broadcast to other participants
      socket.to(meetingId).emit('media:state-changed', {
        userId: socket.userId,
        isMuted: mediaState.isMuted,
        isVideoEnabled: mediaState.isVideoEnabled,
        isScreenSharing: mediaState.isScreenSharing,
        audioLevel: mediaState.audioLevel
      });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleMediaStateChange:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleScreenShareStart(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Update database
      await MeetingModel.updateParticipantMediaState(meetingId, socket.userId, {
        isScreenSharing: true
      });
      
      // Broadcast to other participants
      socket.to(meetingId).emit('screen-share:started', {
        userId: socket.userId,
        meetingId
      });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleScreenShareStart:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleScreenShareStop(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Update database
      await MeetingModel.updateParticipantMediaState(meetingId, socket.userId, {
        isScreenSharing: false
      });
      
      // Broadcast to other participants
      socket.to(meetingId).emit('screen-share:stopped', {
        userId: socket.userId,
        meetingId
      });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleScreenShareStop:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleChatMessage(socket: AuthenticatedSocket, data: { meetingId: string; content: string; type?: string; replyToId?: string; mentions?: string[] }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId, content, type, replyToId, mentions } = data;
      
      // Send message through message model
      const message = await MessageModel.sendMessage({
        meetingId,
        content,
        type: type as any,
        replyToId,
        mentions
      }, socket.userId);
      
      // Broadcast to all participants in the meeting
      this.io.to(meetingId).emit('chat:message', message);
      
      callback?.({ success: true, message });
    } catch (error: any) {
      console.error('Error in handleChatMessage:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleMeetingStart(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Only host can start meeting
      const success = await MeetingModel.startMeeting(meetingId, socket.userId);
      if (!success) {
        callback?.({ error: 'Only the host can start the meeting' });
        return;
      }
      
      // Broadcast to all participants
      this.io.to(meetingId).emit('meeting:started', { meetingId });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleMeetingStart:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleMeetingEnd(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // Only host can end meeting
      const success = await MeetingModel.endMeeting(meetingId, socket.userId);
      if (!success) {
        callback?.({ error: 'Only the host can end the meeting' });
        return;
      }
      
      // Notify all participants
      this.io.to(meetingId).emit('meeting:ended', { meetingId });
      
      // Clean up participants
      this.meetingParticipants.delete(meetingId);
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleMeetingEnd:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleRecordingStart(socket: AuthenticatedSocket, data: { meetingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId } = data;
      
      // TODO: Implement recording logic
      // This would integrate with cloud recording service
      
      // Broadcast to all participants
      this.io.to(meetingId).emit('recording:started', {
        meetingId,
        recordingId: `rec_${Date.now()}` // Temporary ID
      });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleRecordingStart:', error);
      callback?.({ error: error.message });
    }
  }

  private async handleRecordingStop(socket: AuthenticatedSocket, data: { meetingId: string; recordingId: string }, callback?: Function): Promise<void> {
    try {
      if (!socket.userId) return;

      const { meetingId, recordingId } = data;
      
      // TODO: Implement recording stop logic
      // This would finalize the recording and upload to cloud storage
      
      // Broadcast to all participants
      this.io.to(meetingId).emit('recording:stopped', {
        meetingId,
        recordingId
      });
      
      callback?.({ success: true });
    } catch (error: any) {
      console.error('Error in handleRecordingStop:', error);
      callback?.({ error: error.message });
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Find and clean up user
    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);
      
      // Remove from meeting participants
      if (socket.meetingId) {
        const participants = this.meetingParticipants.get(socket.meetingId);
        if (participants) {
          participants.delete(socket.userId);
          if (participants.size === 0) {
            this.meetingParticipants.delete(socket.meetingId);
          }
        }
        
        // Notify other participants
        socket.to(socket.meetingId).emit('meeting:participant-left', {
          userId: socket.userId,
          meetingId: socket.meetingId
        });
      }
    }
  }
}