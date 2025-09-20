#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (NOT FOUND)`);
    return false;
  }
}

function checkDirectoryContents(dirPath, description) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    console.log(`📁 ${description}: ${dirPath}`);
    console.log(`   Contents: ${files.join(', ')}`);
    return files.length > 0;
  } else {
    console.log(`❌ ${description}: ${dirPath} (NOT FOUND)`);
    return false;
  }
}

function main() {
  console.log('🔍 Verifying deployment structure...\n');
  
  const isProduction = process.argv.includes('production');
  const basePath = isProduction ? process.cwd() : process.cwd();
  
  console.log(`Base path: ${basePath}`);
  console.log(`Mode: ${isProduction ? 'production' : 'development'}\n`);
  
  let allChecksPassed = true;
  
  // Check server build
  console.log('=== Server Build ===');
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'server/dist/index.js'),
    'Server entry point'
  );
  allChecksPassed &= checkDirectoryContents(
    path.join(basePath, 'server/dist'),
    'Server dist directory'
  );
  
  // Check frontend build
  console.log('\n=== Frontend Build ===');
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'server/public/index.html'),
    'Frontend index.html'
  );
  allChecksPassed &= checkDirectoryContents(
    path.join(basePath, 'server/public'),
    'Server public directory'
  );
  
  // Check shared package
  console.log('\n=== Shared Package ===');
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'shared/constants.js'),
    'Shared constants.js'
  );
  
  // Check package.json files
  console.log('\n=== Package Files ===');
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'package.json'),
    'Root package.json'
  );
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'server/package.json'),
    'Server package.json'
  );
  
  // Check Prisma
  console.log('\n=== Prisma ===');
  allChecksPassed &= checkFileExists(
    path.join(basePath, 'server/prisma/schema.prisma'),
    'Prisma schema'
  );
  
  console.log('\n=== Summary ===');
  if (allChecksPassed) {
    console.log('✅ All deployment checks passed!');
    process.exit(0);
  } else {
    console.log('❌ Some deployment checks failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFileExists, checkDirectoryContents };