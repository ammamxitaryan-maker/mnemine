# PowerShell script for database reset
Write-Host "🗑️  Database Reset Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
$serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*server*"}
if ($serverProcess) {
    Write-Host "⚠️  Warning: Server process detected. Please stop the server before resetting database." -ForegroundColor Yellow
    Write-Host "   Use: pnpm run stop (if you have a stop script)" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/N)"
    if ($continue -notmatch "^[Yy]$") {
        Write-Host "Database reset cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔄 Starting database reset..." -ForegroundColor Green
Write-Host ""

# Run database reset script
try {
    pnpm run db:reset
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database reset completed successfully!" -ForegroundColor Green
        Write-Host "📊 All user data has been cleared" -ForegroundColor Green
        Write-Host "👑 Default admin user has been created" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 You can now start the server with: pnpm run dev" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Database reset failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Database reset failed with error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
