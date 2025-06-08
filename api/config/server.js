/**
 * Server configuration settings
 */
const path = require('path');
const express = require('express');

// MIME types configuration for various file extensions
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm"
};

/**
 * Configure Express to serve static files with proper MIME types and caching
 * @param {object} app - Express app instance
 * @param {string} clientBuildPath - Path to client build directory
 */
const configureStaticFiles = (app, clientBuildPath) => {
  const fs = require('fs');
  
  // Log the build directory structure for debugging
  if (fs.existsSync(clientBuildPath)) {
    console.log(`Build directory exists at: ${clientBuildPath}`);
    try {
      const files = fs.readdirSync(clientBuildPath);
      console.log('Build directory contents:', files);
      
      // Check for assets directory
      const assetsPath = path.join(clientBuildPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        const assetsFiles = fs.readdirSync(assetsPath);
        console.log('Assets directory contents:', assetsFiles.slice(0, 10)); // Show first 10 files
      }
    } catch (error) {
      console.error('Error reading build directory:', error);
    }
  } else {
    console.error(`Build directory does not exist at: ${clientBuildPath}`);
    return;
  }

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    // Add error handling for static files
    res.on('error', (err) => {
      console.error('Static file serving error:', err);
    });
    
    next();
  });

  // Create a custom static file handler with better error handling
  const staticHandler = express.static(clientBuildPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    index: false, // Don't automatically serve index.html
    setHeaders: (res, filePath, stat) => {
      const ext = path.extname(filePath).toLowerCase();
      
      try {
        // Set proper MIME type
        if (mimeTypes[ext]) {
          res.setHeader("Content-Type", mimeTypes[ext]);
          console.log(`Setting MIME type for ${filePath}: ${mimeTypes[ext]}`);
        }
        
        // Add cache control based on file type
        if (ext === ".html") {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
        
        // Add security headers
        res.setHeader("X-Content-Type-Options", "nosniff");
        
      } catch (error) {
        console.error('Error setting headers for static file:', error);
      }
    }
  });

  // Add error handling middleware for static files
  app.use((req, res, next) => {
    // Check if this is a static file request
    const ext = path.extname(req.path);
    if (ext && mimeTypes[ext]) {
      const filePath = path.join(clientBuildPath, req.path);
      
      // Check if file exists before trying to serve it
      if (fs.existsSync(filePath)) {
        console.log(`Static file found: ${filePath}`);
      } else {
        console.log(`Static file not found: ${filePath}`);
      }
    }
    next();
  });

  // Apply the static file handler
  app.use(staticHandler);

  // Handle all non-API routes by serving index.html (SPA fallback)
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }

    const indexPath = path.join(clientBuildPath, "index.html");
    console.log(`Serving index.html for path: ${req.path} from ${indexPath}`);
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error(`index.html not found at: ${indexPath}`);
      return res.status(500).json({ 
        error: 'Build files not found', 
        path: indexPath,
        buildPath: clientBuildPath 
      });
    }
    
    // Set headers for index.html
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    return res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({ error: 'Error serving application' });
      }
    });
  });
};

/**
 * Server port configuration
 */
const PORT = process.env.PORT || 4000;

module.exports = {
  mimeTypes,
  configureStaticFiles,
  PORT
};
