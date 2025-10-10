#!/bin/bash

echo "🗑️  Database Reset Script"
echo "========================="
echo ""

# Проверяем, запущен ли сервер
if pgrep -f "node.*server" > /dev/null; then
    echo "⚠️  Warning: Server process detected. Please stop the server before resetting database."
    echo "   Use: pnpm run stop (if you have a stop script)"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Database reset cancelled."
        exit 1
    fi
fi

echo "🔄 Starting database reset..."
echo ""

# Запускаем скрипт сброса базы данных
pnpm run db:reset

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database reset completed successfully!"
    echo "📊 All user data has been cleared"
    echo "👑 Default admin user has been created"
    echo ""
    echo "🚀 You can now start the server with: pnpm run dev"
else
    echo ""
    echo "❌ Database reset failed!"
    exit 1
fi
