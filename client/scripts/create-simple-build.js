#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating simple build configuration...');

// Backup original files
const backupFile = (filePath) => {
  const backupPath = filePath + '.backup';
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backed up ${filePath} to ${backupPath}`);
  }
};

// Restore original files
const restoreFile = (filePath) => {
  const backupPath = filePath + '.backup';
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
    console.log(`✅ Restored ${filePath} from ${backupPath}`);
  }
};

// Replace file content
const replaceFile = (filePath, newContent) => {
  fs.writeFileSync(filePath, newContent);
  console.log(`✅ Updated ${filePath}`);
};

const action = process.argv[2];

if (action === 'create') {
  // Create simple build
  backupFile('src/main.tsx');
  backupFile('src/App.tsx');
  
  // Use simple versions
  replaceFile('src/main.tsx', fs.readFileSync('src/main.simple.tsx', 'utf8'));
  replaceFile('src/App.tsx', fs.readFileSync('src/App.simple.tsx', 'utf8'));
  
  console.log('🎉 Simple build configuration created!');
  console.log('Run: pnpm run build:debug');
  
} else if (action === 'restore') {
  // Restore original files
  restoreFile('src/main.tsx');
  restoreFile('src/App.tsx');
  
  console.log('🎉 Original files restored!');
  
} else {
  console.log('Usage:');
  console.log('  node scripts/create-simple-build.js create   - Create simple build');
  console.log('  node scripts/create-simple-build.js restore - Restore original files');
}
