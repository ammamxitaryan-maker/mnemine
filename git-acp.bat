@echo off
echo 🚀 Quick Git Add, Commit & Push Script
echo =====================================

REM Get current timestamp for commit message
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"

echo 📝 Adding all changes...
git add .

if %errorlevel% neq 0 (
    echo ❌ Git add failed!
    pause
    exit /b 1
)

echo ✅ Files added successfully

echo 📦 Committing changes...
git commit -m "Auto-commit %timestamp%"

if %errorlevel% neq 0 (
    echo ❌ Git commit failed!
    pause
    exit /b 1
)

echo ✅ Commit created successfully

echo 🚀 Pushing to origin main...
git push origin main

if %errorlevel% neq 0 (
    echo ❌ Git push failed!
    pause
    exit /b 1
)

echo ✅ Push completed successfully
echo 🎉 All done! Changes deployed to production.
echo.
echo 📋 Summary:
echo   - Files added: ✅
echo   - Commit created: ✅  
echo   - Pushed to origin/main: ✅
echo.
pause