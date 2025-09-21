#!/bin/bash

# Production Deployment Script for Mnemine
set -e

echo "🚀 Starting production deployment..."

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
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Type checking
    print_status "Running type check..."
    pnpm run type-check
    
    # Linting
    print_status "Running linter..."
    pnpm run lint
    
    # Unit tests
    print_status "Running unit tests..."
    pnpm run test:coverage
    
    print_success "All tests passed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Clean previous builds
    print_status "Cleaning previous builds..."
    pnpm run clean
    
    # Install dependencies
    print_status "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Build shared package
    print_status "Building shared package..."
    pnpm run build:shared
    
    # Build client
    print_status "Building client..."
    pnpm run build:client
    
    # Build server
    print_status "Building server..."
    pnpm run build:server
    
    # Copy frontend to server
    print_status "Copying frontend to server..."
    pnpm run copy:frontend
    
    # Verify deployment
    print_status "Verifying deployment..."
    pnpm run verify:deployment
    
    print_success "Application built successfully"
}

# Deploy to Render
deploy_to_render() {
    print_status "Deploying to Render..."
    
    # Check if render.yaml exists
    if [ ! -f "render-production.yaml" ]; then
        print_error "render-production.yaml not found"
        exit 1
    fi
    
    # Deploy using Render CLI (if available)
    if command -v render &> /dev/null; then
        print_status "Using Render CLI..."
        render deploy --service mnemine-production
    else
        print_warning "Render CLI not found. Please deploy manually using the Render dashboard."
        print_status "Configuration file: render-production.yaml"
    fi
    
    print_success "Deployment initiated"
}

# Main deployment flow
main() {
    print_status "Starting production deployment for Mnemine"
    
    # Check dependencies
    check_dependencies
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy to Render
    deploy_to_render
    
    print_success "Production deployment completed successfully! 🎉"
    print_status "Application should be available at: https://mnemine-production.onrender.com"
}

# Run main function
main "$@"
