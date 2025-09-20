#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  const serverPath = path.join(__dirname, '..', 'server');
  const publicPath = path.join(serverPath, 'public');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Frontend build not found at:', distPath);
    console.log('   Run "pnpm run build:client" first');
    process.exit(1);
  }
  
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Server directory not found at:', serverPath);
    process.exit(1);
  }
  
  console.log('📁 Copying frontend build from:', distPath);
  console.log('📁 To server public directory:', publicPath);
  
  try {
    copyDir(distPath, publicPath);
    console.log('✅ Frontend successfully copied to server/public');
    
    // Verify the copy
    const indexHtmlPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      console.log('✅ index.html found in server/public');
    } else {
      console.log('⚠️  index.html not found in server/public');
    }
  } catch (error) {
    console.error('❌ Error copying frontend:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { copyDir };
