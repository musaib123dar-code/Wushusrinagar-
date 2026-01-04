# Video Conferencing Application - Development Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)

### Optional Software
- **Docker & Docker Compose** - For containerized deployment
- **MongoDB** (if you prefer NoSQL alternatives)
- **MongoDB Compass** - For database GUI

## Quick Start (Development)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd video-conferencing-app

# Create environment file
cp backend/.env.example backend/.env

# Edit the .env file with your configuration
nano backend/.env
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb video_conferencing

# Or using psql
psql -U postgres
CREATE DATABASE video_conferencing;
\q

# Run database migrations
cd backend
npm install
npm run migrate
```

### 3. Start Redis (Optional)
```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# Windows
# Download and install from https://redis.io/download
```

### 4. Backend Setup
```bash
cd backend
npm install

# Start development server
npm run dev
```

The backend will be available at `http://localhost:3001`

### 5. Web Client Setup
```bash
# In a new terminal
cd web-client
npm install

# Start development server
npm run dev
```

The web client will be available at `http://localhost:3000`

### 6. Mobile Client Setup (Optional)
```bash
# Install Expo CLI globally
npm install -g @expo/cli

cd mobile-client
npm install

# Start mobile development
npm start
```

### 7. Desktop Client Setup (Optional)
```bash
cd desktop-client
npm install

# Start desktop development
npm run start
```

## Docker Setup (Production-Ready)

### 1. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
```

### 2. Build and Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Database Initialization
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data (optional)
docker-compose exec backend npm run seed
```

## Configuration

### Backend Configuration (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=video_conferencing

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# CORS
CORS_ORIGIN=http://localhost:3000

# Optional: TURN server for better WebRTC connectivity
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=username
TURN_CREDENTIAL=password
```

### WebRTC Configuration
The application uses Google's public STUN servers by default. For production, consider setting up your own TURN server:

```bash
# Using coturn (recommended)
sudo apt install coturn
# Configure coturn server and update .env file
```

## Development Workflow

### 1. Running Tests
```bash
# Backend tests
cd backend
npm test

# Web client tests
cd web-client
npm test

# Mobile client tests
cd mobile-client
npm test
```

### 2. Code Linting
```bash
# Backend
cd backend
npm run lint

# Web client
cd web-client
npm run lint

# Fix linting issues
npm run lint:fix
```

### 3. Building for Production
```bash
# Build all components
npm run build:all

# Or build individually
npm run build:backend
npm run build:web
npm run build:mobile
npm run build:desktop
```

## API Documentation

Once the backend is running, you can access:
- **API Documentation**: `http://localhost:3001/api-docs` (if Swagger is configured)
- **Health Check**: `http://localhost:3001/health`

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
psql -U postgres -l

# Recreate database
dropdb video_conferencing
createdb video_conferencing
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
redis-cli ping
# Should return: PONG
```

#### 3. Port Conflicts
```bash
# Check what's using a port
lsof -i :3001  # Backend port
lsof -i :3000  # Web client port
lsof -i :5432  # PostgreSQL port

# Kill process using a port
kill -9 <PID>
```

#### 4. WebRTC Issues
- Ensure HTTPS is used in production (required for getUserMedia)
- Check firewall settings for STUN/TURN servers
- Verify CORS configuration

### Performance Optimization

#### 1. Database Indexing
The application includes proper database indexes. For large-scale deployment:

```sql
-- Additional indexes for performance
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_messages_meeting_id ON messages(meeting_id);
CREATE INDEX idx_participants_user_id ON meeting_participants(user_id);
```

#### 2. Redis Configuration
For production, configure Redis persistence:

```bash
# redis.conf
save 900 1
save 300 10
save 60 10000
```

#### 3. Nginx Configuration
Use Nginx as reverse proxy for better performance:

```nginx
# /etc/nginx/sites-available/video-conferencing
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for JWT tokens
- Rotate secrets regularly

### 2. Database Security
- Use connection pooling
- Enable SSL in production
- Regular backups

### 3. WebRTC Security
- Use HTTPS in production
- Configure proper TURN server authentication
- Implement rate limiting

### 4. API Security
- Validate all inputs
- Use parameterized queries (implemented)
- Implement proper CORS policies
- Enable rate limiting (implemented)

## Deployment

### 1. Manual Deployment
```bash
# Build all components
npm run build:all

# Copy files to server
scp -r ./dist/* user@server:/var/www/video-conferencing/

# Setup reverse proxy and SSL
sudo certbot --nginx -d your-domain.com
```

### 2. Docker Deployment
```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d

# With SSL
docker-compose -f docker-compose.ssl.yml up -d
```

### 3. Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=video-conferencing-backend
```

## Monitoring

### 1. Application Monitoring
- Monitor API response times
- Track WebRTC connection success rates
- Monitor database query performance

### 2. Infrastructure Monitoring
- Server resource usage (CPU, memory, disk)
- Database performance metrics
- Redis memory usage

### 3. Error Tracking
- Implement proper logging
- Use services like Sentry for error tracking
- Monitor WebSocket connection drops

## Support

For additional help:
1. Check the [API Documentation](docs/API.md)
2. Review the code comments and TypeScript types
3. Check the troubleshooting section above
4. Create an issue in the repository

## Next Steps

After successful setup:
1. Configure TURN server for better WebRTC connectivity
2. Set up SSL certificates for HTTPS
3. Configure email service for notifications
4. Set up monitoring and logging
5. Implement automated backups
6. Configure CI/CD pipelines
7. Set up load balancing for high availability