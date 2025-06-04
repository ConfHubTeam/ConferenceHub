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
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      } else {
        // Default to appropriate type based on extension for files without explicit mapping
        switch (ext) {
          case ".css":
            res.setHeader("Content-Type", "text/css");
            break;
          case ".js":
            res.setHeader("Content-Type", "application/javascript");
            break;
          case ".json":
            res.setHeader("Content-Type", "application/json");
            break;
          default:
            // For unrecognized types, let Express decide
            break;
        }
      }
      // Add cache control for static assets
      if (ext !== ".html") {
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  }));

  // Add a debugging middleware to log requests in production
  app.use((req, res, next) => {
    // Don't log asset requests to avoid cluttering logs
    if (!req.path.includes(".") || req.path.includes("index.html")) {
      console.log(`Request: ${req.method} ${req.path}`);
    }
    next();
  });

  // All routes that aren't API routes should serve the index.html
  app.get("*", (req, res) => {
    // Only handle non-API routes for the React app
    if (!req.path.startsWith("/api/")) {
      console.log(`Serving index.html for path: ${req.path}`);
      return res.sendFile(path.join(clientBuildPath, "index.html"));
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
