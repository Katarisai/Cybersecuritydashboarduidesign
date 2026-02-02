#!/bin/bash

# ============================================
# FirewallAI - Ubuntu Server Startup Script
# ============================================
# This script starts all required services:
# - InfluxDB (metrics database)
# - Grafana (monitoring dashboards)
# - Node.js Backend Server
# ============================================

echo "=========================================="
echo "  FirewallAI Server Startup Script"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✓ $1 is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 is not running${NC}"
        return 1
    fi
}

# Function to start service
start_service() {
    echo -e "${YELLOW}Starting $1...${NC}"
    sudo systemctl start $1
    sleep 2
    check_service $1
}

echo ""
echo "Step 1: Starting InfluxDB..."
echo "-------------------------------------------"
if ! check_service influxdb; then
    start_service influxdb
fi

echo ""
echo "Step 2: Starting Grafana..."
echo "-------------------------------------------"
if ! check_service grafana-server; then
    start_service grafana-server
fi

echo ""
echo "Step 3: Starting Node.js Backend..."
echo "-------------------------------------------"
BACKEND_DIR="$HOME/backend"
BACKEND_PID_FILE="$HOME/.backend.pid"

# Check if backend is already running
if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is already running (PID: $PID)${NC}"
    else
        echo -e "${YELLOW}Stale PID file found, starting backend...${NC}"
        rm -f "$BACKEND_PID_FILE"
    fi
fi

if [ ! -f "$BACKEND_PID_FILE" ]; then
    cd "$BACKEND_DIR"
    echo "Starting server.js..."
    nohup node server.js > "$HOME/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    sleep 2
    
    if ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend started (PID: $(cat $BACKEND_PID_FILE))${NC}"
    else
        echo -e "${RED}✗ Failed to start backend${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "  Service Status Summary"
echo "=========================================="
echo ""
echo "InfluxDB:  http://192.168.1.101:8086"
check_service influxdb
echo ""
echo "Grafana:   http://192.168.1.101:3000"
check_service grafana-server
echo ""
echo "Backend:   http://192.168.1.101:3001"
if [ -f "$BACKEND_PID_FILE" ] && ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running (PID: $(cat $BACKEND_PID_FILE))${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
fi
echo ""
echo "=========================================="
echo "  All services started!"
echo "=========================================="
