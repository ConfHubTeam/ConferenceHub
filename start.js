#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Startup Diagnostics ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);

// Check if client build exists
const clientBuildPath = path.join(__dirname, 'client/dist');
console.log(`\nChecking build directory: ${clientBuildPath}`);
console.log(`Build directory exists: ${fs.existsSync(clientBuildPath)}`);

if (fs.existsSync(clientBuildPath)) {
  try {
    const files = fs.readdirSync(clientBuildPath);
    console.log('Build directory contents:', files);
    
    // Check for index.html
    const indexPath = path.join(clientBuildPath, 'index.html');
    console.log(`index.html exists: ${fs.existsSync(indexPath)}`);
    
    // Check for assets directory
    const assetsPath = path.join(clientBuildPath, 'assets');
    console.log(`Assets directory exists: ${fs.existsSync(assetsPath)}`);
    
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      console.log('Assets directory contents:', assetFiles);
    }
  } catch (error) {
    console.error('Error reading build directory:', error.message);
  }
} else {
  console.error('❌ Build directory not found! The build process may have failed.');
}

console.log('\n=== Starting API Server ===');

// Start the main application
require('./api/index.js');
