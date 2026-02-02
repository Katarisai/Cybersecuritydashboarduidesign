<#
.SYNOPSIS
    Creates a desktop shortcut for FirewallAI Dashboard
.DESCRIPTION
    This script creates a clickable shortcut on the desktop that launches
    the FirewallAI Dashboard with a single click.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Shortcut properties
$ShortcutName = "FirewallAI Dashboard"
$TargetPath = Join-Path $ProjectRoot "FirewallAI.bat"
$IconPath = Join-Path $ProjectRoot "src\assets\favicon.ico"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "$ShortcutName.lnk"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FirewallAI Desktop Shortcut Creator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if batch file exists
if (-not (Test-Path $TargetPath)) {
    Write-Host "[ERROR] FirewallAI.bat not found at: $TargetPath" -ForegroundColor Red
    exit 1
}

# Create the shortcut using WScript.Shell COM object
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $TargetPath
    $Shortcut.WorkingDirectory = $ProjectRoot
    $Shortcut.Description = "Launch FirewallAI Cybersecurity Dashboard"
    $Shortcut.WindowStyle = 1  # Normal window
    
    # Use custom icon if available, otherwise use default
    if (Test-Path $IconPath) {
        $Shortcut.IconLocation = $IconPath
    } else {
        # Use a shield icon from Windows
        $Shortcut.IconLocation = "%SystemRoot%\System32\imageres.dll,78"
    }
    
    $Shortcut.Save()
    
    Write-Host "[OK] Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Shortcut: $ShortcutPath" -ForegroundColor White
    Write-Host "  Target:   $TargetPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can now double-click the shortcut on your desktop" -ForegroundColor Yellow
    Write-Host "to launch FirewallAI Dashboard with one click!" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to create shortcut: $_" -ForegroundColor Red
    exit 1
}

# Ask if user wants to pin to taskbar
$pinChoice = Read-Host "Would you like to also pin to Start Menu? (y/n)"
if ($pinChoice -eq 'y' -or $pinChoice -eq 'Y') {
    try {
        $StartMenuPath = [Environment]::GetFolderPath("StartMenu") + "\Programs"
        $StartShortcutPath = Join-Path $StartMenuPath "$ShortcutName.lnk"
        
        $StartShortcut = $WshShell.CreateShortcut($StartShortcutPath)
        $StartShortcut.TargetPath = $TargetPath
        $StartShortcut.WorkingDirectory = $ProjectRoot
        $StartShortcut.Description = "Launch FirewallAI Cybersecurity Dashboard"
        $StartShortcut.WindowStyle = 1
        if (Test-Path $IconPath) {
            $StartShortcut.IconLocation = $IconPath
        } else {
            $StartShortcut.IconLocation = "%SystemRoot%\System32\imageres.dll,78"
        }
        $StartShortcut.Save()
        
        Write-Host "[OK] Start Menu shortcut created!" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not create Start Menu shortcut: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
