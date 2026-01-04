// Database configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'video_conferencing',
    ssl: process.env.NODE_ENV === 'production'
  },
  
  // JWT configuration
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  
  // Redis configuration (for sessions and caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  // File storage configuration
  storage: {
    // AWS S3 configuration
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'video-conferencing-recordings'
    },
    
    // Local storage configuration
    local: {
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      recordingPath: process.env.RECORDING_PATH || './recordings'
    }
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@videoconf.com'
  },
  
  // WebRTC configuration
  webrtc: {
    stunServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    turnServer: {
      urls: process.env.TURN_SERVER_URL || '',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || ''
    }
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Meeting configuration
  meeting: {
    defaultMaxParticipants: parseInt(process.env.DEFAULT_MAX_PARTICIPANTS || '100', 10),
    maxRecordingDuration: parseInt(process.env.MAX_RECORDING_DURATION || '3600', 10), // 1 hour
    recordingRetentionDays: parseInt(process.env.RECORDING_RETENTION_DAYS || '30', 10)
  },
  
  // Socket.io configuration
  socket: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  }
};