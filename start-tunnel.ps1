<#
.SYNOPSIS
    Start Mishmarot system with ngrok tunnel

.DESCRIPTION
    Runs in order:
    1. Docker (Database + pgAdmin)
    2. Backend (Flask) - if not running
    3. Frontend (Vite)
    4. ngrok tunnel

.NOTES
    Prerequisites:
    - ngrok installed and authenticated
    - Docker Desktop running
    - Python env ready
#>

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

$ProjectRoot = $PSScriptRoot

# -- Colors ---------------------------------------------------
function Info  ($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function OK    ($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn  ($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Err   ($msg) { Write-Host "[ERR] $msg" -ForegroundColor Red }
function Title ($msg) { Write-Host "`n=======================================" -ForegroundColor DarkGray; Write-Host "  $msg" -ForegroundColor White }

Title "1/4 - ngrok Check"

$ngrokConfigPath = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
if (-not (Test-Path $ngrokConfigPath)) {
    Err "ngrok is not authenticated."
    Write-Host ""
    Write-Host "  Steps to fix:" -ForegroundColor White
    Write-Host "  1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Gray
    Write-Host "  2. Copy token" -ForegroundColor Gray
    Write-Host "  3. Run: ngrok config add-authtoken <token>" -ForegroundColor Gray
    Write-Host "  4. Run this script again" -ForegroundColor Gray
    exit 1
}
OK "ngrok is authenticated"

Title "2/4 - Docker (DB + pgAdmin)"

$dockerTest = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Warn "Docker not running - starting..."
    Start-Process "Docker Desktop" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 6
}

$dbContainer = docker ps --filter "name=db" --format "{{.Names}}" 2>$null
if (-not $dbContainer) {
    Info "Starting containers..."
    Push-Location $ProjectRoot
    docker-compose up -d 2>&1 | Out-Null
    Pop-Location
    Start-Sleep -Seconds 3
    OK "Docker containers running"
} else {
    OK "Docker containers already running ($dbContainer)"
}

Title "3/4 - Frontend (Vite dev server)"

$vitePid = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue |
           Select-Object -ExpandProperty OwningProcess -First 1

if ($vitePid) {
    OK "Vite already running (PID $vitePid, port 5173)"
} else {
    Info "Starting Vite..."
    $frontendProcess = Start-Process -FilePath "cmd" `
        -ArgumentList "/c npm run dev" `
        -WorkingDirectory "$ProjectRoot\frontend" `
        -PassThru `
        -WindowStyle Minimized
    
    $waited = 0
    while ($waited -lt 15) {
        Start-Sleep -Seconds 1
        $waited++
        $open = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
        if ($open) { break }
    }
    OK "Vite running (PID $($frontendProcess.Id))"
}

Title "4/4 - ngrok Tunnel"

$projectConfig = "$ProjectRoot\ngrok.yml"
$domainLine = Select-String -Path $projectConfig -Pattern "domain:" | Select-Object -First 1

if ($domainLine -and $domainLine.Line -notmatch "^\s*#") {
    $domain = ($domainLine.Line -replace ".*domain:\s*", "").Trim()
    Info "Static domain: $domain"
    $ngrokArgs = "http 5173 --domain=$domain --config `"$ngrokConfigPath`""
} else {
    Warn "No static domain defined - URL will be random"
    Warn "To set a static domain: https://dashboard.ngrok.com/domains"
    $ngrokArgs = "http 5173 --config `"$ngrokConfigPath`""
}

Write-Host ""
Write-Host "  ---------------------------------------------" -ForegroundColor DarkGray
Write-Host "  |  Tunnel starting - URL in ngrok window    |" -ForegroundColor White
Write-Host "  |  To close: Ctrl+C in this window          |" -ForegroundColor DarkGray
Write-Host "  ---------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

Invoke-Expression "ngrok $ngrokArgs"

Write-Host "`n[Tunnel closed]" -ForegroundColor DarkGray
