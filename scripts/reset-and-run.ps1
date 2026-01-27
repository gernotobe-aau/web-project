# Reset and Run Script
# Resets the database, seeds test data, and starts the development servers.

param(
    [switch]$SkipBuild,
    [switch]$SeedOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DbPath = Join-Path $BackendDir "data\app.db"

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
    Write-Host "USAGE: .\reset-and-run.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "  -SkipBuild   Skip frontend build (use existing build)"
    Write-Host "  -SeedOnly    Only reset and seed the database, don't start servers"
    Write-Host "  -Help        Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "  .\reset-and-run.ps1              # Full reset and start servers"
    Write-Host "  .\reset-and-run.ps1 -SkipBuild   # Reset DB, skip build, start servers"
    Write-Host "  .\reset-and-run.ps1 -SeedOnly    # Only reset and seed database"
    Write-Host ""
    exit 0
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
    Write-Host "Run '.\build-and-run.ps1' to start the servers." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Step 5: Build frontend (optional)
if (-not $SkipBuild) {
    Write-Step "Building frontend"
    Push-Location $FrontendDir
    try {
        ng build --configuration development
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        Write-OK "Frontend built"
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping frontend build"
}

# Step 6: Start servers
Write-Step "Starting development servers"
Push-Location $ScriptDir
try {
    & .\build-and-run.ps1
} finally {
    Pop-Location
}
