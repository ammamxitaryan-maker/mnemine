@echo off
echo Starting Firefox Debug Session...
echo.

REM Start the development server
echo Starting Vite development server...
start /B cmd /c "cd client && npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak > nul

REM Open Firefox with debugging enabled
echo Starting Firefox with debugging enabled...
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" -devtools -start-debugger-server 6000 http://localhost:5173

echo.
echo Firefox debug session started!
echo - Development server: http://localhost:5173
echo - Debugger port: 6000
echo.
echo Press any key to stop...
pause > nul

REM Kill the development server
taskkill /f /im node.exe 2>nul
echo Development server stopped.
