require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize, User, Place, Booking } = require('./models');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require('path');
const session = require('express-session');

// Import configuration
const authConfig = require('./config/auth');
const { corsOptions } = require('./config/cors');

// Import middleware
const { getUserDataFromToken } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const telegramAuthRoutes = require('./routes/telegramAuth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const placeRoutes = require('./routes/places');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // to read cookies

// Session middleware for Telegram verification
app.use(session(authConfig.session));

// Use CORS configuration from config/cors.js
app.use(cors(corsOptions));

const bcryptSalt = authConfig.bcrypt.generateSalt();

// Replace MongoDB connection with PostgreSQL connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to PostgreSQL has been established successfully.');
    // Sync all models with the database
    return sequelize.sync({ alter: true }); // In production, use migrations instead
  })
  .then(async () => {
    console.log('All models were synchronized successfully.');
    // Create admin account if it doesn't exist
    await createAdminAccountIfNotExists();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Function to create admin account if it doesn't exist
async function createAdminAccountIfNotExists() {
  try {
    // Admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@conferencehub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123!@#'; // Default password, should be changed in production
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    
    // Check if admin account already exists
    const existingAdmin = await User.findOne({ 
      where: { 
        email: adminEmail,
        userType: 'agent' 
      } 
    });
    
    if (!existingAdmin) {
      console.log('Creating admin account...');
      await User.create({
        name: adminName,
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, bcryptSalt),
        userType: 'agent' // 'agent' is the admin role
      });
      console.log('Admin account created successfully.');
    } else {
      console.log('Admin account already exists.');
    }
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

// Create API router for all API endpoints
const apiRouter = express.Router();

// Upload middleware imported from middleware/uploads.js
const { photoMiddleware, photoUpload, uploadToCloudinary } = require('./middleware/uploads');

// Upload endpoint using the middleware
apiRouter.post("/upload", photoUpload.array("photos", 100), uploadToCloudinary, (req, res) => {
  res.json(req.uploadedFiles || []);
});


// Filtered places endpoint moved to routes/places.js

// Booking routes moved to controllers/bookingController.js and routes/bookings.js

// Booking update endpoint moved to controllers/bookingController.js and routes/bookings.js

// Booking counts endpoint moved to controllers/bookingController.js and routes/bookings.js

// Mount the API router at /api prefix
app.use('/api', apiRouter);

// Register specialized routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/telegram-auth', telegramAuthRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/bookings', bookingRoutes);

// Update the port to use environment variable
const PORT = process.env.PORT || 4000;

// For production: Serve static files from the client build folder
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  // Configure proper MIME types for different file extensions
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  // Serve static assets from the build folder with proper MIME types
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      } else {
        // Default to appropriate type based on extension for files without explicit mapping
        switch (ext) {
          case '.css':
            res.setHeader('Content-Type', 'text/css');
            break;
          case '.js':
            res.setHeader('Content-Type', 'application/javascript');
            break;
          case '.json':
            res.setHeader('Content-Type', 'application/json');
            break;
          default:
            // For unrecognized types, let Express decide
            break;
        }
      }
      // Add cache control for static assets
      if (ext !== '.html') {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
  
  // Add a debugging middleware to log requests in production
  app.use((req, res, next) => {
    // Don't log asset requests to avoid cluttering logs
    if (!req.path.includes('.') || req.path.includes('index.html')) {
      console.log(`Request: ${req.method} ${req.path}`);
    }
    next();
  });

  // All routes that aren't API routes should serve the index.html
  app.get('*', (req, res) => {
    // Only handle non-API routes for the React app
    if (!req.path.startsWith('/api/')) {
      console.log(`Serving index.html for path: ${req.path}`);
      return res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
    
    // Let Express continue to handle API routes
    return res.status(404).json({ error: "API endpoint not found" });
  });
  
  // Add error handling middleware from middleware/errorHandler.js
  app.use(errorHandler);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
