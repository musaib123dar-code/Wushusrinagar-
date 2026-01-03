# VideoConf - Comprehensive Video Conferencing Platform

A full-featured Zoom-like video conferencing application supporting web, iOS, Android, and desktop platforms.

## 🎯 Features

### Core Features
- ✅ **Video/Audio Conferencing** - Real-time P2P and group calling with WebRTC
- ✅ **Screen Sharing** - Share screen during meetings
- ✅ **Real-time Chat** - Messaging during meetings and persistent chat
- ✅ **Meeting Recording** - Record meetings to cloud storage
- ✅ **Meeting Scheduling** - Schedule meetings with calendar integration
- ✅ **User Authentication** - JWT-based auth with refresh tokens

### Platform Support
- ✅ **Web Application** - React-based responsive web client
- ✅ **Mobile Apps** - React Native for iOS and Android
- ✅ **Desktop Apps** - Electron for Windows, macOS, Linux

## 📁 Project Structure

```
/
├── backend/                 # Node.js/Express backend server
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & other middleware
│   │   ├── services/       # Business logic & services
│   │   ├── config/         # Configuration files
│   │   └── migrations/     # Database migrations
│   ├── package.json
│   └── tsconfig.json
│
├── web/                    # React web client
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API & WebRTC services
│   │   ├── stores/         # State management
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # Mobile screens
│   │   ├── components/     # React Native components
│   │   ├── navigation/     # Navigation setup
│   │   └── services/       # Mobile services
│   ├── App.tsx
│   └── package.json
│
├── desktop/                # Electron desktop app
│   ├── src/
│   │   ├── main.js         # Electron main process
│   │   └── preload.js      # Preload scripts
│   └── package.json
│
├── shared/                 # Shared types & utilities
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Shared utilities
│
└── infrastructure/         # DevOps & deployment
    ├── docker/             # Docker configurations
    ├── k8s/                # Kubernetes manifests
    └── ci/                 # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database:**
   ```bash
   # Create PostgreSQL database
   createdb videoconf_db
   
   # Run migrations
   npm run migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:3000`

### Web Client Setup

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Create .env.local
   echo "VITE_API_URL=http://localhost:3000/api" > .env.local
   echo "VITE_SOCKET_URL=http://localhost:3000" >> .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Web client will run on `http://localhost:5173`

### Mobile App Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Run on device/emulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

### Desktop App Setup

1. **Install dependencies:**
   ```bash
   cd desktop
   npm install
   ```

2. **Configure web app URL:**
   ```bash
   export WEB_APP_URL=http://localhost:5173
   ```

3. **Start Electron:**
   ```bash
   npm start
   ```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
cd infrastructure/docker
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API server
- Web client (Nginx)

Access the application at `http://localhost`

### Building Individual Images

