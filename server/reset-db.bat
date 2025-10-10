@echo off
echo 🗑️  Database Reset Script
echo ========================
echo.

echo 🔄 Starting database reset...
echo.

call pnpm run db:reset

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database reset completed successfully!
    echo 📊 All user data has been cleared
    echo 👑 Default admin user has been created
    echo.
    echo 🚀 You can now start the server with: pnpm run dev
) else (
    echo.
    echo ❌ Database reset failed!
    pause
    exit /b 1
)

pause
