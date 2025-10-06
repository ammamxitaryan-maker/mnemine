#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Verifies that the application is ready for production deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(path, description) {
  if (existsSync(path)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${path}`, 'red');
    return false;
  }
}

function checkEnvironmentVariable(envVar, description) {
  if (process.env[envVar]) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Environment variable not set: ${envVar}`, 'red');
    return false;
  }
}

function checkBuildOutput() {
  log('\n🔍 Checking build outputs...', 'blue');
  
  const checks = [
    checkFile('server/dist/index.js', 'Server build output'),
    checkFile('server/dist/package.json', 'Server package.json'),
    checkFile('client/dist/index.html', 'Client build output'),
    checkFile('server/public/index.html', 'Frontend assets copied to server')
  ];
  
  return checks.every(check => check);
}

function checkEnvironmentConfiguration() {
  log('\n🔍 Checking environment configuration...', 'blue');
  
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'SESSION_SECRET',
    'ADMIN_PASSWORD',
    'ADMIN_TELEGRAM_ID',
    'ADMIN_TELEGRAM_IDS'
  ];
  
  const checks = requiredEnvVars.map(envVar => 
    checkEnvironmentVariable(envVar, `Environment variable: ${envVar}`)
  );
  
  return checks.every(check => check);
}

function checkAdminConfiguration() {
  log('\n🔍 Checking admin configuration...', 'blue');
  
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
  
  if (adminPassword === 'nemesisN3M3616') {
    log('✅ Admin password correctly set', 'green');
  } else {
    log('❌ Admin password not set correctly', 'red');
    return false;
  }
  
  if (adminTelegramId === '6760298907') {
    log('✅ Admin Telegram ID correctly set', 'green');
  } else {
    log('❌ Admin Telegram ID not set correctly', 'red');
    return false;
  }
  
  return true;
}

function checkSecurityConfiguration() {
  log('\n🔍 Checking security configuration...', 'blue');
  
  const checks = [
    checkEnvironmentVariable('JWT_SECRET', 'JWT secret configured'),
    checkEnvironmentVariable('ENCRYPTION_KEY', 'Encryption key configured'),
    checkEnvironmentVariable('SESSION_SECRET', 'Session secret configured'),
    checkEnvironmentVariable('TELEGRAM_WEBHOOK_SECRET', 'Telegram webhook secret configured')
  ];
  
  return checks.every(check => check);
}

function checkDatabaseConfiguration() {
  log('\n🔍 Checking database configuration...', 'blue');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.includes('postgresql://')) {
    log('✅ Database URL configured for PostgreSQL', 'green');
    return true;
  } else {
    log('❌ Database URL not configured or invalid', 'red');
    return false;
  }
}

function checkBuildOptimization() {
  log('\n🔍 Checking build optimization...', 'blue');
  
  // Check if client build is optimized
  if (existsSync('client/dist/assets')) {
    const assets = require('fs').readdirSync('client/dist/assets');
    const hasMinifiedFiles = assets.some(file => file.includes('.js') && !file.includes('.map'));
    
    if (hasMinifiedFiles) {
      log('✅ Client build is optimized (minified)', 'green');
    } else {
      log('⚠️ Client build may not be optimized', 'yellow');
    }
  }
  
  // Check server build
  if (existsSync('server/dist/index.js')) {
    const serverSize = require('fs').statSync('server/dist/index.js').size;
    if (serverSize > 0) {
      log('✅ Server build output exists', 'green');
    } else {
      log('❌ Server build output is empty', 'red');
      return false;
    }
  }
  
  return true;
}

function checkRenderConfiguration() {
  log('\n🔍 Checking Render configuration...', 'blue');
  
  const checks = [
    checkFile('render.yaml', 'Render configuration file'),
    checkFile('scripts/deploy-production.sh', 'Production deployment script')
  ];
  
  return checks.every(check => check);
}

function main() {
  log('🚀 Mnemine Production Readiness Verification', 'bold');
  log('==========================================', 'bold');
  
  const checks = [
    checkBuildOutput(),
    checkEnvironmentConfiguration(),
    checkAdminConfiguration(),
    checkSecurityConfiguration(),
    checkDatabaseConfiguration(),
    checkBuildOptimization(),
    checkRenderConfiguration()
  ];
  
  const allPassed = checks.every(check => check);
  
  log('\n📋 Summary:', 'blue');
  log('===========', 'blue');
  
  if (allPassed) {
    log('🎉 All checks passed! Your application is ready for production deployment.', 'green');
    log('\n📝 Next steps:', 'blue');
    log('1. Deploy to Render using the render.yaml configuration', 'blue');
    log('2. Set environment variables in Render dashboard', 'blue');
    log('3. Configure database connection', 'blue');
    log('4. Test the deployed application', 'blue');
    log('\n🔐 Admin credentials:', 'yellow');
    log('Password: nemesisN3M3616', 'yellow');
    log('Telegram ID: 6760298907', 'yellow');
  } else {
    log('❌ Some checks failed. Please fix the issues before deploying.', 'red');
    process.exit(1);
  }
}

// Run the verification
main();