```bash
# Backend
docker build -f infrastructure/docker/Dockerfile.backend -t videoconf-backend .

# Web
docker build -f infrastructure/docker/Dockerfile.web -t videoconf-web .
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

### Meeting Endpoints

#### Create Meeting
```http
POST /api/meetings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Team Standup",
  "description": "Daily team meeting",
  "scheduledStartTime": "2024-01-15T10:00:00Z",
  "scheduledEndTime": "2024-01-15T11:00:00Z"
}
```

#### Get Meeting by ID
```http
GET /api/meetings/:id
Authorization: Bearer <access_token>
```

#### Join Meeting by Code
```http
GET /api/meetings/code/:code
```

#### List My Meetings
```http
GET /api/meetings/my-meetings?limit=50&offset=0
Authorization: Bearer <access_token>
```

#### Start Meeting
```http
POST /api/meetings/:id/start
Authorization: Bearer <access_token>
```

#### End Meeting
```http
POST /api/meetings/:id/end
Authorization: Bearer <access_token>
```

## 🔌 WebRTC & Socket.io Events

### Client → Server Events

- `join-meeting` - Join a meeting room
- `leave-meeting` - Leave a meeting room
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Send ICE candidate
- `toggle-audio` - Toggle audio on/off
- `toggle-video` - Toggle video on/off
- `screen-share-started` - Start screen sharing
- `screen-share-stopped` - Stop screen sharing
- `send-message` - Send chat message
- `start-recording` - Start meeting recording
- `stop-recording` - Stop meeting recording

### Server → Client Events

- `participant-joined` - New participant joined
- `participant-left` - Participant left
- `existing-participants` - List of existing participants
- `webrtc-offer` - Receive WebRTC offer
- `webrtc-answer` - Receive WebRTC answer
- `webrtc-ice-candidate` - Receive ICE candidate
- `participant-audio-toggled` - Participant audio status changed
- `participant-video-toggled` - Participant video status changed
- `screen-share-started` - Screen sharing started
- `screen-share-stopped` - Screen sharing stopped
- `new-message` - New chat message received
- `recording-started` - Recording started
- `recording-stopped` - Recording stopped

## 🗄️ Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `username` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `avatar` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Meetings Table
- `id` (UUID, PK)
- `title` (VARCHAR)
- `description` (TEXT)
- `host_id` (UUID, FK → users)
- `meeting_code` (VARCHAR, UNIQUE)
- `password` (VARCHAR)
- `scheduled_start_time` (TIMESTAMP)
- `scheduled_end_time` (TIMESTAMP)
- `actual_start_time` (TIMESTAMP)
- `actual_end_time` (TIMESTAMP)
- `status` (ENUM: scheduled, live, ended, cancelled)
- `is_recording` (BOOLEAN)
- `max_participants` (INTEGER)
- `settings` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Participants Table
- `id` (UUID, PK)
- `meeting_id` (UUID, FK → meetings)
- `user_id` (UUID, FK → users)
- `display_name` (VARCHAR)
- `is_host` (BOOLEAN)
- `is_muted` (BOOLEAN)
- `is_video_off` (BOOLEAN)
- `is_screen_sharing` (BOOLEAN)
- `joined_at` (TIMESTAMP)
- `left_at` (TIMESTAMP)
- `connection_status` (ENUM)

### Messages Table
- `id` (UUID, PK)
- `meeting_id` (UUID, FK → meetings)
- `sender_id` (UUID)
- `sender_name` (VARCHAR)
- `recipient_id` (UUID)
- `content` (TEXT)
- `type` (ENUM: text, file, system)
- `created_at` (TIMESTAMP)

### Recordings Table
- `id` (UUID, PK)
- `meeting_id` (UUID, FK → meetings)
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `duration` (INTEGER)
- `file_url` (VARCHAR)
- `file_size` (BIGINT)
- `status` (ENUM: recording, processing, completed, failed)
- `created_at` (TIMESTAMP)

## 🔐 Security

- JWT-based authentication with access & refresh tokens
- Password hashing with bcrypt
- CORS protection
- Helmet.js for HTTP headers
- Rate limiting
- SQL injection prevention with parameterized queries

## 🌐 Cloud Deployment

### AWS Deployment

1. **Setup RDS PostgreSQL:**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier videoconf-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password <password>
   ```

2. **Setup ElastiCache Redis:**
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id videoconf-redis \
     --engine redis
   ```

3. **Deploy to ECS/EKS:**
   - Use provided Docker images
   - Configure environment variables
   - Setup load balancer

4. **Setup S3 for recordings:**
   ```bash
   aws s3 mb s3://videoconf-recordings
   ```

## 📊 Monitoring & Logging

- Application logs via Morgan
- Error tracking setup ready
- Health check endpoints available
- Database query logging enabled

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Web tests
cd web
npm test
```

## 📝 Development Guidelines

1. **Code Style:**
   - Use TypeScript for type safety
   - Follow ESLint rules
   - Format code with Prettier

2. **Git Workflow:**
   - Create feature branches
   - Write descriptive commit messages
   - Submit PRs for review

3. **API Design:**
   - RESTful conventions
   - Consistent error responses
   - Proper status codes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create GitHub issue
- Check documentation
- Contact support team

## 🎯 Future Roadmap

- [ ] Breakout rooms
- [ ] Virtual backgrounds
- [ ] AI noise cancellation
- [ ] Meeting transcription
- [ ] Calendar integrations (Google, Outlook)
- [ ] Meeting analytics
- [ ] Whiteboard feature
- [ ] Polls and surveys
- [ ] Waiting room improvements
- [ ] End-to-end encryption

## 📞 Contact

Project Link: https://github.com/yourusername/videoconf

---

Built with ❤️ using Node.js, React, React Native, and Electron
