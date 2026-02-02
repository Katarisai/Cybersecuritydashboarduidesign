<#
.SYNOPSIS
    FirewallAI Dashboard Launcher - One Click Edition
.DESCRIPTION
    Starts the complete FirewallAI stack with a single click:
    - Backend server on Ubuntu (192.168.1.101)
    - Frontend dev server on Windows
    - Opens the dashboard in browser
.NOTES
    Version: 3.0.2
    Author: FirewallAI Team
#>

#Requires -Version 5.1

# ===========================================
# Configuration
# ===========================================
$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Load environment variables from .env.local
$envFile = Join-Path $ScriptDir ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

# Configuration from environment (with defaults)
$UBUNTU_HOST = if ($env:UBUNTU_HOST) { $env:UBUNTU_HOST } else { "192.168.1.101" }
$UBUNTU_USER = if ($env:UBUNTU_USER) { $env:UBUNTU_USER } else { "ubuntu" }
$UBUNTU_PASSWORD = if ($env:UBUNTU_PASSWORD) { $env:UBUNTU_PASSWORD } else { "ubuntu" }
$FRONTEND_PORT = if ($env:VITE_PORT) { $env:VITE_PORT } else { "5173" }
$BACKEND_PORT = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "3001" }
$BACKEND_PATH = "/home/$UBUNTU_USER/firewall-backend"

# SSH Tools
$toolsDir = Join-Path $ScriptDir "tools"
$plinkPath = Join-Path $toolsDir "plink.exe"
$pscpPath = Join-Path $toolsDir "pscp.exe"

# ===========================================
# Helper Functions
# ===========================================
function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                       ║" -ForegroundColor Cyan
    Write-Host "  ║   ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗    ║" -ForegroundColor Cyan
    Write-Host "  ║   ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║    ║" -ForegroundColor Cyan
    Write-Host "  ║   █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║    ║" -ForegroundColor Cyan
    Write-Host "  ║   ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║    ║" -ForegroundColor Cyan
    Write-Host "  ║   ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║██║    ║" -ForegroundColor Cyan
    Write-Host "  ║   ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝    ║" -ForegroundColor Cyan
    Write-Host "  ║                                                       ║" -ForegroundColor Cyan
    Write-Host "  ║          Cybersecurity Dashboard v3.0                 ║" -ForegroundColor White
    Write-Host "  ║              One-Click Launcher                       ║" -ForegroundColor Gray
    Write-Host "  ╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message, [string]$Status = "...")
    
    switch ($Status) {
        "OK" { Write-Host "  [" -NoNewline; Write-Host "OK" -ForegroundColor Green -NoNewline; Write-Host "] $Message" }
        "FAIL" { Write-Host "  [" -NoNewline; Write-Host "FAIL" -ForegroundColor Red -NoNewline; Write-Host "] $Message" }
        "WARN" { Write-Host "  [" -NoNewline; Write-Host "WARN" -ForegroundColor Yellow -NoNewline; Write-Host "] $Message" }
        "INFO" { Write-Host "  [" -NoNewline; Write-Host "INFO" -ForegroundColor Cyan -NoNewline; Write-Host "] $Message" }
        default { Write-Host "  [" -NoNewline; Write-Host "..." -ForegroundColor Yellow -NoNewline; Write-Host "] $Message" }
    }
}

function Ensure-Tools {
    if (-not (Test-Path $toolsDir)) {
        New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
    }
    
    $needDownload = $false
    
    if (-not (Test-Path $plinkPath)) {
        Write-Step "Downloading plink.exe..." "INFO"
        try {
            Invoke-WebRequest -Uri "https://the.earth.li/~sgtatham/putty/latest/w64/plink.exe" -OutFile $plinkPath -UseBasicParsing
            $needDownload = $true
        }
        catch {
            Write-Step "Failed to download plink.exe" "FAIL"
            return $false
        }
    }
    
    if (-not (Test-Path $pscpPath)) {
        Write-Step "Downloading pscp.exe..." "INFO"
        try {
            Invoke-WebRequest -Uri "https://the.earth.li/~sgtatham/putty/latest/w64/pscp.exe" -OutFile $pscpPath -UseBasicParsing
            $needDownload = $true
        }
        catch {
            Write-Step "Failed to download pscp.exe" "FAIL"
            return $false
        }
    }
    
    if ($needDownload) {
        Write-Step "SSH tools ready" "OK"
    }
    
    return $true
}

