#!/bin/bash
# ===========================================
# Port Scanning Simulation
# ===========================================
# Simulates various port scanning techniques
# For testing IDS detection capabilities
# ===========================================

TARGET=${1:-"192.168.1.1"}
SCAN_TYPE=${2:-"all"}  # Options: syn, connect, udp, all

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Port Scanning Simulation                             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET"
echo "Scan Type: $SCAN_TYPE"
echo ""
echo "Starting in 5 seconds... (Ctrl+C to cancel)"
sleep 5

# Check if nmap is installed
if ! command -v nmap &> /dev/null; then
    echo "Error: nmap not found. Install with: sudo apt install nmap"
    exit 1
fi

run_scan() {
    local scan_name=$1
    local scan_args=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $scan_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    nmap $scan_args $TARGET
    
    echo ""
    echo "Pausing 10 seconds before next scan..."
    sleep 10
}

case $SCAN_TYPE in
    syn)
        run_scan "SYN Stealth Scan" "-sS -T4 --top-ports 100"
        ;;
    connect)
        run_scan "TCP Connect Scan" "-sT -T4 --top-ports 100"
        ;;
    udp)
        run_scan "UDP Scan" "-sU -T4 --top-ports 20"
        ;;
    aggressive)
        run_scan "Aggressive Scan" "-A -T4 --top-ports 50"
        ;;
    all)
        echo "Running comprehensive scan sequence..."
        
        # Quick SYN scan
        run_scan "SYN Stealth Scan (Fast)" "-sS -T4 --top-ports 100"
        
        # Version detection
        run_scan "Service Version Detection" "-sV --top-ports 20"
        
        # OS detection
        run_scan "OS Detection" "-O --top-ports 20"
        
        # Aggressive scan
        run_scan "Aggressive Scan" "-A --top-ports 20"
        
        # UDP scan (slow)
        run_scan "UDP Scan (Limited)" "-sU --top-ports 10"
        ;;
    *)
        echo "Unknown scan type: $SCAN_TYPE"
        echo "Options: syn, connect, udp, aggressive, all"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Port scanning simulation complete."
echo "Check the defense dashboard for detection alerts."
echo "Expected: 'Port Scan' category alerts in Suricata"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
