export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: MeetingStatus;
  meetingCode: string;
  password?: string;
  isRecording: boolean;
  maxParticipants: number;
  settings: MeetingSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface MeetingSettings {
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  muteOnEntry: boolean;
  waitingRoom: boolean;
  requirePassword: boolean;
}

export interface Participant {
  id: string;
  meetingId: string;
  userId?: string;
  displayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt: Date;
  leftAt?: Date;
  connectionStatus: ConnectionStatus;
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected'
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system'
}

export interface Recording {
  id: string;
  meetingId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  fileUrl?: string;
  fileSize?: number;
  status: RecordingStatus;
  createdAt: Date;
}

export enum RecordingStatus {
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  signal: any;
}

export interface PeerConnection {
  participantId: string;
  connectionId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CalendarEvent {
  id: string;
  meetingId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  reminder?: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}

export enum NotificationType {
  MEETING_INVITATION = 'meeting_invitation',
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_STARTED = 'meeting_started',
  MEETING_ENDED = 'meeting_ended',
  RECORDING_READY = 'recording_ready'
}

export interface SocketEvents {
  // Connection events
  'connection': () => void;
  'disconnect': () => void;
  'error': (error: Error) => void;
  
  // Meeting events
  'join-meeting': (data: { meetingId: string; participantId: string }) => void;
  'leave-meeting': (data: { meetingId: string; participantId: string }) => void;
  'participant-joined': (participant: Participant) => void;
  'participant-left': (participantId: string) => void;
  
  // WebRTC signaling events
  'webrtc-offer': (data: WebRTCSignal) => void;
  'webrtc-answer': (data: WebRTCSignal) => void;
  'webrtc-ice-candidate': (data: WebRTCSignal) => void;
  
  // Media control events
  'toggle-audio': (data: { participantId: string; isMuted: boolean }) => void;
  'toggle-video': (data: { participantId: string; isVideoOff: boolean }) => void;
  'screen-share-started': (data: { participantId: string }) => void;
  'screen-share-stopped': (data: { participantId: string }) => void;
  
  // Chat events
  'send-message': (message: ChatMessage) => void;
  'new-message': (message: ChatMessage) => void;
  
  // Recording events
  'start-recording': (data: { meetingId: string }) => void;
  'stop-recording': (data: { meetingId: string }) => void;
  'recording-status': (data: { status: RecordingStatus }) => void;
}
