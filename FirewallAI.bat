@echo off
title FirewallAI Dashboard
:: Change to the directory where this batch file is located
cd /d "%~dp0"
:: Set console colors for better visibility
color 0A
:: Start the PowerShell launcher script with auto-start flag
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0FirewallAI-Launcher.ps1" -auto
