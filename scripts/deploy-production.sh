#!/bin/bash

# Production Deployment Script
# This script prepares the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version check passed: $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

print_status "pnpm version: $(pnpm --version)"

# Clean previous builds
print_status "Cleaning previous builds..."
pnpm run clean:all

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
print_status "Generating Prisma client..."
pnpm run prisma:generate

# Run type checking
print_status "Running type checks..."
pnpm run type-check

# Run linting
print_status "Running linting..."
pnpm run lint:check

# Run tests
print_status "Running tests..."
pnpm run test

# Build client
print_status "Building client..."
pnpm run build:client

# Build server
print_status "Building server..."
pnpm run build:server

# Copy frontend to server public directory
print_status "Copying frontend files to server..."
pnpm run copy:frontend

# Verify deployment
print_status "Verifying deployment..."
pnpm run verify:production

print_status "✅ Production deployment completed successfully!"

# Display next steps
echo ""
print_status "Next steps:"
echo "1. Set up environment variables in .env file"
echo "2. Configure your reverse proxy (nginx/apache)"
echo "3. Set up SSL certificates"
echo "4. Configure your database (if using external DB)"
echo "5. Start the server with: pnpm run start:prod"
echo ""
print_warning "Make sure to:"
echo "- Update JWT_SECRET, ENCRYPTION_KEY, and SESSION_SECRET"
echo "- Set up proper CORS origins"
echo "- Configure rate limiting"
echo "- Set up monitoring and logging"
echo "- Configure backup strategy"