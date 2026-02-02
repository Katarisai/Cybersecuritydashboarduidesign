#!/bin/bash
# ===========================================
# Full Attack Test Suite
# ===========================================
# Runs all attack simulations in sequence
# with logging and timing for validation
# ===========================================

TARGET=${1:-"192.168.1.1"}
DURATION=${2:-5}  # minutes
LOG_DIR=${3:-"./logs"}
WEB_TARGET=${4:-"http://$TARGET"}

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   CYBER DEFENSE SYSTEM - Full Attack Test Suite           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Target IP:     $TARGET"
echo "Web Target:    $WEB_TARGET"
echo "Duration:      $DURATION minutes per attack type"
echo "Log Directory: $LOG_DIR"
echo ""
echo "⚠️  This will generate significant network traffic!"
echo "⚠️  Ensure you have authorization to test this target!"
echo ""
echo "Starting in 10 seconds... (Ctrl+C to cancel)"
sleep 10

# Create log directory
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MASTER_LOG="$LOG_DIR/test_run_$TIMESTAMP.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MASTER_LOG"
}

run_attack_phase() {
    local phase_name=$1
    local script=$2
    local args=$3
    local log_file="$LOG_DIR/${phase_name}_$TIMESTAMP.log"
    
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "PHASE: $phase_name"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    START_TIME=$(date +%s)
    
    if [ -f "$script" ]; then
        bash "$script" $args > "$log_file" 2>&1 &
        local pid=$!
        
        # Wait for duration or script completion
        local wait_seconds=$((DURATION * 60))
        local elapsed=0
        
        while kill -0 $pid 2>/dev/null && [ $elapsed -lt $wait_seconds ]; do
            sleep 10
            elapsed=$((elapsed + 10))
            log "  Progress: $elapsed / $wait_seconds seconds"
        done
        
        # Kill if still running
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null
            log "  Attack phase terminated (duration limit)"
        else
            log "  Attack phase completed"
        fi
    else
        log "  ERROR: Script not found: $script"
    fi
    
    END_TIME=$(date +%s)
    PHASE_DURATION=$((END_TIME - START_TIME))
    log "  Duration: $PHASE_DURATION seconds"
    log "  Log file: $log_file"
    
    # Pause between phases
    log "  Waiting 30 seconds before next phase..."
    sleep 30
}

# Record test start
log "═══════════════════════════════════════════════════════════"
log "TEST SUITE STARTED"
log "═══════════════════════════════════════════════════════════"

SCRIPT_DIR="$(dirname "$0")/attacks"

# Phase 1: Port Scanning
run_attack_phase "port_scan" "$SCRIPT_DIR/port_scan.sh" "$TARGET all"

# Phase 2: SSH Brute Force
run_attack_phase "brute_force" "$SCRIPT_DIR/brute_force_ssh.sh" "$TARGET"

# Phase 3: Web Attacks
run_attack_phase "web_attacks" "$SCRIPT_DIR/web_attacks.sh" "$WEB_TARGET all"

# Phase 4: DDoS Simulation
run_attack_phase "ddos" "$SCRIPT_DIR/ddos_simulation.sh" "$TARGET 80 60 all"

# Record test end
log ""
log "═══════════════════════════════════════════════════════════"
log "TEST SUITE COMPLETED"
log "═══════════════════════════════════════════════════════════"
log ""
log "Results saved to: $LOG_DIR"
log ""
log "Next steps:"
log "  1. Check the defense dashboard for detection alerts"
log "  2. Verify AI insights show threat intelligence"
log "  3. Review suggested automated rules"
log "  4. Collect metrics for accuracy analysis"
log ""

# Generate summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   TEST SUMMARY                                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Log files generated:"
ls -la "$LOG_DIR"/*.log 2>/dev/null
echo ""
echo "To analyze results:"
echo "  grep -i 'error\|failed\|detected' $LOG_DIR/*.log"
echo ""
