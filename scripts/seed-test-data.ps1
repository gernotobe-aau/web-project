#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Reset database and seed test data for Order Management API

.DESCRIPTION
    This script:
    1. Deletes the existing database
    2. Runs all database migrations
    3. Seeds test data including:
       - 2 Customers (max.mustermann@test.com, anna.schmidt@test.com)
       - 4 Restaurant Owners
       - 4 Restaurants (Pizza Mario, Burger Palace, Sushi Dreams, Taj Mahal)
       - 16 Categories total (3-4 per restaurant)
       - 60+ Dishes (2-5 per category)
       - 3 Voucher codes
       - 5 Sample orders for Burger Palace (with realistic timestamps)

    All accounts use the password: Test1234!

.PARAMETER Help
    Display this help message

.EXAMPLE
    .\seed-test-data.ps1
    Run the complete database reset and seeding

.EXAMPLE
    .\seed-test-data.ps1 -Help
    Display help information
#>

param(
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
    exit 0
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     Food Delivery - Database Reset & Seed Test Data" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path $backendDir)) {
    Write-Host "[ERROR] Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

# Change to backend directory
Set-Location $backendDir

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found in backend directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[STEP 1/3] Deleting old database..." -ForegroundColor Yellow
$dbPath = Join-Path $backendDir "database.sqlite"
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "  -> Database deleted" -ForegroundColor Gray
} else {
    Write-Host "  -> No existing database found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[STEP 2/3] Running database migrations..." -ForegroundColor Yellow
$migrationScript = Join-Path $backendDir "run-migrations.ts"
if (-not (Test-Path $migrationScript)) {
    Write-Host "[ERROR] Migration script not found: $migrationScript" -ForegroundColor Red
    exit 1
}

npx ts-node run-migrations.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database migration failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[STEP 3/3] Seeding test data..." -ForegroundColor Yellow
Write-Host ""

# Run the seed script
npm run seed:orders

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: Test data seeding completed!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now test the Order Management API with these credentials:" -ForegroundColor Cyan
    Write-Host "  - All passwords: Test1234!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Seeding failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
