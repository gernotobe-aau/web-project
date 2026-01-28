<#
.SYNOPSIS
    Reset database and start development servers

.DESCRIPTION
    This script:
    1. Stops running servers
    2. Deletes the database
    3. Runs migrations
    4. Seeds test data
    5. Optionally starts development servers

.PARAMETER SeedOnly
    Only reset and seed the database, don't start servers

.PARAMETER Help
    Display this help message

.EXAMPLE
    .\reset-and-run.ps1
    
.EXAMPLE
    .\reset-and-run.ps1 -SeedOnly
#>

param(
    [switch]$SeedOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DbPath = Join-Path $BackendDir "database.sqlite"

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

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

if ($Help) {
    Write-Host ""
    Write-Host "Food Delivery Platform - Reset and Run" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DESCRIPTION:" -ForegroundColor Yellow
    Write-Host "  Resets database, runs migrations, seeds test data, and starts servers."
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\reset-and-run.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -SeedOnly    Only reset and seed database, don't start servers"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\reset-and-run.ps1              # Full reset and start servers"
    Write-Host "  .\reset-and-run.ps1 -SeedOnly    # Only reset and seed database"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Food Delivery - Reset Database      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Check if dependencies are installed
$backendModules = Join-Path $BackendDir "node_modules"
if (-not (Test-Path $backendModules)) {
    Write-Error-Custom "Backend dependencies not installed"
    Write-Host "Run: .\install.ps1" -ForegroundColor Yellow
    exit 1
}

# Step 1: Stop running processes
Write-Step "Stopping running processes"
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500
Write-OK "Processes stopped"

# Step 2: Delete database
Write-Step "Resetting database"
if (Test-Path $DbPath) {
    Remove-Item -Path $DbPath -Force
    Write-OK "Database deleted"
} else {
    Write-Info "Database does not exist, will be created"
}

# Step 3: Run migrations
Write-Step "Running migrations"
Push-Location $BackendDir
try {
    npx ts-node src/db/migration-runner.ts
    if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
    Write-OK "Migrations completed"
} finally {
    Pop-Location
}

# Step 4: Seed test data
Write-Step "Seeding test data"
Push-Location $BackendDir
try {
    npx ts-node src/db/seed-test-data.ts
    if ($LASTEXITCODE -ne 0) { throw "Seeding failed" }
    Write-OK "Test data seeded"
} finally {
    Pop-Location
}

if ($SeedOnly) {
    Write-Host ""
    Write-Step "Done (Seed Only Mode)"
    Write-Host ""
    Write-Host "Database has been reset and seeded." -ForegroundColor Green
    Write-Host "Run '.\start.ps1' to start the servers." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Step 5: Start servers
Write-Step "Starting development servers"
Push-Location $ScriptDir
try {
    & .\start.ps1
} finally {
    Pop-Location
}
