#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

try {
  // Step 1: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('pnpm install --frozen-lockfile', { stdio: 'inherit' });

  // Step 2: Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('cd server && pnpm prisma generate', { stdio: 'inherit' });

  // Step 3: Build shared
  console.log('🔧 Building shared...');
  execSync('pnpm run build:shared', { stdio: 'inherit' });

  // Step 4: Build client
  console.log('🎨 Building client...');
  execSync('pnpm run build:client', { stdio: 'inherit' });

  // Step 5: Build server
  console.log('⚙️ Building server...');
  execSync('cd server && pnpm run build:prod', { stdio: 'inherit' });

  // Step 6: Copy frontend
  console.log('📁 Copying frontend...');
  execSync('pnpm run copy:frontend', { stdio: 'inherit' });

  console.log('✅ Production build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
