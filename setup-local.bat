@echo off
echo Setting up local development environment...

REM Copy environment file
if not exist .env (
    copy env.local .env
    echo Created .env file from env.local template
) else (
    echo .env file already exists
)

REM Install dependencies
echo Installing dependencies...
pnpm install

REM Build the project
echo Building the project...
pnpm run build

echo.
echo Local development setup complete!
echo.
echo To start the development server:
echo   pnpm run dev
echo.
echo To start the production server:
echo   pnpm run start
echo.
echo The application will be available at:
echo   Frontend: http://localhost:5173
echo   Backend: http://localhost:10112
echo.
echo For local development, the app includes:
echo - Fallback authentication (no Telegram required)
echo - Test user creation
echo - Mock Telegram data
echo.
pause
