require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize, User, Place, Booking, UserFavorite } = require('./models');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require('path');
const session = require('express-session');

// Import configuration
const authConfig = require('./config/auth');
const { corsOptions } = require('./config/cors');
const { configureStaticFiles, PORT } = require('./config/server');

// Import middleware
const { getUserDataFromToken } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const telegramAuthRoutes = require('./routes/telegramAuth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const placeRoutes = require('./routes/places');
const bookingRoutes = require('./routes/bookings');
const currencyRoutes = require('./routes/currency');
const clickRoutes = require('./routes/click');
const paymeRoutes = require('./routes/payme');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const favoritesRoutes = require('./routes/favorites');

// Import i18n configuration
const { languageMiddleware } = require('./i18n/config');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // to read cookies

// Session middleware for Telegram verification
app.use(session(authConfig.session));

// Use CORS configuration from config/cors.js
app.use(cors(corsOptions));

// Language detection and translation middleware
app.use(languageMiddleware);

const bcryptSalt = authConfig.bcrypt.generateSalt();

// Import currency seeder
const { seedDefaultCurrencies } = require('./routes/currencySeeder');

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
    // Seed default currencies if they don't exist
    await seedDefaultCurrencies();
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

// Import Uzbekistan timezone utilities
const { getCurrentDateInUzbekistan } = require('./utils/uzbekistanTimezoneUtils');

// Create API router for all API endpoints
const apiRouter = express.Router();

// Upload middleware imported from middleware/uploads.js
const { photoMiddleware, photoUpload, uploadToCloudinary } = require('./middleware/uploads');

// Upload endpoint using the middleware
apiRouter.post("/upload", photoUpload.array("photos", 100), uploadToCloudinary, (req, res) => {
  res.json(req.uploadedFiles || []);
});

// Mount the API router at /api prefix
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const fs = require('fs');
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  const healthStatus = {
    status: 'OK',
    timestamp: getCurrentDateInUzbekistan() + 'T' + new Date().toLocaleTimeString('en-US', {timeZone: 'Asia/Tashkent', hour12: false}),
    environment: process.env.NODE_ENV,
    buildPath: clientBuildPath,
    buildExists: fs.existsSync(clientBuildPath)
  };
  
  if (healthStatus.buildExists) {
    try {
      const files = fs.readdirSync(clientBuildPath);
      healthStatus.buildContents = files;
      
      // Check for index.html
      healthStatus.indexExists = fs.existsSync(path.join(clientBuildPath, 'index.html'));
      
      // Check for assets directory
      const assetsPath = path.join(clientBuildPath, 'assets');
      healthStatus.assetsExists = fs.existsSync(assetsPath);
      if (healthStatus.assetsExists) {
        const assetFiles = fs.readdirSync(assetsPath, { recursive: true });
        healthStatus.assetFiles = assetFiles;
      }
    } catch (error) {
      healthStatus.error = error.message;
    }
  }
  
  res.json(healthStatus);
});

// Register specialized routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/telegram-auth', telegramAuthRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/click', clickRoutes);
app.use('/api/payme', paymeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoritesRoutes);

// For production: Serve static files from the client build folder
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  console.log(`Production mode: serving static files from ${clientBuildPath}`);
  
  // Configure static files and routing using the extracted configuration
  configureStaticFiles(app, clientBuildPath);
} else {
  console.log('Development mode: not serving static files');
}

// Add error handling middleware from middleware/errorHandler.js
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
