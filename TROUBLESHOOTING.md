# 🔧 Troubleshooting Guide

This guide will help you diagnose and fix common issues with the VideoConf platform.

## 🚨 Quick Diagnosis

### Step 1: Identify What's Not Working

Run this diagnostic script:

```bash
# Make scripts executable
chmod +x setup.sh health-check.sh

# Check if files exist
echo "Checking critical files..."
test -f backend/src/migrations/001_initial_schema.sql && echo "✅ Migration file exists" || echo "❌ Migration file missing"
test -f backend/package.json && echo "✅ Backend package.json exists" || echo "❌ Backend package.json missing"
test -f web/package.json && echo "✅ Web package.json exists" || echo "❌ Web package.json missing"
test -f infrastructure/docker/docker-compose.yml && echo "✅ Docker compose exists" || echo "❌ Docker compose missing"
```

### Step 2: Choose Your Setup Method

#### Option A: Docker (Easiest)

```bash
# Navigate to docker directory
cd infrastructure/docker

# Check Docker is running
docker ps

# If Docker not running, start Docker Desktop or:
sudo systemctl start docker  # Linux
# or open Docker Desktop app on Mac/Windows

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Common Docker Issues:**

1. **"Cannot connect to Docker daemon"**
   ```bash
   # Linux: Start Docker service
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   # Then logout and login again
   
   # Mac/Windows: Start Docker Desktop application
   ```

2. **"Port already in use"**
   ```bash
   # Find what's using the port
   lsof -i :3000  # Backend
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   lsof -i :80    # Web
   
   # Kill the process or change ports in docker-compose.yml
   ```

3. **"Build failed"**
   ```bash
   # Clean rebuild
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Backend container keeps restarting**
   ```bash
   # Check logs
   docker logs videoconf-backend
   
   # Most likely: Database not ready yet
   # Solution: Wait 30 seconds after starting containers
   sleep 30
   
   # Then run migrations
   docker exec videoconf-backend npm run migrate
   ```

#### Option B: Local Development

**1. Backend Not Starting**

```bash
cd backend

# Check Node version (must be 20+)
node --version

# Install dependencies
npm install

# Check if .env exists
test -f .env || cp .env.example .env

# Edit .env with your settings
nano .env  # or code .env

# Start PostgreSQL
# Mac:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL from Services or pgAdmin

# Create database
createdb videoconf_db

# Or using psql:
psql postgres -c "CREATE DATABASE videoconf_db;"

# Run migrations
npm run migrate

# Start backend
npm run dev
```

**Backend Error Messages:**

- **"Cannot find module"**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

- **"Database connection failed"**
  ```bash
  # Check PostgreSQL is running
  pg_isready
  
  # Check connection details in .env
  # Make sure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD are correct
  
  # Test connection manually
  psql -h localhost -U postgres -d videoconf_db
  ```

- **"Redis connection failed"**
  ```bash
  # Check Redis is running
  redis-cli ping
  
  # Start Redis
  # Mac:
  brew services start redis
  
  # Linux:
  sudo systemctl start redis-server
  ```

- **"Migration failed"**
  ```bash
  # Make sure database exists
  psql postgres -c "CREATE DATABASE videoconf_db;"
  
  # Check migration file exists
  ls -la backend/src/migrations/001_initial_schema.sql
  
  # Run migration again
  cd backend
  npm run migrate
  ```

**2. Web Client Not Starting**

```bash
cd web

# Check Node version
node --version

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF

# Start dev server
npm run dev
```

**Web Client Error Messages:**

- **"Cannot find module"**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

- **"Failed to fetch"**
  - Make sure backend is running on port 3000
  - Check VITE_API_URL in .env.local
  - Check CORS settings in backend .env

- **"WebSocket connection failed"**
  - Check backend is running
  - Check VITE_SOCKET_URL in .env.local
  - Make sure Socket.io is working: `curl http://localhost:3000/socket.io/`

## 🐛 Specific Issues

### Issue: "npm install fails"

```bash
# Clear npm cache
npm cache clean --force

# Delete lock file
rm package-lock.json

# Try again
npm install

# If still fails, check Node version
node --version  # Must be 20+

# Update npm
npm install -g npm@latest
```

### Issue: "TypeScript errors"

```bash
# Backend
cd backend
npm run build

# Web
cd web
npm run build

# If errors persist, check tsconfig.json exists
```

### Issue: "Can't login/register"

