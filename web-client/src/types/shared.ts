// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Meeting Types
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  host: User;
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  status: MeetingStatus;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
  startTime: string;
  duration?: number;
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
}

export interface JoinMeetingRequest {
  meetingId: string;
  password?: string;
}

// Participant Types
export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  user: User;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
}

export enum ParticipantRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  PRESENTER = 'presenter',
  PARTICIPANT = 'participant'
}

export interface ParticipantMediaState {
  userId: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  audioLevel?: number;
}

// Message Types
export interface Message {
  id: string;
  meetingId: string;
  senderId: string;
  sender: User;
  content: string;
  type: MessageType;
  timestamp: string;
  editedAt?: string;
  replyToId?: string;
  mentions?: string[]; // user IDs
}

export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system',
  FILE = 'file',
  IMAGE = 'image'
}

export interface SendMessageRequest {
  meetingId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
  mentions?: string[];
}

// Recording Types
export interface Recording {
  id: string;
  meetingId: string;
  title: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  downloadUrl: string;
  thumbnailUrl?: string;
  status: RecordingStatus;
  createdAt: string;
}

export enum RecordingStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed'
}

// WebRTC Types
export interface SignalMessage {
  type: SignalType;
  from: string;
  to: string;
  meetingId: string;
  data: any;
  timestamp: string;
}

export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',
  JOIN = 'join',
  LEAVE = 'leave',
  MEDIA_STATE = 'media_state',
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_STOP = 'screen_share_stop'
}

export interface WebRTCConfiguration {
  iceServers: RTCIceServer[];
  audioConstraints: MediaTrackConstraints;
  videoConstraints: MediaTrackConstraints;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Socket Events
export interface SocketEvents {
  // Connection events
  'user:join': { userId: string; meetingId: string };
  'user:leave': { userId: string; meetingId: string };
  
  // Meeting events
  'meeting:started': { meetingId: string };
  'meeting:ended': { meetingId: string };
  'meeting:participant-joined': { participant: MeetingParticipant };
  'meeting:participant-left': { userId: string; meetingId: string };
  
  // WebRTC signaling
  'webrtc:offer': SignalMessage;
  'webrtc:answer': SignalMessage;
  'webrtc:ice-candidate': SignalMessage;
  
  // Media events
  'media:state-changed': ParticipantMediaState;
  'screen-share:started': { userId: string; meetingId: string };
  'screen-share:stopped': { userId: string; meetingId: string };
  
  // Chat events
  'chat:message': Message;
  'chat:message-edited': { messageId: string; content: string };
  'chat:message-deleted': { messageId: string };
  
  // Recording events
  'recording:started': { meetingId: string; recordingId: string };
  'recording:stopped': { meetingId: string; recordingId: string };
  'recording:ready': { recording: Recording };
}