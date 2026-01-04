# Video Conferencing API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Endpoints

#### Auth

##### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username123",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 900
  },
  "message": "User registered successfully"
}
```

##### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 900
  },
  "message": "Login successful"
}
```

##### POST `/auth/refresh-token`
Refresh expired access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

##### POST `/auth/logout`
Logout and revoke refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### Meetings

##### POST `/meetings`
Create a new meeting.

**Request Body:**
```json
{
  "title": "Team Standup",
  "description": "Daily team standup meeting",
  "isPrivate": false,
  "maxParticipants": 50,
  "startTime": "2024-01-15T10:00:00Z",
  "duration": 30,
  "recordingEnabled": true,
  "chatEnabled": true,
  "screenShareEnabled": true
}
```

##### GET `/meetings/user/me`
Get meetings created by the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

##### GET `/meetings/:meetingId`
Get meeting details by ID.

##### POST `/meetings/:meetingId/join`
Join a meeting.

**Request Body:**
```json
{
  "password": "meeting_password" // required if meeting is private
}
```

##### POST `/meetings/:meetingId/leave`
Leave a meeting.

##### POST `/meetings/:meetingId/start`
Start a meeting (host only).

##### POST `/meetings/:meetingId/end`
End a meeting (host only).

##### GET `/meetings/:meetingId/participants`
Get participants in a meeting.

#### Messages

##### POST `/messages`
Send a message in a meeting.

**Request Body:**
```json
{
  "meetingId": "uuid",
  "content": "Hello everyone!",
  "type": "text", // optional, defaults to "text"
  "replyToId": "uuid", // optional
  "mentions": ["user_id1", "user_id2"] // optional
}
```

##### GET `/messages/meeting/:meetingId`
Get messages for a meeting.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50, max: 100)
- `offset` (optional): Number of messages to skip
- `before` (optional): Get messages before this message ID

## WebSocket Events

### Connection
Connect to WebSocket server with authentication token:
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'jwt_access_token'
  }
});
```

### Events

#### User Events
- `user:join` - Join a meeting
- `user:leave` - Leave a meeting

#### Meeting Events
- `meeting:started` - Meeting has started
- `meeting:ended` - Meeting has ended
- `meeting:participant-joined` - New participant joined
- `meeting:participant-left` - Participant left

#### WebRTC Signaling
- `webrtc:offer` - WebRTC offer signal
- `webrtc:answer` - WebRTC answer signal
- `webrtc:ice-candidate` - ICE candidate signal

#### Media Events
- `media:state-changed` - Participant media state changed
- `screen-share:started` - Screen sharing started
- `screen-share:stopped` - Screen sharing stopped

#### Chat Events
- `chat:message` - New chat message
- `chat:message-edited` - Message was edited
- `chat:message-deleted` - Message was deleted

#### Recording Events
- `recording:started` - Recording started
- `recording:stopped` - Recording stopped
- `recording:ready` - Recording is ready for download

## Data Models

### User
```typescript
{
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
```

### Meeting
```typescript
{
  id: string;
  title: string;
  description?: string;
  hostId: string;
  isPrivate: boolean;
  password?: string;
  maxParticipants: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Message
```typescript
{
  id: string;
  meetingId: string;
  senderId: string;
  content: string;
  type: 'text' | 'emoji' | 'system' | 'file' | 'image';
  timestamp: Date;
  editedAt?: Date;
  replyToId?: string;
  mentions?: string[];
}
```

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional error code"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to:
- 100 requests per 15 minutes per IP address
- WebSocket connections: 10 concurrent connections per user

## WebRTC Configuration

### ICE Servers
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'username',
    credential: 'password'
  }
];
```

### Media Constraints
```javascript
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};
```