```bash
# Check backend logs
docker logs videoconf-backend  # Docker
# or check terminal where npm run dev is running

# Check database
docker exec -it videoconf-db psql -U postgres -d videoconf_db -c "SELECT * FROM users;"

# Check API is responding
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Issue: "Video/Audio not working"

1. **Check browser console for errors**
   - Open Developer Tools (F12)
   - Look at Console tab

2. **Check WebRTC requirements:**
   - Must use HTTPS in production (or localhost)
   - Camera/microphone permissions granted
   - Check browser support: Chrome, Firefox, Safari, Edge

3. **Test getUserMedia:**
   ```javascript
   // In browser console
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => console.log('✅ Media access OK', stream))
     .catch(err => console.error('❌ Media access failed:', err));
   ```

4. **Check STUN/TURN configuration:**
   - For local testing, Google's STUN should work
   - For production, setup your own TURN server

### Issue: "WebSocket/Socket.io not connecting"

```bash
# Test Socket.io endpoint
curl http://localhost:3000/socket.io/

# Should return: {"code":0,"message":"Transport unknown"}
# This is normal - it means Socket.io is working

# Check CORS in backend .env
# Make sure it includes your web client URL
CORS_ORIGIN=http://localhost:5173

# Check browser console for CORS errors
```

### Issue: "Database already exists" error

```bash
# Drop and recreate database
dropdb videoconf_db
createdb videoconf_db

# Run migrations again
cd backend
npm run migrate
```

## 📋 Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check services are running
# Docker:
docker-compose ps

# Local:
ps aux | grep node
ps aux | grep postgres

# 2. Check health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/health

# 3. Test API
# Register user
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

# 4. Test database
# Docker:
docker exec -it videoconf-db psql -U postgres -d videoconf_db -c "\dt"

# Local:
psql -U postgres -d videoconf_db -c "\dt"

# 5. Test web client
# Open browser: http://localhost:5173
# Or http://localhost if using Docker

# 6. Run health check script
./health-check.sh
```

## 🔍 Debug Mode

### Enable Detailed Logging

**Backend:**
```bash
# In backend/.env
NODE_ENV=development

# Restart backend
```

**Web Client:**
```javascript
// In browser console
localStorage.setItem('debug', '*');
// Reload page
```

### Check Logs

**Docker:**
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Local:**
- Backend: Check terminal where `npm run dev` is running
- Web: Check browser Developer Tools → Console
- Database: Check PostgreSQL logs
  ```bash
  # Mac
  tail -f /usr/local/var/log/postgres.log
  
  # Linux
  sudo tail -f /var/log/postgresql/postgresql-15-main.log
  ```

## 🆘 Still Not Working?

### Collect Debug Information

```bash
# Create debug report
cat > debug-report.txt << EOF
=== System Information ===
OS: $(uname -a)
Node: $(node --version)
npm: $(npm --version)
Docker: $(docker --version 2>&1)

=== File Check ===
Backend files:
$(ls -la backend/src/ 2>&1)

Migration file:
$(test -f backend/src/migrations/001_initial_schema.sql && echo "EXISTS" || echo "MISSING")

Web files:
$(ls -la web/src/ 2>&1)

=== Service Status ===
Docker containers:
$(docker ps -a 2>&1)

PostgreSQL:
$(pg_isready 2>&1)

Redis:
$(redis-cli ping 2>&1)

=== Health Checks ===
Backend health:
$(curl -s http://localhost:3000/health 2>&1)

API health:
$(curl -s http://localhost:3000/api/health 2>&1)

=== Recent Errors ===
Backend logs:
$(docker logs --tail=50 videoconf-backend 2>&1)
EOF

cat debug-report.txt
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v  # Docker
# or kill all node processes

# Clean everything
rm -rf backend/node_modules backend/dist
rm -rf web/node_modules web/dist
rm -rf mobile/node_modules
rm -rf desktop/node_modules

# Drop database
dropdb videoconf_db

# Start fresh
./setup.sh
```

## 📞 Get Help

1. **Check Documentation:**
   - [QUICK_START.md](QUICK_START.md) - Quick setup guide
   - [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Detailed setup
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

2. **Common Solutions:**
   - 90% of issues: Missing dependencies or environment variables
   - Run: `./setup.sh` for automated setup
   - Run: `./health-check.sh` to diagnose issues

3. **Report Issues:**
   - Include output of `debug-report.txt`
   - Specify what you're trying to do
   - Include error messages
   - Mention which setup method you used (Docker/Local)

## ✅ Success Indicators

You'll know everything is working when:

- ✅ `./health-check.sh` shows all green checkmarks
- ✅ `curl http://localhost:3000/health` returns `{"status":"ok"}`
- ✅ `curl http://localhost:3000/api/health` shows `"database":"connected"`
- ✅ You can open http://localhost (Docker) or http://localhost:5173 (Local)
- ✅ You can register a new account
- ✅ You can login
- ✅ You can create a meeting
- ✅ You can see video preview (camera permission granted)

---

**Most Common Solution:** Run the automated setup!

```bash
./setup.sh
# Choose option 2 for Docker (easiest)
# or option 1 for local development
```
