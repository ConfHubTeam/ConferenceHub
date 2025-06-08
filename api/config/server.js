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
  // Add debugging to check if the build directory exists
  const fs = require('fs');
  if (!fs.existsSync(clientBuildPath)) {
    console.error(`Build directory not found: ${clientBuildPath}`);
    return;
  } else {
    console.log(`Build directory found: ${clientBuildPath}`);
    // List contents of build directory for debugging
    const files = fs.readdirSync(clientBuildPath);
    console.log('Build directory contents:', files);
  }

  // Serve static files with proper headers
  app.use(express.static(clientBuildPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: false, // Disable etag generation
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // Set proper MIME type
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }
      
      // Add cache control for static assets
      if (ext !== ".html") {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year
      } else {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
      
      // Add security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  }));

  // Add a debugging middleware to log requests in production
  app.use((req, res, next) => {
    // Log all requests for debugging
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Handle specific static file requests with proper error handling
  app.use('/assets', express.static(path.join(clientBuildPath, 'assets'), {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  }));

  // All routes that aren't API routes should serve the index.html
  app.get("*", (req, res) => {
    // Only handle non-API routes for the React app
    if (!req.path.startsWith("/api/")) {
      const indexPath = path.join(clientBuildPath, "index.html");
      console.log(`Serving index.html for path: ${req.path} from ${indexPath}`);
      
      // Check if index.html exists
      const fs = require('fs');
      if (!fs.existsSync(indexPath)) {
        console.error(`index.html not found at: ${indexPath}`);
        return res.status(500).send('Build files not found');
      }
      
      return res.sendFile(indexPath);
    }
    
    // Let Express continue to handle API routes
    return res.status(404).json({ error: "API endpoint not found" });
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
