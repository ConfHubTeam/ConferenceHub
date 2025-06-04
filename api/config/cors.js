require('dotenv').config();

// Parse allowed origins from environment variable
const parseAllowedOrigins = () => {
  let corsOrigins = [];
  
  if (process.env.CORS_ALLOWED_ORIGINS) {
    try {
      // Parse JSON array from environment variable
      corsOrigins = JSON.parse(process.env.CORS_ALLOWED_ORIGINS);
      console.log('Using CORS_ALLOWED_ORIGINS from environment:', corsOrigins);
    } catch (error) {
      console.error('Error parsing CORS_ALLOWED_ORIGINS:', error);
      // If parsing fails, try to split by comma (common format)
      corsOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    }
  }
  
  // Add FRONTEND_URL if it exists and not already included
  if (process.env.FRONTEND_URL) {
    // Add both with and without trailing slash to be safe
    const frontendUrl = process.env.FRONTEND_URL.trim();
    const frontendUrlNoSlash = frontendUrl.replace(/\/$/, '');
    
    if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
      corsOrigins.push(frontendUrl);
    }
    
    if (frontendUrlNoSlash && !corsOrigins.includes(frontendUrlNoSlash)) {
      corsOrigins.push(frontendUrlNoSlash);
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
  
  return corsOrigins.filter(Boolean); // Remove any undefined/empty values
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
