@echo off
setlocal enabledelayedexpansion

REM Mnemine Render Deployment Script for Windows
REM This script helps prepare and deploy the application to Render

echo.
echo 🚀 Mnemine Render Deployment Script
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)
if not exist "render.yaml" (
    echo [ERROR] render.yaml not found in current directory
    exit /b 1
)

echo [INFO] Starting deployment preparation...

REM Step 1: Install dependencies
echo [INFO] Installing dependencies...
call pnpm install --frozen-lockfile
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Step 2: Type checking
echo [INFO] Running type checks...
call pnpm run type-check
if errorlevel 1 (
    echo [ERROR] Type check failed
    exit /b 1
)

REM Step 3: Linting
echo [INFO] Running linter...
call pnpm run lint
if errorlevel 1 (
    echo [WARNING] Linting issues found, but continuing...
)

REM Step 4: Running tests
echo [INFO] Running tests...
call pnpm run test
if errorlevel 1 (
    echo [WARNING] Some tests failed, but continuing...
)

REM Step 5: Building the application
echo [INFO] Building application...
call pnpm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)

REM Step 6: Copying frontend to server
echo [INFO] Copying frontend build to server...
call pnpm run copy:frontend
if errorlevel 1 (
    echo [ERROR] Failed to copy frontend
    exit /b 1
)

REM Step 7: Verifying deployment
echo [INFO] Verifying deployment structure...
call pnpm run verify:production
if errorlevel 1 (
    echo [ERROR] Deployment verification failed
    exit /b 1
)

echo [SUCCESS] Build completed successfully!

REM Step 8: Check git status
echo [INFO] Checking git status...
git status --porcelain > temp_git_status.txt
for /f %%i in (temp_git_status.txt) do (
    set has_changes=1
    goto :has_changes
)
set has_changes=0
:has_changes
del temp_git_status.txt

if !has_changes! equ 1 (
    echo [WARNING] You have uncommitted changes. Consider committing them before deployment.
    git status --short
    echo.
    set /p continue="Do you want to continue with deployment? (y/N): "
    if /i not "!continue!"=="y" (
        echo [INFO] Deployment cancelled.
        exit /b 0
    )
)

REM Step 9: Check if we're on main branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
if not "!current_branch!"=="main" (
    echo [WARNING] You're not on the main branch (currently on: !current_branch!)
    set /p switch_branch="Do you want to switch to main branch? (y/N): "
    if /i "!switch_branch!"=="y" (
        git checkout main
        echo [SUCCESS] Switched to main branch
    ) else (
        echo [WARNING] Continuing with current branch: !current_branch!
    )
)

REM Step 10: Push to GitHub
echo [INFO] Pushing to GitHub...
git add .
git commit -m "Deploy: %date% %time%" 2>nul || echo [WARNING] No changes to commit
git push origin main
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    exit /b 1
)

echo [SUCCESS] Code pushed to GitHub successfully!

REM Step 11: Deployment instructions
echo.
echo 🎉 Deployment Preparation Complete!
echo ==================================
echo.
echo [INFO] Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Create a new Blueprint deployment
echo 3. Connect your GitHub repository
echo 4. Select the 'render.yaml' file
echo 5. Configure environment variables:
echo    - TELEGRAM_BOT_TOKEN: Your Telegram bot token
echo    - ADMIN_TELEGRAM_ID: Your Telegram user ID
echo 6. Click 'Apply' to deploy
echo.
echo [INFO] Your application will be available at: https://mnemine-app.onrender.com
echo.
echo [WARNING] Remember to:
echo - Set up your Telegram bot webhook
echo - Monitor the deployment logs
echo - Test the health check endpoint
echo - Verify all functionality works

echo [SUCCESS] Deployment script completed!
pause
