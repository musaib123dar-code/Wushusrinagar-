#!/bin/bash

echo "========================================="
echo "VideoConf Platform - Setup Test"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# Test 1: Check critical files
echo "1. Checking critical files..."
if [ -f "backend/src/migrations/001_initial_schema.sql" ]; then
    echo -e "${GREEN}✅ Database migration file exists${NC}"
else
    echo -e "${RED}❌ Database migration file missing!${NC}"
    echo "   Fix: File created, no action needed"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "infrastructure/docker/docker-compose.yml" ]; then
    echo -e "${GREEN}✅ Docker compose file exists${NC}"
else
    echo -e "${RED}❌ Docker compose file missing!${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "backend/package.json" ]; then
    echo -e "${GREEN}✅ Backend package.json exists${NC}"
else
    echo -e "${RED}❌ Backend package.json missing!${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "web/package.json" ]; then
    echo -e "${GREEN}✅ Web package.json exists${NC}"
else
    echo -e "${RED}❌ Web package.json missing!${NC}"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Test 2: Check Node.js
echo "2. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
    
    # Check version
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo -e "${GREEN}✅ Node.js version is 20 or higher${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js version should be 20+, you have $NODE_VERSION${NC}"
        echo "   Install Node.js 20+ from https://nodejs.org/"
    fi
else
    echo -e "${RED}❌ Node.js not installed!${NC}"
    echo "   Install from https://nodejs.org/"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Test 3: Check Docker
echo "3. Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installed: $DOCKER_VERSION${NC}"
    
    # Check if Docker is running
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✅ Docker is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker is installed but not running${NC}"
        echo "   Start Docker Desktop or run: sudo systemctl start docker"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not installed (optional)${NC}"
    echo "   Install from https://www.docker.com/products/docker-desktop"
fi

echo ""

# Test 4: Check PostgreSQL (for local dev)
echo "4. Checking PostgreSQL (for local development)..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL installed: $PG_VERSION${NC}"
    
    # Check if running
    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL installed but not running${NC}"
        echo "   Start it with: brew services start postgresql (Mac)"
        echo "   Or: sudo systemctl start postgresql (Linux)"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not installed (optional if using Docker)${NC}"
    echo "   Install from https://www.postgresql.org/download/"
fi

echo ""

# Test 5: Check Redis (for local dev)
echo "5. Checking Redis (for local development)..."
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✅ Redis installed${NC}"
    
    # Check if running
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis installed but not running${NC}"
        echo "   Start it with: brew services start redis (Mac)"
        echo "   Or: sudo systemctl start redis-server (Linux)"
    fi
else
    echo -e "${YELLOW}⚠️  Redis not installed (optional if using Docker)${NC}"
    echo "   Install from https://redis.io/download"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo "You're ready to start! Choose your method:"
    echo ""
    echo "🐳 Docker (Easiest):"
    echo "   cd infrastructure/docker"
    echo "   docker-compose up -d"
    echo "   sleep 30"
    echo "   docker exec videoconf-backend npm run migrate"
    echo "   open http://localhost"
    echo ""
    echo "💻 Local Development:"
    echo "   ./setup.sh"
    echo "   # Choose option 1"
    echo ""
    echo "📚 Documentation:"
    echo "   - Quick Start: START_HERE.md"
    echo "   - Troubleshooting: TROUBLESHOOTING.md"
else
    echo -e "${RED}❌ Found $ISSUES critical issue(s)${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    echo ""
    echo "📚 For help, see:"
    echo "   - START_HERE.md"
    echo "   - TROUBLESHOOTING.md"
fi

echo ""
echo "========================================="
