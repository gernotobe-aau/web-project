<#
.SYNOPSIS
    Start development servers for Food Delivery Platform

.DESCRIPTION
    Starts the backend (Node.js/Express) and frontend (Angular) development servers
    in separate PowerShell windows.

.PARAMETER Help
    Display this help message

.EXAMPLE
    .\start.ps1
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-OK {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[->] $Message" -ForegroundColor Yellow
}

if ($Help) {
    Write-Host ""
    Write-Host "Food Delivery Platform - Start Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Yellow
    Write-Host "  Starts backend and frontend development servers."
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -Help    Show this help message"
    Write-Host ""
    Write-Host "SERVERS:" -ForegroundColor Yellow
    Write-Host "  Backend:  http://localhost:3000"
    Write-Host "  Frontend: http://localhost:4200"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Food Delivery Platform - Start      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Check if dependencies are installed
Write-Step "Checking dependencies"

$backendModules = Join-Path $BackendDir "node_modules"
$frontendModules = Join-Path $FrontendDir "node_modules"

if (-not (Test-Path $backendModules)) {
    Write-Host "[ERROR] Backend dependencies not installed" -ForegroundColor Red
    Write-Host "Run: .\install.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $frontendModules)) {
    Write-Host "[ERROR] Frontend dependencies not installed" -ForegroundColor Red
    Write-Host "Run: .\install.ps1" -ForegroundColor Yellow
    exit 1
}

Write-OK "Dependencies are installed"

# Check if database exists
$dbPath = Join-Path $BackendDir "database.sqlite"
if (-not (Test-Path $dbPath)) {
    Write-Host ""
    Write-Host "[WARNING] Database does not exist" -ForegroundColor Yellow
    Write-Host "Run: .\reset-and-run.ps1 -SeedOnly" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 0
    }
}

# Start servers
Write-Step "Starting development servers"
Write-Host ""
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:4200" -ForegroundColor Green
Write-Host ""
Write-Info "Starting servers in separate windows..."
Write-Host ""

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; Write-Host 'Backend Server' -ForegroundColor Cyan; Write-Host 'http://localhost:3000' -ForegroundColor Green; Write-Host ''; npm run dev"

# Wait a bit before starting frontend
Start-Sleep -Seconds 2

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; Write-Host 'Frontend Server' -ForegroundColor Cyan; Write-Host 'http://localhost:4200' -ForegroundColor Green; Write-Host ''; npm start"

Write-OK "Services started in separate windows"
Write-Host ""
Write-Host "Press Ctrl+C in the terminal windows to stop the services" -ForegroundColor Yellow
Write-Host ""
