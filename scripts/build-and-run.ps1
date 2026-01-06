<#
.SYNOPSIS
    Build and run script for Food Delivery Platform

.DESCRIPTION
    This script supports two modes:
    - Development: Runs backend and frontend in parallel for local development
    - Deployment: Builds both applications and creates production deployment structure

.PARAMETER Mode
    The mode to run: Development or Deployment

.PARAMETER Help
    Display this help message

.EXAMPLE
    .\build-and-run.ps1 -Mode Development
    
.EXAMPLE
    .\build-and-run.ps1 -Mode Deployment
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Deployment")]
    [string]$Mode = "Development",
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Display help
if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
    exit 0
}

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Food Delivery Platform - Build      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mode: $Mode" -ForegroundColor Yellow
Write-Host "Project Root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Function to check if command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Validate prerequisites
Write-Host "-> Checking prerequisites..." -ForegroundColor Cyan

if (-not (Test-Command "node")) {
    Write-Host "X Node.js is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "X npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Node.js and npm are installed" -ForegroundColor Green

# Development Mode
if ($Mode -eq "Development") {
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host "  Starting Development Mode" -ForegroundColor Cyan
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if .env exists in backend
    $envPath = Join-Path $projectRoot "backend\.env"
    if (-not (Test-Path $envPath)) {
        Write-Host "! No .env file found in backend/" -ForegroundColor Yellow
        Write-Host "  Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item (Join-Path $projectRoot "backend\.env.example") $envPath
        Write-Host "[OK] Created .env file" -ForegroundColor Green
        Write-Host "  Please review and update the .env file if needed!" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Install dependencies if needed
    Write-Host "-> Checking backend dependencies..." -ForegroundColor Cyan
    $backendNodeModules = Join-Path $projectRoot "backend\node_modules"
    if (-not (Test-Path $backendNodeModules)) {
        Write-Host "  Installing backend dependencies..." -ForegroundColor Yellow
        Push-Location (Join-Path $projectRoot "backend")
        npm install
        Pop-Location
        Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "[OK] Backend dependencies OK" -ForegroundColor Green
    }
    
    Write-Host "-> Checking frontend dependencies..." -ForegroundColor Cyan
    $frontendNodeModules = Join-Path $projectRoot "frontend\node_modules"
    if (-not (Test-Path $frontendNodeModules)) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
        Push-Location (Join-Path $projectRoot "frontend")
        npm install
        Pop-Location
        Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "[OK] Frontend dependencies OK" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Starting services..." -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:4200" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host ""
    
    # Start backend in new window
    $backendPath = Join-Path $projectRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"
    
    # Start frontend in new window
    $frontendPath = Join-Path $projectRoot "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm start"
    
    Write-Host "[OK] Services started in separate windows" -ForegroundColor Green
    Write-Host ""
    Write-Host "Close the terminal windows to stop the services" -ForegroundColor Yellow
}

# Deployment Mode
elseif ($Mode -eq "Deployment") {
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host "  Starting Deployment Build" -ForegroundColor Cyan
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host ""
    
    $deployPath = Join-Path $projectRoot "deploy"
    $backendDeployPath = Join-Path $deployPath "backend"
    $serverPath = Join-Path $backendDeployPath "server"
    $publicPath = Join-Path $backendDeployPath "public"
    
    # Clean and create deploy directory
    Write-Host "-> Preparing deployment directory..." -ForegroundColor Cyan
    if (Test-Path $deployPath) {
        Remove-Item $deployPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $serverPath -Force | Out-Null
    New-Item -ItemType Directory -Path $publicPath -Force | Out-Null
    Write-Host "[OK] Deployment directory prepared" -ForegroundColor Green
    
    # Build frontend
    Write-Host ""
    Write-Host "-> Building frontend (production)..." -ForegroundColor Cyan
    Push-Location (Join-Path $projectRoot "frontend")
    try {
        npm run build -- --configuration=production
        Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
    } catch {
        Write-Host "X Frontend build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # Build backend
    Write-Host ""
    Write-Host "-> Building backend (production)..." -ForegroundColor Cyan
    Push-Location (Join-Path $projectRoot "backend")
    try {
        npm run build
        Write-Host "[OK] Backend built successfully" -ForegroundColor Green
    } catch {
        Write-Host "X Backend build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # Copy backend files
    Write-Host ""
    Write-Host "-> Copying backend files..." -ForegroundColor Cyan
    Push-Location (Join-Path $projectRoot "backend")
    Copy-Item -Path "dist\*" -Destination $serverPath -Recurse
    Copy-Item -Path "package.json" -Destination $serverPath
    Copy-Item -Path ".env.example" -Destination $serverPath
    Write-Host "[OK] Backend files copied" -ForegroundColor Green
    Pop-Location
    
    # Create start script
    Write-Host ""
    Write-Host "-> Creating start script..." -ForegroundColor Cyan
    $startScript = @"
<#
.SYNOPSIS
    Start the Food Delivery Platform server

.DESCRIPTION
    This script starts the production server.
    Make sure to configure the .env file before running.
#>

`$ErrorActionPreference = "Stop"
`$serverPath = Split-Path -Parent `$PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Food Delivery Platform - Server     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check .env file
`$envPath = Join-Path `$serverPath "server\.env"
if (-not (Test-Path `$envPath)) {
    Write-Host "! No .env file found!" -ForegroundColor Red
    Write-Host "  Please create .env file in server/ directory" -ForegroundColor Yellow
    Write-Host "  You can use .env.example as a template" -ForegroundColor Yellow
    exit 1
}

# Check node_modules
Push-Location (Join-Path `$serverPath "server")
`$nodeModules = Join-Path (Get-Location) "node_modules"
if (-not (Test-Path `$nodeModules)) {
    Write-Host "-> Installing production dependencies..." -ForegroundColor Cyan
    npm install --production
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start server
Write-Host "-> Starting server..." -ForegroundColor Cyan
Write-Host ""
node app.js
"@
    
    $startScriptPath = Join-Path $backendDeployPath "start-server.ps1"
    $startScript | Out-File -FilePath $startScriptPath -Encoding UTF8
    Write-Host "[OK] Start script created" -ForegroundColor Green
    
    # Create deployment README
    Write-Host ""
    Write-Host "-> Creating deployment documentation..." -ForegroundColor Cyan
    $deployReadme = @"
# Food Delivery Platform - Deployment

## Deployment Structure

``````
deploy/backend/
├─ server/           (Backend application)
│  ├─ app.js
│  ├─ package.json
│  └─ ...
├─ public/           (Frontend application)
│  ├─ index.html
│  └─ ...
├─ start-server.ps1  (Start script)
└─ README.md         (This file)
``````

## Deployment Steps

### 1. Configure Environment

Copy ``.env.example`` to ``.env`` in the ``server/`` directory and configure:

``````bash
cd server
cp .env.example .env
``````

Edit ``.env`` and set:
- ``JWT_SECRET`` to a secure random string
- ``PORT`` (default: 3000)
- Other configuration as needed

### 2. Install Dependencies

The start script will automatically install production dependencies if needed.

### 3. Start Server

Run the start script:

``````powershell
.\start-server.ps1
``````

The server will:
- Serve the API at ``http://localhost:3000/api``
- Serve the frontend at ``http://localhost:3000``

### 4. Access Application

Open your browser and navigate to:
- ``http://localhost:3000`` (or your configured domain)

## Production Considerations

- Use a process manager like PM2 or Windows Service
- Configure reverse proxy (nginx, IIS) if needed
- Set up SSL/TLS certificates
- Configure firewall rules
- Set up monitoring and logging
- Regular backups of the SQLite database

## Troubleshooting

### Server won't start
- Check .env file exists and is configured correctly
- Verify Node.js is installed (v24 required)
- Check port 3000 is not already in use

### Frontend not loading
- Verify public/ directory contains index.html
- Check browser console for errors
- Verify API routes are accessible at /api

## Support

For more information, see the main project README.md
"@
    
    $deployReadmePath = Join-Path $backendDeployPath "README.md"
    $deployReadme | Out-File -FilePath $deployReadmePath -Encoding UTF8
    Write-Host "[OK] Deployment documentation created" -ForegroundColor Green
    
    # Summary
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host "  Deployment Build Complete!" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Deployment location: $deployPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Navigate to: $backendDeployPath" -ForegroundColor White
    Write-Host "  2. Configure server/.env file" -ForegroundColor White
    Write-Host "  3. Run: .\start-server.ps1" -ForegroundColor White
    Write-Host ""
}
