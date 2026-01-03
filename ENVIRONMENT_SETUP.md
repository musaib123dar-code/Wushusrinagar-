# Environment Setup Guide

Complete guide for setting up your development and production environments for VideoConf.

## 🖥️ Development Environment Setup

### Prerequisites Installation

#### 1. Node.js & npm

**macOS (using Homebrew):**
```bash
brew install node@20
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### 2. PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

Verify installation:
```bash
psql --version  # Should show 15.x
```

#### 3. Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
Use WSL2 or download from [redis.io](https://redis.io/download)

Verify installation:
```bash
redis-cli ping  # Should respond with PONG
```

#### 4. Git

**macOS:**
```bash
brew install git
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git
```

Verify installation:
```bash
git --version
```

### Optional Tools

#### Docker & Docker Compose

**macOS:**
Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

**Ubuntu:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

**Windows:**
Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

Verify:
```bash
docker --version
docker-compose --version
```

## 🚀 Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd videoconf
```

### 2. Automated Setup (Recommended)

```bash
./setup.sh
```

Follow the interactive prompts to choose your setup option.

### 3. Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videoconf_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# WebRTC
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

**Create Database:**

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE videoconf_db;

# Exit psql
\q

# Run migrations
npm run migrate
```

**Start Backend:**

```bash
npm run dev
```

Backend should now be running on `http://localhost:3000`

#### Web Client Setup

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

Web client should now be running on `http://localhost:5173`

#### Mobile Setup (Optional)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start
```

For iOS:
```bash
# Install CocoaPods (macOS only)
sudo gem install cocoapods

# Run on iOS simulator
npm run ios
```

For Android:
```bash
# Make sure Android Studio is installed
# Run on Android emulator
npm run android
```

#### Desktop Setup (Optional)

```bash
cd desktop

# Install dependencies
npm install

# Start Electron
npm start
```

## 🐳 Docker Development Setup

### Quick Start

```bash
cd infrastructure/docker
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000
- Web client on port 80

### Running Migrations with Docker

```bash
docker exec videoconf-backend npm run migrate
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stopping Services

```bash
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v
```

## 🔧 IDE Setup

### Visual Studio Code

**Recommended Extensions:**
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
```

**Workspace Settings (.vscode/settings.json):**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### WebStorm/IntelliJ IDEA

1. Open project folder
2. Enable TypeScript support
3. Configure ESLint
4. Configure Prettier
5. Set Node.js interpreter

## 🧪 Testing Environment

### Backend Testing

```bash
cd backend

# Install test dependencies
npm install --save-dev jest @types/jest

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Web Testing

```bash
cd web

# Run tests
npm test

# E2E tests
npm run test:e2e
```

## 🔐 Secrets Management

### Development

Use `.env` files (never commit to git):

```bash
# Generate secure secrets
openssl rand -base64 32

# For JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### Production

Use environment variables or secret managers:

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name videoconf/prod/jwt-secret \
  --secret-string "your-secret-here"
```

**Docker Secrets:**
```bash
echo "your-secret" | docker secret create jwt_secret -
```

## 📊 Monitoring Setup

### Health Checks

```bash
# Run health check script
./health-check.sh

# Or manually
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

### Logging

**Development:**
Logs appear in console with Morgan middleware.

**Production:**
Configure log aggregation:
- CloudWatch (AWS)
- Stackdriver (GCP)
- ELK Stack
- Datadog

## 🌐 Network Configuration

### Firewall Rules

**Development:**
- Allow port 3000 (Backend)
- Allow port 5173 (Web dev server)
- Allow port 5432 (PostgreSQL)
- Allow port 6379 (Redis)

**Production:**
- Allow port 443 (HTTPS)
- Allow port 80 (HTTP redirect)
- Allow WebSocket connections
- Configure TURN server ports

### TURN Server Setup (Required for Production)

```bash
# Install coturn
sudo apt-get install coturn

# Configure /etc/turnserver.conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com
external-ip=<your-server-ip>

# Start service
sudo systemctl start coturn
sudo systemctl enable coturn
```

## 🔄 Git Workflow

### Branch Strategy

```bash
# Main branches
main        # Production
develop     # Development
feat/*      # Feature branches

# Create feature branch
git checkout -b feat/video-conferencing-multi-platform-webrtc-socketio

# Work on feature
git add .
git commit -m "Add feature"

# Push to remote
git push origin feat/video-conferencing-multi-platform-webrtc-socketio
```

### Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Setup hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm test"
```

## 📱 Mobile Development Environment

### iOS Development

**Requirements:**
- macOS
- Xcode 14+
- iOS Simulator

**Setup:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Install dependencies
cd mobile
npm install
cd ios && pod install && cd ..

# Run on simulator
npm run ios
```

### Android Development

**Requirements:**
- Android Studio
- Android SDK
- Android Emulator or physical device

**Setup:**
```bash
# Install Android Studio
# Download from https://developer.android.com/studio

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Run on emulator
npm run android
```

## 🧹 Cleanup & Maintenance

### Clean Build Artifacts

```bash
# Backend
cd backend
rm -rf node_modules dist
npm install
npm run build

# Web
cd web
rm -rf node_modules dist
npm install
npm run build

# Mobile
cd mobile
rm -rf node_modules .expo
npm install
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update major versions (use with caution)
npx npm-check-updates -u
npm install
```

### Database Maintenance

```bash
# Backup database
pg_dump videoconf_db > backup.sql

# Restore database
psql videoconf_db < backup.sql

# Vacuum database
psql videoconf_db -c "VACUUM ANALYZE;"
```

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**2. Database connection failed:**
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**3. Redis connection failed:**
```bash
# Check Redis is running
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

**4. npm install fails:**
```bash
# Clear cache
npm cache clean --force

# Delete lock file and try again
rm package-lock.json
npm install
```

**5. WebRTC not connecting:**
- Check STUN/TURN server configuration
- Verify firewall rules
- Check browser console for errors
- Test ICE candidate gathering

### Getting Help

1. Check documentation: `VIDEOCONF_README.md`
2. Run health check: `./health-check.sh`
3. Check logs: `docker-compose logs -f`
4. Review API collection: `API_COLLECTION.json`
5. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details

## ✅ Verification Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Database created and migrated
- [ ] Backend running on port 3000
- [ ] Web dependencies installed
- [ ] Web .env.local configured
- [ ] Web running on port 5173
- [ ] Health checks passing
- [ ] Can register user
- [ ] Can login
- [ ] Can create meeting
- [ ] WebSocket connection working

## 📚 Additional Resources

- **Node.js Docs:** https://nodejs.org/docs/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Redis Docs:** https://redis.io/documentation
- **React Docs:** https://react.dev/
- **WebRTC Docs:** https://webrtc.org/getting-started/
- **Socket.io Docs:** https://socket.io/docs/

---

For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
