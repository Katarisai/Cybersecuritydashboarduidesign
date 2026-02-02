#!/bin/bash

# ============================================
# FirewallAI - Ubuntu Server Stop Script
# ============================================

echo "=========================================="
echo "  FirewallAI Server Stop Script"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "Step 1: Stopping Node.js Backend..."
echo "-------------------------------------------"
BACKEND_PID_FILE="$HOME/.backend.pid"

if [ -f "$BACKEND_PID_FILE" ]; then
    PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend (PID: $PID)...${NC}"
        kill $PID
        sleep 2
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Force killing...${NC}"
            kill -9 $PID
        fi
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"
else
    echo -e "${YELLOW}Backend not running or PID file not found${NC}"
    # Try to find and kill any running node server.js
    pkill -f "node server.js" 2>/dev/null
fi

echo ""
echo "Step 2: Stopping Grafana..."
echo "-------------------------------------------"
sudo systemctl stop grafana-server
echo -e "${GREEN}✓ Grafana stopped${NC}"

echo ""
echo "Step 3: Stopping InfluxDB..."
echo "-------------------------------------------"
sudo systemctl stop influxdb
echo -e "${GREEN}✓ InfluxDB stopped${NC}"

echo ""
echo "=========================================="
echo "  All services stopped!"
echo "=========================================="
