// Script to remove development console.log statements
const fs = require('fs');
const path = require('path');

const clientSrcPath = path.join(__dirname, 'client', 'src');

// Files to skip (keep console.log for errors)
const skipFiles = [
  'pages/admin/AdminUsers.tsx', // Keep error logs for admin
  'pages/admin/AdminDashboard.tsx',
  'pages/admin/AdminLottery.tsx',
  'pages/admin/AdminDashboardMinimal.tsx',
  'utils/toast.ts', // Keep toast logs
];

// Patterns to remove (but keep console.error)
const patternsToRemove = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.warn\([^)]*\);?\s*/g,
  /console\.info\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
];

// Patterns to comment out (development logs)
const patternsToComment = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.warn\([^)]*\);?\s*/g,
  /console\.info\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
];

function processFile(filePath) {
  const relativePath = path.relative(clientSrcPath, filePath);
  
  // Skip certain files
  if (skipFiles.some(skipFile => relativePath.includes(skipFile))) {
    console.log(`Skipping ${relativePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Comment out development logs
    patternsToComment.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Don't comment if it's already commented
          if (!match.trim().startsWith('//')) {
            const commented = '// ' + match.trim();
            content = content.replace(match, commented);
            modified = true;
          }
        });
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Processed ${relativePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🧹 Removing development console logs...');
walkDirectory(clientSrcPath);
console.log('✅ Console log cleanup completed!');