function Test-UbuntuConnection {
    Write-Step "Testing connection to Ubuntu ($UBUNTU_HOST)..."
    try {
        $result = & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" "echo CONNECTED" 2>&1
        if ($result -match "CONNECTED") {
            Write-Step "Ubuntu server reachable" "OK"
            return $true
        }
    }
    catch {}
    
    Write-Step "Cannot connect to Ubuntu server at $UBUNTU_HOST" "FAIL"
    return $false
}

function Start-BackendOnUbuntu {
    Write-Step "Starting backend on Ubuntu..."
    
    # Kill any existing Node process running server.js
    $killCmd = 'pkill -f "node.*server.js" 2>/dev/null; exit 0'
    & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $killCmd 2>&1 | Out-Null
    
    Start-Sleep -Milliseconds 500
    
    # Start the backend using screen for persistence (detached)
    $startCmd = "cd $BACKEND_PATH; screen -dmS firewallai node server.js"
    & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $startCmd 2>&1 | Out-Null
    
    Start-Sleep -Seconds 2
    
    # Verify it started by checking if process is running
    $checkCmd = 'pgrep -f "node.*server" > /dev/null; if [ $? -eq 0 ]; then echo RUNNING; else echo NOT_RUNNING; fi'
    $check = & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $checkCmd 2>&1
    
    if ($check -match "RUNNING") {
        Write-Step "Backend running on http://${UBUNTU_HOST}:${BACKEND_PORT}" "OK"
        return $true
    }
    
    # Fallback: try with nohup if screen isn't available
    Write-Step "Trying alternative startup method..." "WARN"
    $altCmd = 'cd ' + $BACKEND_PATH + '; nohup node server.js > /tmp/firewallai.log 2>&1 &'
    & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $altCmd 2>&1 | Out-Null
    
    Start-Sleep -Seconds 2
    
    $check2 = & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $checkCmd 2>&1
    if ($check2 -match "RUNNING") {
        Write-Step "Backend started (fallback method)" "OK"
        return $true
    }
    
    Write-Step "Backend may not have started - check logs on Ubuntu" "WARN"
    return $false
}

function Start-Frontend {
    Write-Step "Starting frontend development server..."
    
    $npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Path
    if (-not $npmPath) {
        Write-Step "npm not found - please install Node.js" "FAIL"
        return $false
    }
    
    # Check if node_modules exists
    $nodeModules = Join-Path $ScriptDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Step "Installing frontend dependencies (first time only)..." "INFO"
        $installProcess = Start-Process -FilePath "npm" -ArgumentList "install" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
    }
    
    # Start frontend in a new minimized window using a simpler approach
    $cmdScript = "title FirewallAI Frontend `& cd /d `"$ScriptDir`" `& npm run dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $cmdScript -WindowStyle Minimized
    
    Write-Step "Frontend starting on http://localhost:$FRONTEND_PORT" "OK"
    return $true
}

function Wait-ForServices {
    Write-Step "Waiting for services to initialize..."
    
    $maxWait = 15
    $waited = 0
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        
        # Check if frontend is ready
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $msg = "Services ready after $waited seconds"
                Write-Step $msg "OK"
                return $true
            }
        }
        catch {
            # Still waiting
        }
        
        # Show progress
        $progressMsg = "`r  [...] Waiting for services... $waited s"
        Write-Host $progressMsg -NoNewline
    }
    
    Write-Host ""
    Write-Step "Services may need more time to start" "WARN"
    return $true
}

function Open-Dashboard {
    $url = "http://localhost:$FRONTEND_PORT"
    Write-Step "Opening dashboard: $url" "OK"
    Start-Process $url
}

