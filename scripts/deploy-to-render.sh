#!/bin/bash

# Mnemine Render Deployment Script
# This script helps prepare and deploy the application to Render

set -e

echo "🚀 Mnemine Render Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "render.yaml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment preparation..."

# Step 1: Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Type checking
print_status "Running type checks..."
pnpm run type-check

# Step 3: Linting
print_status "Running linter..."
pnpm run lint

# Step 4: Running tests
print_status "Running tests..."
pnpm run test

# Step 5: Building the application
print_status "Building application..."
pnpm run build

# Step 6: Copying frontend to server
print_status "Copying frontend build to server..."
pnpm run copy:frontend

# Step 7: Verifying deployment
print_status "Verifying deployment structure..."
pnpm run verify:production

print_success "Build completed successfully!"

# Step 8: Check git status
print_status "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Consider committing them before deployment."
    git status --short
    echo
    read -p "Do you want to continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# Step 9: Check if we're on main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    print_warning "You're not on the main branch (currently on: $current_branch)"
    read -p "Do you want to switch to main branch? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        print_success "Switched to main branch"
    else
        print_warning "Continuing with current branch: $current_branch"
    fi
fi

# Step 10: Push to GitHub
print_status "Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || print_warning "No changes to commit"
git push origin main

print_success "Code pushed to GitHub successfully!"

# Step 11: Deployment instructions
echo
echo "🎉 Deployment Preparation Complete!"
echo "=================================="
echo
print_status "Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Create a new Blueprint deployment"
echo "3. Connect your GitHub repository"
echo "4. Select the 'render.yaml' file"
echo "5. Configure environment variables:"
echo "   - TELEGRAM_BOT_TOKEN: Your Telegram bot token"
echo "   - ADMIN_TELEGRAM_ID: Your Telegram user ID"
echo "6. Click 'Apply' to deploy"
echo
print_status "Your application will be available at: https://mnemine-app.onrender.com"
echo
print_warning "Remember to:"
echo "- Set up your Telegram bot webhook"
echo "- Monitor the deployment logs"
echo "- Test the health check endpoint"
echo "- Verify all functionality works"

print_success "Deployment script completed!"
