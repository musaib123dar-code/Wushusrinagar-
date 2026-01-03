import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from './authService.js';
import { pool } from '../config/database.js';

interface ParticipantSocket extends Socket {
  participantId?: string;
  meetingId?: string;
  userId?: string;
}

export class SignalingServer {
  private io: SocketServer;
  private meetings: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: ParticipantSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const payload = AuthService.verifyAccessToken(token);
          socket.userId = payload.userId;
        }
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next();
      }
    });
  }

  private setupHandlers() {
    this.io.on('connection', (socket: ParticipantSocket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-meeting', async (data) => {
        await this.handleJoinMeeting(socket, data);
      });

      socket.on('leave-meeting', async (data) => {
        await this.handleLeaveMeeting(socket, data);
      });

      socket.on('webrtc-offer', (data) => {
        this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc-answer', (data) => {
        this.handleWebRTCAnswer(socket, data);
      });

      socket.on('webrtc-ice-candidate', (data) => {
        this.handleICECandidate(socket, data);
      });

      socket.on('toggle-audio', (data) => {
        this.handleToggleAudio(socket, data);
      });

      socket.on('toggle-video', (data) => {
        this.handleToggleVideo(socket, data);
      });

      socket.on('screen-share-started', (data) => {
        this.handleScreenShareStarted(socket, data);
      });

      socket.on('screen-share-stopped', (data) => {
        this.handleScreenShareStopped(socket, data);
      });

      socket.on('send-message', (data) => {
        this.handleSendMessage(socket, data);
      });

      socket.on('start-recording', (data) => {
        this.handleStartRecording(socket, data);
      });

      socket.on('stop-recording', (data) => {
        this.handleStopRecording(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinMeeting(socket: ParticipantSocket, data: {
    meetingId: string;
    participantId: string;
    displayName: string;
  }) {
    try {
      const { meetingId, participantId, displayName } = data;

      socket.meetingId = meetingId;
      socket.participantId = participantId;

      socket.join(meetingId);

      if (!this.meetings.has(meetingId)) {
        this.meetings.set(meetingId, new Set());
      }
      this.meetings.get(meetingId)!.add(participantId);

      const result = await pool.query(
        `INSERT INTO participants (id, meeting_id, user_id, display_name, connection_status)
         VALUES ($1, $2, $3, $4, 'connected')
         ON CONFLICT (id) DO UPDATE SET connection_status = 'connected', left_at = NULL
         RETURNING id, meeting_id as "meetingId", user_id as "userId", display_name as "displayName",
                   is_host as "isHost", is_muted as "isMuted", is_video_off as "isVideoOff",
                   is_screen_sharing as "isScreenSharing", joined_at as "joinedAt",
                   connection_status as "connectionStatus"`,
        [participantId, meetingId, socket.userId, displayName]
      );

      const participant = result.rows[0];

      socket.to(meetingId).emit('participant-joined', participant);

      const existingParticipants = await pool.query(
        `SELECT id, meeting_id as "meetingId", user_id as "userId", display_name as "displayName",
                is_host as "isHost", is_muted as "isMuted", is_video_off as "isVideoOff",
                is_screen_sharing as "isScreenSharing", joined_at as "joinedAt",
                connection_status as "connectionStatus"
         FROM participants
         WHERE meeting_id = $1 AND connection_status = 'connected' AND id != $2`,
        [meetingId, participantId]
      );

      socket.emit('existing-participants', existingParticipants.rows);

      console.log(`Participant ${participantId} joined meeting ${meetingId}`);
    } catch (error) {
      console.error('Error handling join meeting:', error);
      socket.emit('error', { message: 'Failed to join meeting' });
    }
  }

  private async handleLeaveMeeting(socket: ParticipantSocket, data: {
    meetingId: string;
    participantId: string;
  }) {
    try {
      const { meetingId, participantId } = data;

      await pool.query(
        `UPDATE participants
         SET connection_status = 'disconnected', left_at = NOW()
         WHERE id = $1`,
        [participantId]
      );

      socket.to(meetingId).emit('participant-left', participantId);

      socket.leave(meetingId);

      if (this.meetings.has(meetingId)) {
        this.meetings.get(meetingId)!.delete(participantId);
        if (this.meetings.get(meetingId)!.size === 0) {
          this.meetings.delete(meetingId);
        }
      }

      console.log(`Participant ${participantId} left meeting ${meetingId}`);
    } catch (error) {
      console.error('Error handling leave meeting:', error);
    }
  }

  private handleWebRTCOffer(socket: ParticipantSocket, data: any) {
    const { to, signal } = data;
    this.io.to(to).emit('webrtc-offer', {
      from: socket.id,
      signal
    });
  }

  private handleWebRTCAnswer(socket: ParticipantSocket, data: any) {
    const { to, signal } = data;
    this.io.to(to).emit('webrtc-answer', {
      from: socket.id,
      signal
    });
  }

  private handleICECandidate(socket: ParticipantSocket, data: any) {
    const { to, candidate } = data;
    this.io.to(to).emit('webrtc-ice-candidate', {
      from: socket.id,
      candidate
    });
  }

  private async handleToggleAudio(socket: ParticipantSocket, data: {
    participantId: string;
    isMuted: boolean;
  }) {
    try {
      const { participantId, isMuted } = data;

      await pool.query(
        'UPDATE participants SET is_muted = $1 WHERE id = $2',
        [isMuted, participantId]
      );

      if (socket.meetingId) {
        socket.to(socket.meetingId).emit('participant-audio-toggled', {
          participantId,
          isMuted
        });
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }

  private async handleToggleVideo(socket: ParticipantSocket, data: {
    participantId: string;
    isVideoOff: boolean;
  }) {
    try {
      const { participantId, isVideoOff } = data;

      await pool.query(
        'UPDATE participants SET is_video_off = $1 WHERE id = $2',
        [isVideoOff, participantId]
      );

      if (socket.meetingId) {
        socket.to(socket.meetingId).emit('participant-video-toggled', {
          participantId,
          isVideoOff
        });
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  }

  private async handleScreenShareStarted(socket: ParticipantSocket, data: {
    participantId: string;
  }) {
    try {
      const { participantId } = data;

      await pool.query(
        'UPDATE participants SET is_screen_sharing = true WHERE id = $1',
        [participantId]
      );

      if (socket.meetingId) {
        socket.to(socket.meetingId).emit('screen-share-started', { participantId });
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }

  private async handleScreenShareStopped(socket: ParticipantSocket, data: {
    participantId: string;
  }) {
    try {
      const { participantId } = data;

      await pool.query(
        'UPDATE participants SET is_screen_sharing = false WHERE id = $1',
        [participantId]
      );

      if (socket.meetingId) {
        socket.to(socket.meetingId).emit('screen-share-stopped', { participantId });
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  private async handleSendMessage(socket: ParticipantSocket, message: any) {
    try {
      const result = await pool.query(
        `INSERT INTO messages (id, meeting_id, sender_id, sender_name, recipient_id, content, type)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
         RETURNING id, meeting_id as "meetingId", sender_id as "senderId", 
                   sender_name as "senderName", recipient_id as "recipientId",
                   content, type, created_at as "timestamp"`,
        [
          message.meetingId,
          message.senderId,
          message.senderName,
          message.recipientId || null,
          message.content,
          message.type || 'text'
        ]
      );

      const savedMessage = result.rows[0];

      if (message.recipientId) {
        this.io.to(message.recipientId).emit('new-message', savedMessage);
      } else if (socket.meetingId) {
        this.io.to(socket.meetingId).emit('new-message', savedMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private async handleStartRecording(socket: ParticipantSocket, data: {
    meetingId: string;
  }) {
    try {
      const { meetingId } = data;

      const result = await pool.query(
        `INSERT INTO recordings (meeting_id, status)
         VALUES ($1, 'recording')
         RETURNING id, meeting_id as "meetingId", start_time as "startTime", status`,
        [meetingId]
      );

      await pool.query(
        'UPDATE meetings SET is_recording = true WHERE id = $1',
        [meetingId]
      );

      this.io.to(meetingId).emit('recording-started', result.rows[0]);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  private async handleStopRecording(socket: ParticipantSocket, data: {
    meetingId: string;
    recordingId: string;
  }) {
    try {
      const { meetingId, recordingId } = data;

      await pool.query(
        `UPDATE recordings
         SET end_time = NOW(), duration = EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER, status = 'processing'
         WHERE id = $1`,
        [recordingId]
      );

      await pool.query(
        'UPDATE meetings SET is_recording = false WHERE id = $1',
        [meetingId]
      );

      this.io.to(meetingId).emit('recording-stopped', { recordingId });
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }

  private async handleDisconnect(socket: ParticipantSocket) {
    console.log('Client disconnected:', socket.id);

    if (socket.meetingId && socket.participantId) {
      await this.handleLeaveMeeting(socket, {
        meetingId: socket.meetingId,
        participantId: socket.participantId
      });
    }
  }

  getIO() {
    return this.io;
  }
}
