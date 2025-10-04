# Firefox Debug Script for Cursor
Write-Host "Starting Firefox Debug Session..." -ForegroundColor Green
Write-Host ""

# Function to start development server
function Start-DevServer {
    Write-Host "Starting Vite development server..." -ForegroundColor Yellow
    $devServer = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd client && npm run dev" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 3
    return $devServer
}

# Function to start Firefox with debugging
function Start-FirefoxDebug {
    $firefoxPaths = @(
        "C:\Program Files\Mozilla Firefox\firefox.exe",
        "C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
        "${env:ProgramFiles}\Mozilla Firefox\firefox.exe",
        "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
    )
    
    foreach ($path in $firefoxPaths) {
        if (Test-Path $path) {
            Write-Host "Starting Firefox with debugging enabled..." -ForegroundColor Yellow
            Start-Process -FilePath $path -ArgumentList "-devtools", "-start-debugger-server", "6000", "http://localhost:5173"
            return $true
        }
    }
    
    Write-Host "Firefox not found in standard locations. Please install Firefox or update the path." -ForegroundColor Red
    return $false
}

# Main execution
try {
    $devServer = Start-DevServer
    
    if (Start-FirefoxDebug) {
        Write-Host ""
        Write-Host "Firefox debug session started!" -ForegroundColor Green
        Write-Host "- Development server: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "- Debugger port: 6000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow
        
        # Wait for user to stop
        try {
            while ($true) {
                Start-Sleep -Seconds 1
            }
        }
        catch [System.Management.Automation.PipelineStoppedException] {
            Write-Host "Stopping debug session..." -ForegroundColor Yellow
        }
    }
}
finally {
    # Cleanup
    if ($devServer -and !$devServer.HasExited) {
        $devServer.Kill()
        Write-Host "Development server stopped." -ForegroundColor Green
    }
}
