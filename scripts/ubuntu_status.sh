#!/bin/bash

# ============================================
# FirewallAI - Ubuntu Server Status Script
# ============================================

echo "=========================================="
echo "  FirewallAI Server Status"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "InfluxDB (Port 8086):"
if systemctl is-active --quiet influxdb; then
    echo -e "${GREEN}  ✓ Running${NC}"
else
    echo -e "${RED}  ✗ Stopped${NC}"
fi

echo ""
echo "Grafana (Port 3000):"
if systemctl is-active --quiet grafana-server; then
    echo -e "${GREEN}  ✓ Running${NC}"
else
    echo -e "${RED}  ✗ Stopped${NC}"
fi

echo ""
echo "Backend Server (Port 3001):"
BACKEND_PID_FILE="$HOME/.backend.pid"
if [ -f "$BACKEND_PID_FILE" ] && ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Running (PID: $(cat $BACKEND_PID_FILE))${NC}"
else
    # Check if running without PID file
    if pgrep -f "node server.js" > /dev/null; then
        echo -e "${GREEN}  ✓ Running${NC}"
    else
        echo -e "${RED}  ✗ Stopped${NC}"
    fi
fi

echo ""
echo "=========================================="
