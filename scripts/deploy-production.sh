#!/bin/bash

# Production Deployment Script for Mnemine App
# This script prepares the application for production deployment on Render

set -e  # Exit on any error

echo "🚀 Starting production deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Set production environment
export NODE_ENV=production

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔧 Generating Prisma client for production..."
pnpm run prisma:generate:prod

echo "🏗️ Building client application..."
pnpm run build:client

echo "🏗️ Building server application..."
pnpm run build:server:prod

echo "📁 Copying frontend assets to server..."
pnpm run copy:frontend

echo "🔍 Verifying deployment..."
pnpm run verify:production

echo "✅ Production deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Render using the built files"
echo "2. Set environment variables in Render dashboard"
echo "3. Configure database connection"
echo "4. Test the deployed application"
echo ""
echo "🔐 Admin password set to: nemesisN3M3616"
echo "🌐 Backend URL: https://mnemine-backend.onrender.com"
echo "📱 Frontend URL: https://mnemine-frontend.onrender.com"
