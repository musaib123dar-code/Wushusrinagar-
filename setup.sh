#!/bin/bash

set -e

echo "======================================"
echo "VideoConf Platform Setup Script"
echo "======================================"
echo ""

echo "This script will help you set up the VideoConf platform."
echo ""

read -p "Do you want to proceed? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker deployment will not be available."
    DOCKER_AVAILABLE=false
else
    echo "✅ Docker found: $(docker --version)"
    DOCKER_AVAILABLE=true
fi

if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose is not installed."
else
    echo "✅ Docker Compose found: $(docker-compose --version)"
fi

echo ""
echo "======================================"
echo "Choose setup option:"
echo "======================================"
echo "1) Full local development setup (Backend + Web + Mobile)"
echo "2) Docker Compose setup (Recommended for quick start)"
echo "3) Backend only"
echo "4) Web client only"
echo ""
read -p "Enter your choice (1-4): " SETUP_CHOICE

case $SETUP_CHOICE in
    1)
        echo ""
        echo "Setting up full local development environment..."
        echo ""
        
        echo "📦 Installing backend dependencies..."
        cd backend
        npm install
        
        if [ ! -f .env ]; then
            echo "📝 Creating backend .env file..."
            cp .env.example .env
            echo "⚠️  Please edit backend/.env with your configuration!"
        fi
        cd ..
        
        echo ""
        echo "📦 Installing web client dependencies..."
        cd web
        npm install
        
        if [ ! -f .env.local ]; then
            echo "📝 Creating web .env.local file..."
            cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF
        fi
        cd ..
        
        echo ""
        echo "📦 Installing mobile dependencies..."
        cd mobile
        npm install
        cd ..
        
        echo ""
        echo "✅ Installation complete!"
        echo ""
        echo "Next steps:"
        echo "1. Configure backend/.env with your database settings"
        echo "2. Start PostgreSQL and Redis"
        echo "3. Run database migrations: cd backend && npm run migrate"
        echo "4. Start backend: cd backend && npm run dev"
        echo "5. Start web client: cd web && npm run dev"
        echo "6. Start mobile: cd mobile && npm start"
        ;;
        
    2)
        if [ "$DOCKER_AVAILABLE" = false ]; then
            echo "❌ Docker is not available. Please install Docker first."
            exit 1
        fi
        
        echo ""
        echo "Setting up Docker Compose environment..."
        echo ""
        
        if [ ! -f backend/.env ]; then
            echo "📝 Creating backend .env file..."
            cd backend
            cp .env.example .env
            
            JWT_SECRET=$(openssl rand -base64 32)
            JWT_REFRESH_SECRET=$(openssl rand -base64 32)
            
            sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
            sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
            
            echo "✅ Generated JWT secrets"
            cd ..
        fi
        
        echo ""
        echo "🐳 Starting Docker containers..."
        cd infrastructure/docker
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        echo "🔄 Running database migrations..."
        docker exec videoconf-backend npm run migrate || echo "⚠️  Please run migrations manually: docker exec videoconf-backend npm run migrate"
        
        echo ""
        echo "✅ Docker setup complete!"
        echo ""
        echo "Access the application:"
        echo "- Web: http://localhost"
        echo "- Backend API: http://localhost:3000"
        echo "- API Health: http://localhost:3000/api/health"
        echo ""
        echo "View logs: docker-compose logs -f"
        echo "Stop services: docker-compose down"
        ;;
        
    3)
        echo ""
        echo "Setting up backend only..."
        echo ""
        
        cd backend
        npm install
        
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "⚠️  Please edit backend/.env with your configuration!"
        fi
        
        echo ""
        echo "✅ Backend setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Configure backend/.env"
        echo "2. Start PostgreSQL and Redis"
        echo "3. Run migrations: npm run migrate"
        echo "4. Start server: npm run dev"
        ;;
        
    4)
        echo ""
        echo "Setting up web client only..."
        echo ""
        
        cd web
        npm install
        
        if [ ! -f .env.local ]; then
            cat > .env.local << EOF
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
EOF
        fi
        
        echo ""
        echo "✅ Web client setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Make sure backend is running on port 3000"
        echo "2. Start dev server: npm run dev"
        echo "3. Open http://localhost:5173"
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Setup completed successfully! 🎉"
echo "======================================"
echo ""
echo "📚 Documentation:"
echo "  - Main README: VIDEOCONF_README.md"
echo "  - Deployment Guide: DEPLOYMENT.md"
echo ""
echo "🐛 Issues or questions?"
echo "  Check the documentation or create an issue on GitHub"
echo ""
