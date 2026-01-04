# 🎥 VideoConf - Complete Video Conferencing Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Desktop-purple.svg)]()

**A production-ready, Zoom-like video conferencing platform supporting web, iOS, Android, and desktop**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Features](#-features) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🚀 Quick Start

### Step 1: Test Your Setup

```bash
./test-setup.sh
```

This will check if you have everything you need installed.

### Step 2: Choose Your Method

#### 🐳 **Option A: Docker (Recommended - 5 minutes)**

```bash
# Navigate to docker directory
cd infrastructure/docker

# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run database migrations
docker exec videoconf-backend npm run migrate

# Open in browser
open http://localhost
# or visit: http://localhost
```

**✅ Done! The app is running at http://localhost**

#### 💻 **Option B: Local Development**

```bash
# Run automated setup
./setup.sh

# Choose option 1 for full local setup
# or option 2 for Docker setup
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[START_HERE.md](START_HERE.md)** | 🎯 **Start here first!** Complete getting started guide |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 🔧 Fix common issues and errors |
| **[QUICK_START.md](QUICK_START.md)** | ⚡ 5-minute quick start guide |
| **[VIDEOCONF_README.md](VIDEOCONF_README.md)** | 📖 Complete platform documentation |
| **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** | 🛠️ Detailed environment setup |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | 🚢 Production deployment guide |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | 📊 Project overview and architecture |
| **[API_COLLECTION.json](API_COLLECTION.json)** | 🔌 API testing collection (Postman/Insomnia) |

---

## ✨ Features

### Core Capabilities

- ✅ **Real-time Video & Audio Conferencing** - WebRTC-based peer-to-peer and group calls
- ✅ **Screen Sharing** - Share your screen with meeting participants
- ✅ **Real-time Chat** - In-meeting chat and persistent messaging
- ✅ **Meeting Recording** - Record meetings to cloud storage (infrastructure ready)
- ✅ **Meeting Scheduling** - Schedule meetings with calendar integration
- ✅ **User Authentication** - Secure JWT-based authentication with refresh tokens

### Platform Support

| Platform | Status | Technology |
|----------|--------|------------|
| 🌐 **Web** | ✅ Ready | React + Vite + TypeScript |
| 📱 **iOS** | ✅ Ready | React Native + Expo |
| 📱 **Android** | ✅ Ready | React Native + Expo |
| 💻 **Desktop** | ✅ Ready | Electron (Windows/Mac/Linux) |

### Technical Stack

**Backend:**
- Node.js 20+ with Express.js
- PostgreSQL 15+ for data storage
- Redis 7+ for caching
- Socket.io for real-time communication
- WebRTC for video/audio streaming

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Zustand for state management
- Axios for API calls

**Infrastructure:**
- Docker & Docker Compose
- Nginx for reverse proxy
- GitHub Actions for CI/CD
- AWS/Cloud ready

---

## 🎯 Usage

### 1. Register & Login

```bash
# Open the app
http://localhost        # Docker
http://localhost:5173   # Local dev

# Register a new account
# Login with your credentials
```

### 2. Create a Meeting

```bash
# Click "Create New Meeting"
# Enter meeting title
# Click "Create & Join"
```

### 3. Join a Meeting

```bash
# Share the meeting code with participants
# Others can join using the code
# Or share the direct meeting link
```

### 4. Meeting Controls

- 🎤 **Mute/Unmute** - Toggle audio on/off
- 📹 **Video On/Off** - Toggle video stream
- 🖥️ **Share Screen** - Start/stop screen sharing
- 💬 **Chat** - Send text messages
- 🚪 **Leave** - Exit the meeting

---

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Create database and run migrations
createdb videoconf_db
npm run migrate

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### Web Client Development

```bash
cd web

# Install dependencies
npm install

# Setup environment
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF

# Start development server
npm run dev
```

Web client runs on `http://localhost:5173`

### Mobile Development

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Desktop Development

```bash
cd desktop

# Install dependencies
npm install

# Start Electron
npm start

# Build for distribution
npm run build
```

---

## 🐳 Docker

### Quick Commands

```bash
# Start services
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# Run migrations
docker exec videoconf-backend npm run migrate

# Access database
docker exec -it videoconf-db psql -U postgres -d videoconf_db
```

### Services

- **PostgreSQL** - Port 5432
- **Redis** - Port 6379
- **Backend API** - Port 3000
- **Web Client** - Port 80

---

## ✅ Health Checks

### Automated Check

```bash
./health-check.sh
```

### Manual Checks

```bash
# Backend health
curl http://localhost:3000/health

# API health (with database check)
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"..."}
```

---

## 🐛 Troubleshooting

### Common Issues

**"Not working"**
- Read [START_HERE.md](START_HERE.md) for step-by-step setup
- Run `./test-setup.sh` to check your environment
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions

**Docker containers not starting**
```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs -f

# Restart services
docker-compose down
docker-compose up -d
```

**Database connection failed**
```bash
# Docker: Wait for database to be ready
sleep 30
docker exec videoconf-backend npm run migrate

# Local: Check PostgreSQL is running
pg_isready
```

**Port already in use**
```bash
# Find what's using the port
lsof -i :3000  # Backend
lsof -i :80    # Web (Docker)
lsof -i :5173  # Web (Local)

# Kill the process or change ports
```

**See detailed solutions in [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## 📊 Project Structure

```
videoconf/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── migrations/     # Database migrations
│   │   └── config/         # Configuration
│   └── package.json
│
├── web/                    # React web client
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API & WebRTC services
│   │   └── stores/         # State management
│   └── package.json
│
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # Mobile screens
│   │   └── components/     # Mobile components
│   └── package.json
│
├── desktop/                # Electron desktop app
│   ├── src/
│   │   ├── main.js         # Main process
│   │   └── preload.js      # Preload scripts
│   └── package.json
│
├── shared/                 # Shared code
│   └── types/              # TypeScript types
│
└── infrastructure/         # DevOps
    ├── docker/             # Docker configs
    ├── ci/                 # CI/CD pipelines
    └── k8s/                # Kubernetes (structure)
```

---

## 🔐 Security

- ✅ JWT authentication with refresh tokens
- ✅ Bcrypt password hashing
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention
- ✅ Rate limiting ready
- ✅ Environment variable configuration

---

## 📝 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Meetings

```bash
# Create meeting
POST /api/meetings
Authorization: Bearer <token>
Content-Type: application/json
{
  "title": "Team Meeting",
  "description": "Weekly sync"
}

# Get meeting
GET /api/meetings/:id
Authorization: Bearer <token>

# List my meetings
GET /api/meetings/my-meetings
Authorization: Bearer <token>
```

**See [API_COLLECTION.json](API_COLLECTION.json) for complete API documentation**

---

## 🚢 Deployment

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guides:

- Docker Compose deployment
- AWS (ECS/Fargate) deployment
- Kubernetes deployment
- TURN server setup
- SSL/TLS configuration

### Quick Deploy (Docker)

```bash
# Edit environment variables
cd infrastructure/docker
nano docker-compose.yml

# Deploy
docker-compose up -d

# Run migrations
docker exec videoconf-backend npm run migrate
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

1. **Documentation** - Check the docs folder
   - [START_HERE.md](START_HERE.md) - Getting started
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
   - [VIDEOCONF_README.md](VIDEOCONF_README.md) - Complete docs

2. **Run Diagnostics**
   ```bash
   ./test-setup.sh      # Check your setup
   ./health-check.sh    # Check running services
   ```

3. **Check Logs**
   ```bash
   docker-compose logs -f backend  # Docker
   # or check terminal where npm run dev is running
   ```

### Resources

- 📖 [Complete Documentation](VIDEOCONF_README.md)
- 🚀 [Quick Start Guide](QUICK_START.md)
- 🔧 [Troubleshooting Guide](TROUBLESHOOTING.md)
- 🛠️ [Environment Setup](ENVIRONMENT_SETUP.md)
- 🚢 [Deployment Guide](DEPLOYMENT.md)

---

## ⭐ Quick Links

| Link | Description |
|------|-------------|
| **Backend API** | http://localhost:3000 |
| **API Health** | http://localhost:3000/api/health |
| **Web App (Docker)** | http://localhost |
| **Web App (Local)** | http://localhost:5173 |
| **API Collection** | [API_COLLECTION.json](API_COLLECTION.json) |

---

<div align="center">

### 🎉 Ready to Start?

```bash
# Test your setup
./test-setup.sh

# Quick start with Docker
cd infrastructure/docker && docker-compose up -d
sleep 30 && docker exec videoconf-backend npm run migrate

# Or run automated setup
./setup.sh
```

**📚 For detailed instructions, see [START_HERE.md](START_HERE.md)**

---

**Built with ❤️ using Node.js, React, React Native, and Electron**

[⬆ Back to Top](#-videoconf---complete-video-conferencing-platform)

</div>
