# ⚡ Quick Start Guide

Get VideoConf running in under 5 minutes!

## 🚀 Option 1: Docker (Fastest - Recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
# 1. Clone the repository
git clone <repository-url>
cd videoconf

# 2. Start everything with Docker
cd infrastructure/docker
docker-compose up -d

# 3. Wait for services to start (30 seconds)
sleep 30

# 4. Run database migrations
docker exec videoconf-backend npm run migrate

# 5. Access the application
open http://localhost
```

✅ **Done!** The application is now running at `http://localhost`

### What Just Happened?

Docker Compose started:
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ Backend API server (port 3000)
- ✅ Web client (port 80)

### Next Steps

1. Create an account at `http://localhost`
2. Login with your credentials
3. Create a new meeting
4. Invite participants using the meeting code

### Stopping the Application

```bash
docker-compose down

# To remove all data
docker-compose down -v
```

---

## 💻 Option 2: Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis 7+

### Automated Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd videoconf

# 2. Run setup script
./setup.sh

# 3. Follow the prompts and choose option 1 (Full local setup)
```

### Manual Setup

#### Step 1: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Create database
createdb videoconf_db

# Run migrations
npm run migrate

# Start backend
npm run dev
```

Backend running at `http://localhost:3000`

#### Step 2: Setup Web Client

```bash
# Open new terminal
cd web

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF

# Start web client
npm run dev
```

Web client running at `http://localhost:5173`

✅ **Done!** Access the application at `http://localhost:5173`

---

## 📱 Option 3: Mobile App

**Prerequisites:** Node.js 20+, Expo CLI

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start

# Press 'i' for iOS simulator or 'a' for Android emulator
```

**Note:** Make sure backend is running before starting mobile app.

---

## 🖥️ Option 4: Desktop App

**Prerequisites:** Node.js 20+, Web client running

```bash
cd desktop

# Install dependencies
npm install

# Start Electron
npm start
```

---

## ✅ Verify Installation

### Health Check

```bash
# Run health check script
./health-check.sh

# Or manually check
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-03T..."
}
```

### Test API

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🎯 Usage

### 1. Create Account

1. Open application in browser
2. Click "Register"
3. Fill in your details
4. Click "Create Account"

### 2. Create Meeting

1. Login to your account
2. Click "Create New Meeting"
3. Enter meeting title
4. Click "Create & Join"

### 3. Join Meeting

Share the meeting code with participants:
1. Others can join using the meeting code
2. Or share the meeting link

### 4. Meeting Controls

- 🎤 **Mute/Unmute** - Toggle audio
- 📹 **Video On/Off** - Toggle video
- 🖥️ **Share Screen** - Start screen sharing
- 💬 **Chat** - Send messages
- 🚪 **Leave** - Exit meeting

---

## 🐛 Troubleshooting

### Docker Issues

**Services not starting:**
```bash
docker-compose logs -f
```

**Port already in use:**
```bash
# Stop services using the ports
docker-compose down

# Check what's using the port
lsof -i :3000
lsof -i :5432
```

### Database Issues

**Connection failed:**
```bash
# Check PostgreSQL is running
docker-compose ps

# Or for local install
pg_isready
```

**Migration failed:**
```bash
# Re-run migrations
docker exec videoconf-backend npm run migrate
```

### Web Client Issues

**Can't connect to backend:**
- Verify backend is running on port 3000
- Check `.env.local` configuration
- Restart web dev server

**WebRTC not working:**
- Check browser console for errors
- Verify STUN/TURN server configuration
- Try using HTTPS (WebRTC requires secure context)

---

## 📚 Next Steps

### For Users
- [Complete Documentation](VIDEOCONF_README.md)
- [Feature Guide](VIDEOCONF_README.md#-features)

### For Developers
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [API Documentation](VIDEOCONF_README.md#-api-documentation)
- [Deployment Guide](DEPLOYMENT.md)

### For DevOps
- [Docker Deployment](DEPLOYMENT.md#1-docker-compose-recommended-for-quick-start)
- [AWS Deployment](DEPLOYMENT.md#2-aws-cloud-deployment)
- [Kubernetes Deployment](DEPLOYMENT.md#3-kubernetes-deployment)

---

## 🆘 Getting Help

### Resources
- 📖 [Full Documentation](VIDEOCONF_README.md)
- 🚢 [Deployment Guide](DEPLOYMENT.md)
- 🔧 [Environment Setup](ENVIRONMENT_SETUP.md)
- 📊 [Project Summary](PROJECT_SUMMARY.md)

### Support Channels
- 🐛 [GitHub Issues](https://github.com/username/videoconf/issues)
- 💬 [Discord Community](https://discord.gg/videoconf)
- 📧 Email: support@videoconf.com

### Common Commands

```bash
# Start Docker services
cd infrastructure/docker && docker-compose up -d

# Stop Docker services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Check health
./health-check.sh

# Run backend locally
cd backend && npm run dev

# Run web client locally
cd web && npm run dev

# Run migrations
cd backend && npm run migrate

# Run tests
cd backend && npm test
```

---

## 🎉 Success!

You now have a fully functional video conferencing platform!

**What you can do:**
- ✅ Video/audio conferencing
- ✅ Screen sharing
- ✅ Real-time chat
- ✅ Meeting scheduling
- ✅ Meeting recording (infrastructure ready)
- ✅ User authentication

**Ready for:**
- ✅ Development
- ✅ Testing
- ✅ Production deployment

---

<div align="center">
  <strong>Happy Conferencing! 🎥</strong>
  <br />
  <sub>Built with ❤️ by the VideoConf Team</sub>
</div>
