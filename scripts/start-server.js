#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting server...');
console.log('📁 Current working directory:', process.cwd());

// Possible paths where the server index.js might be located
const possiblePaths = [
  'server/dist/index.js',
  'dist/index.js',
  './dist/index.js',
  '../dist/index.js',
  '/opt/render/project/src/server/dist/index.js',
  '/opt/render/project/src/dist/index.js'
];

// Find the server file
let serverPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    serverPath = testPath;
    console.log('✅ Found server at:', testPath);
    break;
  }
}

if (!serverPath) {
  console.log('❌ Server index.js not found in any expected location');
  console.log('🔍 Searching for index.js files...');
  
  // Search recursively for index.js files
  function findIndexJs(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          const found = findIndexJs(fullPath);
          if (found) return found;
        } else if (item === 'index.js' && dir.includes('dist')) {
          return fullPath;
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    return null;
  }
  
  serverPath = findIndexJs('.');
  if (serverPath) {
    console.log('✅ Found server at:', serverPath);
  }
}

if (!serverPath) {
  console.error('❌ Could not find server index.js file');
  console.log('📁 Directory structure:');
  try {
    console.log(JSON.stringify(getDirectoryTree('.'), null, 2));
  } catch (error) {
    console.log('Could not read directory structure');
  }
  process.exit(1);
}

// Change to the directory containing the server file
const serverDir = path.dirname(serverPath);
const serverFile = path.basename(serverPath);

console.log('📂 Changing to directory:', serverDir);
console.log('🎯 Starting server file:', serverFile);

// Start the server
const child = spawn('node', [serverFile], {
  cwd: serverDir,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Helper function to get directory tree
function getDirectoryTree(dir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return '[Max depth reached]';
  
  try {
    const items = fs.readdirSync(dir);
    const tree = {};
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        tree[item] = getDirectoryTree(fullPath, maxDepth, currentDepth + 1);
      } else {
        tree[item] = 'file';
      }
    }
    
    return tree;
  } catch (error) {
    return '[Permission denied]';
  }
}
