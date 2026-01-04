import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, SOCKET_EVENTS, CONSTANTS } from '../config/constants';
import { SignalMessage, SignalType, SocketEvents, Message, MeetingParticipant, ParticipantMediaState } from '../types/shared';
import { authStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = authStore.getState().getAccessToken();
      
      if (!token) {
        reject(new Error('No access token available'));
        return;
      }

      this.socket = io(WS_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: CONSTANTS.RECONNECT_INTERVAL,
        reconnectionAttempts: CONSTANTS.MAX_RECONNECT_ATTEMPTS
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= CONSTANTS.MAX_RECONNECT_ATTEMPTS) {
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.stopHeartbeat();
        
        // Attempt to reconnect if disconnection was not intentional
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.socket?.connect();
        }
      });

      this.setupEventHandlers();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopHeartbeat();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // User management
  joinMeeting(meetingId: string): Promise<{ success: boolean; participant?: MeetingParticipant; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.USER_JOIN, { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  leaveMeeting(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.USER_LEAVE, { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  // WebRTC signaling
  sendOffer(signalMessage: SignalMessage): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, signalMessage, (response: any) => {
        resolve(response);
      });
    });
  }

  sendAnswer(signalMessage: SignalMessage): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, signalMessage, (response: any) => {
        resolve(response);
      });
    });
  }

  sendICECandidate(signalMessage: SignalMessage): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, signalMessage, (response: any) => {
        resolve(response);
      });
    });
  }

  // Media control
  updateMediaState(meetingId: string, mediaState: ParticipantMediaState): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.MEDIA_STATE_CHANGED, { meetingId, mediaState }, (response: any) => {
        resolve(response);
      });
    });
  }

  startScreenShare(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STARTED, { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  stopScreenShare(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STOPPED, { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  // Chat
  sendChatMessage(data: {
    meetingId: string;
    content: string;
    type?: string;
    replyToId?: string;
    mentions?: string[];
  }): Promise<{ success: boolean; message?: Message; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, data, (response: any) => {
        resolve(response);
      });
    });
  }

  // Meeting control
  startMeeting(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit('meeting:start', { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  endMeeting(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit('meeting:end', { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  // Recording
  startRecording(meetingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.RECORDING_STARTED, { meetingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  stopRecording(meetingId: string, recordingId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit(SOCKET_EVENTS.RECORDING_STOPPED, { meetingId, recordingId }, (response: any) => {
        resolve(response);
      });
    });
  }

  // Event listeners
  onUserJoined(callback: (data: { participant: MeetingParticipant }) => void): void {
    this.socket?.on(SOCKET_EVENTS.USER_JOIN, callback);
  }

  onUserLeft(callback: (data: { userId: string; meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.USER_LEAVE, callback);
  }

  onMeetingStarted(callback: (data: { meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.MEETING_STARTED, callback);
  }

  onMeetingEnded(callback: (data: { meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.MEETING_ENDED, callback);
  }

  onParticipantJoined(callback: (data: { participant: MeetingParticipant }) => void): void {
    this.socket?.on(SOCKET_EVENTS.MEETING_PARTICIPANT_JOINED, callback);
  }

  onParticipantLeft(callback: (data: { userId: string; meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.MEETING_PARTICIPANT_LEFT, callback);
  }

  // WebRTC signaling events
  onOffer(callback: (data: SignalMessage) => void): void {
    this.socket?.on(SOCKET_EVENTS.WEBRTC_OFFER, callback);
  }

  onAnswer(callback: (data: SignalMessage) => void): void {
    this.socket?.on(SOCKET_EVENTS.WEBRTC_ANSWER, callback);
  }

  onICECandidate(callback: (data: SignalMessage) => void): void {
    this.socket?.on(SOCKET_EVENTS.WEBRTC_ICE_CANDIDATE, callback);
  }

  // Media events
  onMediaStateChanged(callback: (data: ParticipantMediaState) => void): void {
    this.socket?.on(SOCKET_EVENTS.MEDIA_STATE_CHANGED, callback);
  }

  onScreenShareStarted(callback: (data: { userId: string; meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.SCREEN_SHARE_STARTED, callback);
  }

  onScreenShareStopped(callback: (data: { userId: string; meetingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.SCREEN_SHARE_STOPPED, callback);
  }

  // Chat events
  onChatMessage(callback: (message: Message) => void): void {
    this.socket?.on(SOCKET_EVENTS.CHAT_MESSAGE, callback);
  }

  onChatMessageEdited(callback: (data: { messageId: string; content: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.CHAT_MESSAGE_EDITED, callback);
  }

  onChatMessageDeleted(callback: (data: { messageId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.CHAT_MESSAGE_DELETED, callback);
  }

  // Recording events
  onRecordingStarted(callback: (data: { meetingId: string; recordingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.RECORDING_STARTED, callback);
  }

  onRecordingStopped(callback: (data: { meetingId: string; recordingId: string }) => void): void {
    this.socket?.on(SOCKET_EVENTS.RECORDING_STOPPED, callback);
  }

  onRecordingReady(callback: (data: any) => void): void {
    this.socket?.on(SOCKET_EVENTS.RECORDING_READY, callback);
  }

  // Remove event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Heartbeat to maintain connection
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping');
      }
    }, CONSTANTS.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle pong responses
    this.socket.on('pong', () => {
      // Connection is alive
    });

    // Handle authentication errors
    this.socket.on('connect_error', (error) => {
      if (error.message === 'Invalid authentication token') {
        authStore.getState().logout();
        window.location.href = '/login';
      }
    });
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();