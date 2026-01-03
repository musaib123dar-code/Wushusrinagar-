#!/bin/bash

echo "======================================="
echo "VideoConf Health Check"
echo "======================================="
echo ""

API_URL="${1:-http://localhost:3000}"

echo "Checking backend health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding (HTTP $BACKEND_STATUS)"
fi

echo ""
echo "Checking API health..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API is healthy"
    
    HEALTH_DATA=$(curl -s "$API_URL/api/health")
    echo "Response: $HEALTH_DATA"
else
    echo "❌ API is not responding (HTTP $API_STATUS)"
fi

echo ""
echo "Checking database connection..."
DB_STATUS=$(curl -s "$API_URL/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

if [ "$DB_STATUS" = "connected" ]; then
    echo "✅ Database is connected"
else
    echo "❌ Database is not connected"
fi

echo ""
echo "Checking Socket.io endpoint..."
SOCKET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/socket.io/")

if [ "$SOCKET_STATUS" = "200" ] || [ "$SOCKET_STATUS" = "400" ]; then
    echo "✅ Socket.io endpoint is accessible"
else
    echo "❌ Socket.io endpoint is not responding (HTTP $SOCKET_STATUS)"
fi

echo ""
echo "======================================="
echo "Health Check Complete"
echo "======================================="
