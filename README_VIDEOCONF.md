# 🎥 VideoConf - Enterprise Video Conferencing Platform

> A comprehensive, production-ready Zoom-like video conferencing application supporting web, iOS, Android, and desktop platforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Quick Start

Get up and running in minutes:

```bash
# Clone the repository
git clone <repository-url>
cd videoconf

# Run automated setup
./setup.sh

# Or use Docker Compose (recommended)
cd infrastructure/docker
docker-compose up -d
```

Access the application at `http://localhost`

## ✨ Features

### Core Capabilities
- ✅ **Multi-party Video Conferencing** - Real-time HD video with WebRTC
- ✅ **Screen Sharing** - Share your screen with participants
- ✅ **Real-time Chat** - In-meeting chat with emoji support
- ✅ **Meeting Recording** - Record to cloud storage
- ✅ **Meeting Scheduling** - Schedule and manage meetings
- ✅ **User Authentication** - Secure JWT-based authentication

### Platform Support
- 🌐 **Web** - Modern responsive React application
- 📱 **Mobile** - Native iOS & Android via React Native
- 💻 **Desktop** - Windows, macOS, Linux via Electron

### Technical Highlights
- WebRTC for peer-to-peer video/audio
- Socket.io for real-time signaling
- PostgreSQL for data persistence
- Redis for caching and sessions
- Docker-ready with compose files
- AWS/Cloud compatible architecture

## 📋 Requirements

### For Development
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### For Docker Deployment
- Docker 20+
- Docker Compose 2+

## 📁 Project Structure

```
videoconf/
├── backend/              # Node.js/Express API server
├── web/                  # React web client
├── mobile/               # React Native mobile app
├── desktop/              # Electron desktop app
├── shared/               # Shared TypeScript types
├── infrastructure/       # Docker, K8s, CI/CD configs
├── VIDEOCONF_README.md   # Comprehensive documentation
├── DEPLOYMENT.md         # Production deployment guide
└── setup.sh             # Automated setup script
```

## 🎯 Documentation

- **[📖 Complete Documentation](VIDEOCONF_README.md)** - Full API docs, architecture, and guides
- **[🚢 Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[🔧 API Reference](VIDEOCONF_README.md#-api-documentation)** - REST API endpoints
- **[🔌 WebRTC Events](VIDEOCONF_README.md#-webrtc--socketio-events)** - Socket.io event reference

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run migrate
npm run dev
```

Server runs on `http://localhost:3000`

### Web Client Development

```bash
cd web
npm install
npm run dev
```

Client runs on `http://localhost:5173`

### Mobile Development

```bash
cd mobile
npm install
npm start
# Then press 'i' for iOS or 'a' for Android
```

### Desktop Development

```bash
cd desktop
npm install
npm start
```

## 🐳 Docker Deployment

### Local Docker Development

```bash
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build images
docker build -f infrastructure/docker/Dockerfile.backend -t videoconf-backend .
docker build -f infrastructure/docker/Dockerfile.web -t videoconf-web .

# Push to registry
docker push your-registry/videoconf-backend:latest
docker push your-registry/videoconf-web:latest
```

## ☁️ Cloud Deployment

### AWS Deployment
- ECS/Fargate for containers
- RDS for PostgreSQL
- ElastiCache for Redis
- S3 for recordings storage
- CloudFront for CDN

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Kubernetes Deployment
- Helm charts provided
- Horizontal Pod Autoscaling configured
- Ingress with SSL/TLS

## 🔐 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- CORS protection
- Rate limiting
- SQL injection prevention
- Helmet.js security headers

## 📊 Architecture

```
┌─────────────┐
│   Clients   │ (Web, Mobile, Desktop)
└──────┬──────┘
       │
┌──────▼──────┐
│  API Server │ (Node.js/Express)
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼────┐
│ DB  │ │Redis │
└─────┘ └──────┘
```

### WebRTC Architecture

```
Peer A ←──WebRTC──→ Peer B
   │                    │
   └────Socket.io───────┘
          │
     Signaling Server
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Web tests
cd web
npm test

# E2E tests
npm run test:e2e
```

## 📈 Performance

- Supports 100+ participants per meeting
- Sub-second latency for messaging
- Horizontal scaling ready
- CDN integration for global reach
- WebSocket connection pooling

## 🔧 Configuration

### Environment Variables

Key configuration options:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_NAME=videoconf_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m

# WebRTC
TURN_SERVER_URL=turn:your-server.com:3478
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

See `.env.example` for all options.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Examples

### Create a Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Standup",
    "description": "Daily team meeting",
    "scheduledStartTime": "2024-01-15T10:00:00Z"
  }'
```

### Join a Meeting

```javascript
import { webrtcService } from './services/webrtc';

// Connect to signaling server
webrtcService.connect(accessToken);

// Get local media
const stream = await webrtcService.getLocalStream();

// Join meeting
webrtcService.joinMeeting(meetingId, participantId, displayName);
```

## 🎯 Roadmap

- [ ] Virtual backgrounds with AI
- [ ] Live transcription
- [ ] Breakout rooms
- [ ] Polls and surveys
- [ ] Whiteboard collaboration
- [ ] Calendar integrations (Google, Outlook)
- [ ] End-to-end encryption
- [ ] Meeting analytics dashboard

## 🐛 Troubleshooting

### Common Issues

**WebSocket connection failed**
- Check CORS settings
- Verify firewall rules
- Ensure WebSocket support in proxy

**WebRTC not connecting**
- Configure TURN server
- Check firewall for UDP ports
- Verify ICE candidates

See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting) for more solutions.

## 📞 Support

- 📧 Email: support@videoconf.com
- 💬 Discord: [Join our community](https://discord.gg/videoconf)
- 🐛 Issues: [GitHub Issues](https://github.com/username/videoconf/issues)
- 📖 Docs: [Documentation](VIDEOCONF_README.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with these amazing technologies:
- [Node.js](https://nodejs.org/)
- [React](https://reactjs.org/)
- [React Native](https://reactnative.dev/)
- [Electron](https://www.electronjs.org/)
- [WebRTC](https://webrtc.org/)
- [Socket.io](https://socket.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=username/videoconf&type=Date)](https://star-history.com/#username/videoconf&Date)

---

<div align="center">
  <strong>Built with ❤️ by the VideoConf Team</strong>
  <br />
  <sub>© 2024 VideoConf. All rights reserved.</sub>
</div>
