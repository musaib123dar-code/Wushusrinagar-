// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};

// Meeting Configuration
export const MEETING_CONFIG = {
  MAX_PARTICIPANTS: 100,
  MAX_RECORDING_DURATION: 3600000, // 1 hour in milliseconds
  CHAT_MESSAGE_LIMIT: 2000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  AUDIO_QUALITY_OPTIONS: {
    low: { sampleRate: 16000, channelCount: 1 },
    medium: { sampleRate: 32000, channelCount: 1 },
    high: { sampleRate: 48000, channelCount: 2 }
  },
  VIDEO_QUALITY_OPTIONS: {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 30 },
    high: { width: 1280, height: 720, frameRate: 30 },
    hd: { width: 1920, height: 1080, frameRate: 30 }
  }
};

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
  },
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // User events
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  
  // Meeting events
  MEETING_STARTED: 'meeting:started',
  MEETING_ENDED: 'meeting:ended',
  MEETING_PARTICIPANT_JOINED: 'meeting:participant-joined',
  MEETING_PARTICIPANT_LEFT: 'meeting:participant-left',
  
  // WebRTC signaling
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  
  // Media events
  MEDIA_STATE_CHANGED: 'media:state-changed',
  SCREEN_SHARE_STARTED: 'screen-share:started',
  SCREEN_SHARE_STOPPED: 'screen-share:stopped',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_MESSAGE_EDITED: 'chat:message-edited',
  CHAT_MESSAGE_DELETED: 'chat:message-deleted',
  
  // Recording events
  RECORDING_STARTED: 'recording:started',
  RECORDING_STOPPED: 'recording:stopped',
  RECORDING_READY: 'recording:ready'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'vc_user_token',
  USER_REFRESH_TOKEN: 'vc_user_refresh_token',
  USER_PROFILE: 'vc_user_profile',
  MEETING_PREFERENCES: 'vc_meeting_preferences',
  DEVICE_SETTINGS: 'vc_device_settings',
  THEME: 'vc_theme'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  MEETING_NOT_FOUND: 'Meeting not found.',
  MEETING_FULL: 'Meeting is full.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  DEVICE_ERROR: 'Could not access camera or microphone.',
  PERMISSION_DENIED: 'Camera/microphone permission denied.',
  WEBSOCKET_ERROR: 'WebSocket connection error.',
  RECORDING_ERROR: 'Recording failed. Please try again.',
  SCREEN_SHARE_ERROR: 'Screen sharing failed. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  MEETING_CREATED: 'Meeting created successfully.',
  MEETING_JOINED: 'Joined meeting successfully.',
  MEETING_LEFT: 'Left meeting successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  RECORDING_STARTED: 'Recording started.',
  RECORDING_STOPPED: 'Recording stopped.',
  SCREEN_SHARE_STARTED: 'Screen sharing started.',
  SCREEN_SHARE_STOPPED: 'Screen sharing stopped.'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,100}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  MEETING_TITLE: /^.{1,255}$/,
  MEETING_DESCRIPTION: /^.{0,1000}$/,
  CHAT_MESSAGE: /^.{1,2000}$/
};

// Platform Detection
export const PLATFORM = {
  IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  IS_DESKTOP: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  IS_IOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  IS_ANDROID: /Android/.test(navigator.userAgent),
  IS_SAFARI: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  IS_FIREFOX: /firefox/i.test(navigator.userAgent),
  IS_CHROME: /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent),
  IS_EDGE: /edg/i.test(navigator.userAgent)
};

// Feature Detection
export const FEATURES = {
  WEBRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  SCREEN_SHARE: !!(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices),
  SPEECH_RECOGNITION: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  NOTIFICATIONS: 'Notification' in window,
  SERVICE_WORKER: 'serviceWorker' in navigator,
  WEB_PUSH: 'PushManager' in window,
  BLUETOOTH: 'bluetooth' in navigator,
  USB: 'usb' in navigator
};

// Constants
export const CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  MESSAGE_DEBOUNCE: 300,
  AUDIO_LEVEL_SAMPLE_RATE: 100, // Hz
  VIDEO_QUALITY_CHECK_INTERVAL: 10000, // 10 seconds
  BANDWIDTH_ESTIMATION_INTERVAL: 5000 // 5 seconds
};