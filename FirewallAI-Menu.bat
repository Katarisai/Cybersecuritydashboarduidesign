@echo off
title FirewallAI Dashboard - Menu
:: Change to the directory where this batch file is located
cd /d "%~dp0"
:: Set console colors for better visibility
color 0A
:: Start the PowerShell launcher script with interactive menu
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0FirewallAI-Launcher.ps1"
