# Quick Git Add, Commit & Push Script
# Usage: .\git-acp.ps1

Write-Host "🚀 Quick Git Add, Commit & Push Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get current timestamp for commit message
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "📝 Adding all changes..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git add failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Files added successfully" -ForegroundColor Green

Write-Host "📦 Committing changes..." -ForegroundColor Yellow
git commit -m "Auto-commit $timestamp"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Commit created successfully" -ForegroundColor Green

Write-Host "🚀 Pushing to origin main..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Push completed successfully" -ForegroundColor Green
Write-Host "🎉 All done! Changes deployed to production." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  - Files added: ✅" -ForegroundColor Green
Write-Host "  - Commit created: ✅" -ForegroundColor Green
Write-Host "  - Pushed to origin/main: ✅" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
