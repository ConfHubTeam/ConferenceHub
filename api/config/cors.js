require('dotenv').config();

// Parse allowed origins from environment variable
const parseAllowedOrigins = () => {
  let corsOrigins = [];
  
  // For Render deployment, construct the URL using RENDER_EXTERNAL_HOSTNAME
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    const renderUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
    corsOrigins.push(renderUrl);
    console.log('Added Render URL to CORS origins:', renderUrl);
  }
  
  if (process.env.CORS_ALLOWED_ORIGINS) {
    try {
      // Check if it's already a JSON array string
      if (process.env.CORS_ALLOWED_ORIGINS.startsWith('[')) {
        const parsedOrigins = JSON.parse(process.env.CORS_ALLOWED_ORIGINS);
        corsOrigins = corsOrigins.concat(parsedOrigins);
        console.log('Using CORS_ALLOWED_ORIGINS from environment (JSON):', parsedOrigins);
      } else {
        // Handle comma-separated string format
        const splitOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
        corsOrigins = corsOrigins.concat(splitOrigins);
        console.log('Using CORS_ALLOWED_ORIGINS from environment (CSV):', splitOrigins);
      }
    } catch (error) {
      console.error('Error parsing CORS_ALLOWED_ORIGINS:', error);
      // Fallback: try to split by comma (common format)
      const splitOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
      corsOrigins = corsOrigins.concat(splitOrigins);
      console.log('Using fallback CORS parsing:', splitOrigins);
    }
  }
  
  // Add FRONTEND_URL if it exists and not already included
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL !== 'undefined') {
    const frontendUrl = process.env.FRONTEND_URL.trim();
    const frontendUrlNoSlash = frontendUrl.replace(/\/$/, '');
    
    if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
      corsOrigins.push(frontendUrl);
      console.log('Added FRONTEND_URL to CORS origins:', frontendUrl);
    }
    
    if (frontendUrlNoSlash && !corsOrigins.includes(frontendUrlNoSlash)) {
      corsOrigins.push(frontendUrlNoSlash);
    }
  }
  
  // Add APP_URL if it exists and not already included
  if (process.env.APP_URL && process.env.APP_URL !== 'undefined') {
    const appUrl = process.env.APP_URL.trim();
    if (appUrl && !corsOrigins.includes(appUrl)) {
      corsOrigins.push(appUrl);
      console.log('Added APP_URL to CORS origins:', appUrl);
    }
  }
  
  // Add localhost URLs for development
  if (process.env.NODE_ENV !== 'production') {
    const localUrls = ['http://localhost:5173', 'http://localhost:4000', 'http://localhost:3000'];
    localUrls.forEach(url => {
      if (!corsOrigins.includes(url)) {
        corsOrigins.push(url);
      }
    });
  }
  
  return [...new Set(corsOrigins.filter(Boolean))]; // Remove duplicates and empty values
};

// Get allowed origins from environment variables
const allowedOrigins = parseAllowedOrigins();
console.log('CORS allowed origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
  credentials: true,
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    console.log(`CORS request from origin: ${origin}`);
    
    // Check if the origin matches any allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Check for exact matches
      if (allowedOrigin === origin) {
        return true;
      }
      
      // Check for wildcard matches (e.g., *.ngrok-free.app)
      if (allowedOrigin.startsWith('*') && origin.endsWith(allowedOrigin.substring(1))) {
        return true;
      }
      
      // For local development, check if it's a localhost URL regardless of port
      if (process.env.NODE_ENV !== 'production' && 
          origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
        return true;
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`Origin not allowed by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

module.exports = {
  corsOptions,
  parseAllowedOrigins,
  allowedOrigins
};
