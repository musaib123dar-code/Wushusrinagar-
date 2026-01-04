# 🚀 START HERE - VideoConf Platform

Welcome! This guide will get you from zero to a running video conferencing platform in minutes.

## ⚡ Super Quick Start (Docker - 5 minutes)

**Prerequisites:** Docker Desktop installed and running

```bash
# 1. Navigate to docker directory
cd infrastructure/docker

# 2. Start everything
docker-compose up -d

# 3. Wait 30 seconds for services to start
sleep 30

# 4. Run database migrations
docker exec videoconf-backend npm run migrate

# 5. Open in browser
open http://localhost
# or visit: http://localhost
```

**That's it! You should see the login/register page.**

---

## 🐛 If That Didn't Work

### Quick Fixes:

**1. Docker not running?**
```bash
# Mac/Windows: Open Docker Desktop app
# Linux:
sudo systemctl start docker
```

**2. Port already in use?**
```bash
# Check what's using port 80
lsof -i :80

# Stop it or edit docker-compose.yml to use different port
```

**3. See errors?**
```bash
# Check logs
docker-compose logs -f backend

# Most common: database not ready
# Solution: Wait longer and run migration again
sleep 30
docker exec videoconf-backend npm run migrate
```

**4. Still not working?**
```bash
# Full reset and try again
docker-compose down -v
docker-compose up -d
sleep 30
docker exec videoconf-backend npm run migrate
```

---

## 💻 Alternative: Local Development Setup

**Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis 7+

### Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh

# Choose option 1 (Full local setup)
# Follow the prompts
```

### Manual Setup

#### Step 1: Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Create database
createdb videoconf_db

# Run migrations
npm run migrate

# Start backend
npm run dev
```

Backend should now be running at `http://localhost:3000`

#### Step 2: Web Client (New Terminal)

```bash
cd web

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF

# Start dev server
npm run dev
```

Web client should now be running at `http://localhost:5173`

---

## ✅ Verify It's Working

### Run Health Check

```bash
./health-check.sh
```

You should see:
- ✅ Backend is healthy
- ✅ API is healthy
- ✅ Database is connected
- ✅ Socket.io endpoint is accessible

### Test in Browser

1. **Open the app:**
   - Docker: http://localhost
   - Local: http://localhost:5173

2. **Register a new account:**
   - Click "Register"
   - Fill in your details
   - Click "Create Account"

3. **Create a meeting:**
   - Click "Create New Meeting"
   - Enter a title
   - Click "Create & Join"

4. **Test video:**
   - Allow camera/microphone access
   - You should see your video preview

---

## 🎯 What You Can Do Now

### Basic Features

- ✅ **Register/Login** - Create account and authenticate
- ✅ **Create Meetings** - Schedule and start meetings
- ✅ **Join Meetings** - Join using meeting code
- ✅ **Video/Audio** - Real-time conferencing
- ✅ **Chat** - Send messages during meetings
- ✅ **Screen Share** - Share your screen
- ✅ **Meeting Controls** - Mute/unmute, video on/off

### Test It Out

1. **Single User Test:**
   ```bash
   # Open http://localhost (or :5173)
   # Create meeting
   # Allow camera/mic
   # See yourself in video
   ```

2. **Multi-User Test:**
   ```bash
   # Open in two different browsers:
   # Browser 1: Create meeting, note the meeting code
   # Browser 2: Join with the meeting code
   # Both should see each other
   ```

3. **API Test:**
   ```bash
   # Test registration
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@test.com",
       "username": "testuser",
       "password": "password123"
     }'
   
   # Test login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@test.com",
       "password": "password123"
     }'
   ```

---

## 📚 Next Steps

### Explore the Platform

1. **Mobile App (Optional):**
   ```bash
   cd mobile
   npm install
   npm start
   # Press 'i' for iOS or 'a' for Android
   ```

2. **Desktop App (Optional):**
   ```bash
   cd desktop
   npm install
   npm start
   ```

### Learn More

- **[QUICK_START.md](QUICK_START.md)** - Comprehensive quick start guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Fix common issues
- **[VIDEOCONF_README.md](VIDEOCONF_README.md)** - Complete documentation
- **[API_COLLECTION.json](API_COLLECTION.json)** - API examples for Postman/Insomnia

### Development

- **[ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)** - Detailed dev environment setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **Backend API:** http://localhost:3000/api
- **API Health:** http://localhost:3000/api/health

---

## 🔧 Common Commands

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Run migrations
docker exec videoconf-backend npm run migrate

# Access database
docker exec -it videoconf-db psql -U postgres -d videoconf_db
```

### Local Development

```bash
# Backend
cd backend
npm run dev        # Start dev server
npm run build      # Build for production
npm run migrate    # Run database migrations

# Web
cd web
npm run dev        # Start dev server
npm run build      # Build for production

# Mobile
cd mobile
npm start          # Start Expo
npm run ios        # Run iOS simulator
npm run android    # Run Android emulator

# Desktop
cd desktop
npm start          # Start Electron
npm run build      # Build desktop app
```

---

## 🆘 Getting Help

### Something Not Working?

1. **Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Covers 99% of issues

2. **Run diagnostics:**
   ```bash
   ./health-check.sh
   ```

3. **Check logs:**
   ```bash
   # Docker
   docker-compose logs -f backend
   
   # Local
   # Check the terminal where you ran npm run dev
   ```

4. **Reset everything:**
   ```bash
   # Docker
   docker-compose down -v
   docker-compose up -d
   
   # Local
   dropdb videoconf_db
   createdb videoconf_db
   cd backend && npm run migrate
   ```

### Documentation

- **User Guide:** [VIDEOCONF_README.md](VIDEOCONF_README.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Setup Guide:** [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project Info:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## ✨ You're All Set!

The VideoConf platform is now running. Here's what to do:

1. ✅ **Test it works** - Open browser, register, create meeting
2. ✅ **Explore features** - Try video, chat, screen sharing
3. ✅ **Read docs** - Learn about all features
4. ✅ **Develop** - Start building your features

**Default URLs:**
- **Web (Docker):** http://localhost
- **Web (Local):** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Docs:** [API_COLLECTION.json](API_COLLECTION.json)

**Need help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

<div align="center">
  <strong>🎉 Happy Conferencing! 🎥</strong>
  <br />
  <sub>Built with ❤️ by the VideoConf Team</sub>
</div>
