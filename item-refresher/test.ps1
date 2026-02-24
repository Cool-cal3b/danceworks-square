# Build and run the item-refresher test container
# Usage: .\test.ps1

$ErrorActionPreference = "Stop"

Write-Host "Building test container..."
docker build -f Dockerfile.test -t item-refresher-test .

Write-Host ""
Write-Host "Running test..."
$parentDir = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $parentDir ".env.test"
if (-not (Test-Path $envFile)) {
    Write-Host "Warning: .env.test not found at $envFile"
    Write-Host "Running without env file (will use system env vars)"
    docker run --rm item-refresher-test
} else {
    docker run --rm --env-file $envFile item-refresher-test
}
