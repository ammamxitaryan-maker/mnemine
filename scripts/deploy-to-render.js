#!/usr/bin/env node

/**
 * Deployment script for Render.com
 * This script helps deploy the application to Render with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Render deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('render.yaml')) {
  console.error('❌ render.yaml not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if render CLI is installed
try {
  execSync('render --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Render CLI not found. Please install it first:');
  console.error('   npm install -g @render/cli');
  console.error('   or visit: https://render.com/docs/cli');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('render whoami', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not logged in to Render. Please login first:');
  console.error('   render login');
  process.exit(1);
}

console.log('✅ Render CLI is ready\n');

// Validate environment variables
console.log('🔍 Validating environment variables...');

const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'ADMIN_TELEGRAM_ID',
  'DATABASE_URL'
];

const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your Render dashboard or as environment variables.');
  process.exit(1);
}

console.log('✅ Environment variables validated\n');

// Run pre-deployment checks
console.log('🔍 Running pre-deployment checks...');

try {
  console.log('   - Checking TypeScript compilation...');
  execSync('pnpm run type-check', { stdio: 'pipe' });
  console.log('   ✅ TypeScript compilation passed');

  console.log('   - Running linting...');
  execSync('pnpm run lint:check', { stdio: 'pipe' });
  console.log('   ✅ Linting passed');

  console.log('   - Running tests...');
  execSync('pnpm test', { stdio: 'pipe' });
  console.log('   ✅ Tests passed');
} catch (error) {
  console.error('❌ Pre-deployment checks failed. Please fix the issues before deploying.');
  process.exit(1);
}

console.log('\n✅ All pre-deployment checks passed\n');

// Deploy to Render
console.log('🚀 Deploying to Render...');

try {
  execSync('render deploy', { stdio: 'inherit' });
  console.log('\n✅ Deployment completed successfully!');
  
  console.log('\n📋 Post-deployment checklist:');
  console.log('   1. Verify the application is running at your Render URL');
  console.log('   2. Check the logs for any errors');
  console.log('   3. Test the Telegram WebApp functionality');
  console.log('   4. Verify database connectivity');
  console.log('   5. Check webhook configuration');
  
} catch (error) {
  console.error('\n❌ Deployment failed. Check the logs above for details.');
  process.exit(1);
}

