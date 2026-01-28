<#
.SYNOPSIS
    Install all dependencies for the Food Delivery Platform

.DESCRIPTION
    This script installs all required npm packages for both backend and frontend.
    Run this script first when setting up the project.

.PARAMETER Help
    Display this help message

.EXAMPLE
    .\install.ps1
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

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

if ($Help) {
    Write-Host ""
    Write-Host "Food Delivery Platform - Install Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Yellow
    Write-Host "  Installs all npm dependencies for backend and frontend."
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\install.ps1"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -Help    Show this help message"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Food Delivery Platform - Install    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Check Node.js
Write-Step "Checking prerequisites"
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "npm:     $npmVersion" -ForegroundColor Green
    Write-OK "Node.js and npm are installed"
} catch {
    Write-Error-Custom "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install backend dependencies
Write-Step "Installing backend dependencies"
Push-Location $BackendDir
try {
    Write-Host "Running: npm install" -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Backend npm install failed"
    }
    Write-OK "Backend dependencies installed"
} catch {
    Write-Error-Custom $_.Exception.Message
    exit 1
} finally {
    Pop-Location
}

# Install frontend dependencies
Write-Step "Installing frontend dependencies"
Push-Location $FrontendDir
try {
    Write-Host "Running: npm install" -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend npm install failed"
    }
    Write-OK "Frontend dependencies installed"
} catch {
    Write-Error-Custom $_.Exception.Message
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Installation Complete!              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Reset database and seed test data:" -ForegroundColor White
Write-Host "     .\reset-and-run.ps1 -SeedOnly" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start development servers:" -ForegroundColor White
Write-Host "     .\start.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  OR run everything at once:" -ForegroundColor White
Write-Host "     .\reset-and-run.ps1" -ForegroundColor Gray
Write-Host ""
