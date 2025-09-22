#!/bin/bash

# QA Test Runner Script for Mnemine Project
# This script runs all quality assurance tests

set -e

echo "🚀 Starting QA Test Suite for Mnemine Project"
echo "=============================================="

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
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Run server tests
print_status "Running server unit tests..."
cd server
if pnpm test; then
    print_success "Server unit tests passed"
else
    print_error "Server unit tests failed"
    exit 1
fi
cd ..

# Run client tests
print_status "Running client unit tests..."
cd client
if pnpm test; then
    print_success "Client unit tests passed"
else
    print_error "Client unit tests failed"
    exit 1
fi
cd ..

# Run integration tests
print_status "Running integration tests..."
cd server
if pnpm test -- --run src/__tests__/integration/; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi
cd ..

# Run type checking
print_status "Running type checking..."
if pnpm type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Run linting
print_status "Running linting..."
if pnpm lint:check; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

# Run security audit
print_status "Running security audit..."
if pnpm audit --audit-level moderate; then
    print_success "Security audit passed"
else
    print_warning "Security audit found issues (check output above)"
fi

# Generate test coverage report
print_status "Generating test coverage report..."
cd server
if pnpm test:coverage; then
    print_success "Server test coverage generated"
else
    print_warning "Server test coverage generation failed"
fi
cd ..

cd client
if pnpm test:coverage; then
    print_success "Client test coverage generated"
else
    print_warning "Client test coverage generation failed"
fi
cd ..

# Summary
echo ""
echo "=============================================="
echo "🎉 QA Test Suite Completed Successfully!"
echo "=============================================="
echo ""
echo "📊 Test Results Summary:"
echo "  ✅ Server unit tests: PASSED"
echo "  ✅ Client unit tests: PASSED"
echo "  ✅ Integration tests: PASSED"
echo "  ✅ Type checking: PASSED"
echo "  ✅ Linting: PASSED"
echo "  ⚠️  Security audit: CHECK OUTPUT ABOVE"
echo ""
echo "📁 Coverage reports generated in:"
echo "  - server/coverage/"
echo "  - client/coverage/"
echo ""
echo "🚀 Project is ready for production deployment!"
echo ""

# Optional: Open coverage reports
if command -v open &> /dev/null; then
    read -p "Would you like to open the coverage reports? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open server/coverage/index.html
        open client/coverage/index.html
    fi
fi

exit 0