function Deploy-BackendToUbuntu {
    Write-Step "Deploying updated backend to Ubuntu..."
    
    $backendPath = Join-Path $ScriptDir "backend"
    $serverFile = Join-Path $backendPath "server_remote.js"
    
    if (-not (Test-Path $serverFile)) {
        $serverFile = Join-Path $backendPath "server.js"
    }
    
    # Stop existing backend
    $stopCmd = 'pkill -f "node.*server.js" 2>/dev/null; screen -S firewallai -X quit 2>/dev/null; exit 0'
    & $plinkPath -batch -ssh -pw $UBUNTU_PASSWORD "$UBUNTU_USER@$UBUNTU_HOST" $stopCmd 2>&1 | Out-Null
    
    # Copy server file
    $copyResult = & $pscpPath -batch -pw $UBUNTU_PASSWORD "$serverFile" "${UBUNTU_USER}@${UBUNTU_HOST}:${BACKEND_PATH}/server.js" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Backend code deployed" "OK"
        return $true
    }
    else {
        Write-Step "Failed to copy backend files" "FAIL"
        return $false
    }
}

# ===========================================
# Main Menu
# ===========================================
function Show-Menu {
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────┐" -ForegroundColor DarkCyan
    Write-Host "  │            Quick Actions                │" -ForegroundColor DarkCyan
    Write-Host "  ├─────────────────────────────────────────┤" -ForegroundColor DarkCyan
    Write-Host "  │  [1] Start Full Stack (Recommended)     │" -ForegroundColor White
    Write-Host "  │  [2] Start Frontend Only                │" -ForegroundColor Gray
    Write-Host "  │  [3] Deploy and Restart Backend         │" -ForegroundColor Gray
    Write-Host "  │  [4] Check Ubuntu Connection            │" -ForegroundColor Gray
    Write-Host "  │  [5] Open Dashboard Only                │" -ForegroundColor Gray
    Write-Host "  │  [Q] Quit                               │" -ForegroundColor DarkGray
    Write-Host "  └─────────────────────────────────────────┘" -ForegroundColor DarkCyan
    Write-Host ""
}

# ===========================================
# One-Click Full Stack Launch
# ===========================================
function Start-FullStack {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "    Starting FirewallAI Full Stack..." -ForegroundColor White
    Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Step 1: Ensure tools
    if (-not (Ensure-Tools)) {
        return
    }
    
    # Step 2: Test Ubuntu connection
    if (-not (Test-UbuntuConnection)) {
        Write-Step "Continuing with frontend only..." "WARN"
    }
    else {
        # Step 3: Start backend on Ubuntu
        Start-BackendOnUbuntu | Out-Null
    }
    
    # Step 4: Start frontend
    if (-not (Start-Frontend)) {
        return
    }
    
    # Step 5: Wait for services
    Wait-ForServices | Out-Null
    
    # Step 6: Open dashboard
    Open-Dashboard
    
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host "    FirewallAI is now running!" -ForegroundColor White
    Write-Host "  ═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor Gray
    Write-Host "    Backend:  http://${UBUNTU_HOST}:${BACKEND_PORT}" -ForegroundColor Gray
    Write-Host ""
}

# ===========================================
# Main Execution
# ===========================================
Write-Banner

# Check for command line arguments for auto-start
$autoStart = $false
foreach ($arg in $args) {
    if ($arg -eq "-auto" -or $arg -eq "--auto" -or $arg -eq "/auto") {
        $autoStart = $true
    }
}

if ($autoStart) {
    # Auto-start full stack without menu
    Start-FullStack
}
else {
    # Show interactive menu
    Show-Menu
    $choice = Read-Host "  Select option (or press Enter for Full Stack)"
    
    if ([string]::IsNullOrWhiteSpace($choice)) {
        $choice = "1"
    }
    
    switch ($choice) {
        "1" {
            Start-FullStack
        }
        "2" {
            Write-Host ""
            Start-Frontend | Out-Null
            Start-Sleep -Seconds 3
            Open-Dashboard
        }
        "3" {
            Write-Host ""
            if (Ensure-Tools) {
                if (Test-UbuntuConnection) {
                    Deploy-BackendToUbuntu | Out-Null
                    Start-BackendOnUbuntu | Out-Null
                }
            }
        }
        "4" {
            Write-Host ""
            if (Ensure-Tools) {
                Test-UbuntuConnection | Out-Null
            }
        }
        "5" {
            Open-Dashboard
        }
        "Q" {
            Write-Host "  Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        "q" {
            Write-Host "  Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Step "Invalid option - starting Full Stack" "WARN"
            Start-FullStack
        }
    }
}

Write-Host ""
Write-Host "  Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
