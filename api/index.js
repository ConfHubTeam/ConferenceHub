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

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // to read cookies

// Session middleware for Telegram verification
app.use(session(authConfig.session));

// Use CORS configuration from config/cors.js
app.use(cors(corsOptions));

const bcryptSalt = authConfig.bcrypt.generateSalt();
const jwtSecret = authConfig.jwt.secret;

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

// submit new place form
apiRouter.post("/places", async (req, res) => {
  const {
    title, address, photos,
    description, perks, extraInfo, 
    checkIn, checkOut, maxGuests, 
    price, startDate, endDate,
    youtubeLink, lat, lng
  } = req.body;

  try {
    // Validate required fields
    if (!title || !address) {
      return res.status(422).json({ error: "Title and address are required fields" });
    }

    const userData = await getUserDataFromToken(req);
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is a host
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can create conference rooms" });
    }
    
    // Process photos to ensure they're stored correctly
    let processedPhotos = [];
    if (Array.isArray(photos)) {
      processedPhotos = photos.map(photo => {
        // If photo is an object with url property, store just the URL
        if (typeof photo === 'object' && photo !== null && photo.url) {
          return photo.url;
        }
        return photo;
      });
    }
    
    // Process numeric fields
    const processedData = {
      ownerId: userData.id,
      title, 
      address, 
      photos: processedPhotos,
      description: description || "",
      perks: Array.isArray(perks) ? perks : [],
      extraInfo: extraInfo || "",
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      maxGuests: maxGuests ? parseInt(maxGuests, 10) : 1,
      price: price ? parseFloat(price) : 0,
      startDate: startDate || null,
      endDate: endDate || null,
      youtubeLink: youtubeLink || null, // Add the YouTube link field
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null
    };

    const placeDoc = await Place.create(processedData);
    res.json(placeDoc);
  } catch (error) {
    console.error("Place creation error:", error);
    res.status(422).json({ 
      error: error.message, 
      details: error.errors ? error.errors.map(e => e.message) : undefined 
    });
  }
});

apiRouter.get("/user-places", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    // Update Mongoose find to Sequelize findAll
    const places = await Place.findAll({
      where: { ownerId: userData.id }
    });
    res.json(places);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});

apiRouter.get("/place/:id", async (req, res) => {
  const {id} = req.params;
  try {
    // Update Mongoose findById to Sequelize findByPk
    const place = await Place.findByPk(id);
    res.json(place);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});

apiRouter.get("/place/:placeId/:bookingId", async (req, res) => {
  const {bookingId} = req.params;
  try {
    // Update Mongoose findById to Sequelize findByPk
    const booking = await Booking.findByPk(bookingId);
    res.json(booking);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});

apiRouter.put("/places", async (req, res) => { 
  const {
    id, title, address, photos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests,
    price, startDate, endDate, youtubeLink, lat, lng
  } = req.body;
  
  try {
    const userData = await getUserDataFromToken(req);
    
    // Check if user is a host
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can update conference rooms" });
    }
    
    // Update Mongoose findById to Sequelize findByPk
    const place = await Place.findByPk(id);
    
    if (!place) {
      return res.status(404).json({ error: "Conference room not found" });
    }
    
    // Check if the current user is the owner
    if (userData.id !== place.ownerId) {
      return res.status(403).json({ error: "You can only manage your own conference rooms" });
    }
    
    // Process photos to ensure they're stored correctly
    let processedPhotos = [];
    if (Array.isArray(photos)) {
      processedPhotos = photos.map(photo => {
        // If photo is an object with url property, store just the URL
        if (typeof photo === 'object' && photo !== null) {
          if (photo.url) {
            return photo.url;
          }
          // If photo is a stringified object, parse it
          if (typeof photo === 'string' && photo.startsWith('{') && photo.endsWith('}')) {
            try {
              const parsedPhoto = JSON.parse(photo);
              return parsedPhoto.url || photo;
            } catch (e) {
              return photo;
            }
          }
        }
        // If it's already a string URL, keep it that way
        return photo;
      });
    }

    // Update place properties
    place.title = title;
    place.address = address;
    place.photos = processedPhotos;
    place.description = description;
    place.perks = perks;
    place.extraInfo = extraInfo;
    place.checkIn = checkIn;
    place.checkOut = checkOut;
    place.maxGuests = maxGuests;
    place.price = price;
    place.startDate = startDate;
    place.endDate = endDate;
    place.youtubeLink = youtubeLink || null; // Add the YouTube link
    place.lat = lat ? parseFloat(lat) : null;
    place.lng = lng ? parseFloat(lng) : null;
    
    await place.save();
    res.json("ok");
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(422).json({ error: error.message });
  }
});

apiRouter.get("/home", async (req, res) => {
  try {
    // Extract filter parameters from query
    const { 
      location, 
      checkIn, 
      checkOut, 
      guests, 
      minPrice, 
      maxPrice, 
      tags 
    } = req.query;
    
    // Build where conditions for Sequelize query
    const whereConditions = {};
    const { Op } = require('sequelize');
    
    // Filter by location (address)
    if (location) {
      whereConditions.address = {
        [Op.iLike]: `%${location}%` // Case-insensitive search
      };
    }
    
    // Filter by date availability (conference room should be available during the requested period)
    if (checkIn && checkOut) {
      whereConditions[Op.and] = [
        {
          startDate: {
            [Op.lte]: new Date(checkIn)  // Room is available from before or on checkIn date
          }
        },
        {
          endDate: {
            [Op.gte]: new Date(checkOut) // Room is available until after or on checkOut date
          }
        }
      ];
    }
    
    // Filter by maximum guests
    if (guests) {
      whereConditions.maxGuests = {
        [Op.gte]: parseInt(guests) // Capacity is at least the requested number of guests
      };
    }
    
    // Filter by price range
    if (minPrice) {
      whereConditions.price = {
        ...(whereConditions.price || {}),
        [Op.gte]: parseFloat(minPrice)
      };
    }
    
    if (maxPrice) {
      whereConditions.price = {
        ...(whereConditions.price || {}),
        [Op.lte]: parseFloat(maxPrice)
      };
    }

    // Filter by tags/perks
    if (tags) {
      const tagList = tags.split(',');
      whereConditions.perks = {
        [Op.overlap]: tagList // Match any of the selected perks (PostgreSQL array overlap)
      };
    }
    
    // Get all places matching the filters
    const places = await Place.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']] // Show newest places first
    });
    
    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(422).json({ error: error.message });
  }
});

apiRouter.post("/bookings", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const {place, checkInDate, checkOutDate, 
      numOfGuests, guestName, guestPhone, totalPrice} = req.body;

    // Create booking with Sequelize
    const booking = await Booking.create({
      userId: userData.id, // Use userId instead of user
      placeId: place, // Use placeId instead of place
      checkInDate,
      checkOutDate, 
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice,
      status: 'pending' // Explicitly set status to pending
    });
    
    res.json(booking);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});

apiRouter.get("/bookings", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { userId } = req.query;
    
    // For agents with userId parameter - get bookings for a specific user
    if (userData.userType === 'agent' && userId) {
      const userBookings = await Booking.findAll({
        where: { 
          userId: userId
        },
        include: [
          {
            model: Place,
            as: 'place',
            include: [{
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }],
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'ownerId']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      return res.json(userBookings);
    }
    
    // Agents can see all bookings across the system
    if (userData.userType === 'agent') {
      const allBookings = await Booking.findAll({
        include: [
          {
            model: Place,
            as: 'place',
            include: [{
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }],
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'ownerId']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      return res.json(allBookings);
    }
    
    if (userData.userType === 'host') {
      // For hosts: Find bookings for conference rooms they own
      const hostBookings = await Booking.findAll({
        include: [
          {
            model: Place,
            as: 'place',
            where: { ownerId: userData.id },
            attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      res.json(hostBookings);
    } else {
      // For clients: Find bookings made by this user
      // Exclude rejected/cancelled bookings
      const clientBookings = await Booking.findAll({
        where: { 
          userId: userData.id,
          status: ['pending', 'approved'] // Only return pending and approved bookings
        },
        include: {
          model: Place,
          as: 'place',
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut']
        },
        order: [
          ['createdAt', 'DESC'] // Most recent bookings first
        ]
      });
      
      res.json(clientBookings);
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(422).json({ error: error.message });
  }
});

// New endpoint: Update booking status (approve/reject)
apiRouter.put("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userData = await getUserDataFromToken(req);
    
    // Verify status is valid
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    // Get the booking
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Place,
          as: 'place'
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Check if logged in user is the host of the place
    if (userData.userType === 'host') {
      // Verify this host owns the place
      if (booking.place.ownerId !== userData.id) {
        return res.status(403).json({ error: "You can only manage bookings for your own places" });
      }
      
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else if (userData.userType === 'agent') {
      // Agents can update booking status for any booking
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else if (userData.userType === 'client' && booking.userId === userData.id) {
      // Client can cancel their own booking by setting status to 'rejected'
      if (status !== 'rejected') {
        return res.status(403).json({ error: "Clients can only cancel their bookings" });
      }
      
      booking.status = status;
      await booking.save();
      
      return res.json({ success: true, booking });
    } else {
      return res.status(403).json({ error: "Not authorized to update this booking" });
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(422).json({ error: error.message });
  }
});

// New endpoint to count pending booking requests for hosts
apiRouter.get("/bookings/counts", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can access booking counts" });
    }
    
    const pendingCount = await Booking.count({
      include: [
        {
          model: Place,
          as: 'place',
          where: { ownerId: userData.id },
          attributes: []
        }
      ],
      where: {
        status: 'pending'
      }
    });
    
    res.json({ pendingCount });
  } catch (error) {
    console.error("Error fetching booking counts:", error);
    res.status(422).json({ error: error.message });
  }
});

// New endpoint: Delete a place and all its associated bookings
apiRouter.delete("/places/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await getUserDataFromToken(req);

    // Verify user is authenticated
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is a host
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can delete conference rooms" });
    }
    
    // Find the place
    const place = await Place.findByPk(id);
    
    if (!place) {
      return res.status(404).json({ error: "Conference room not found" });
    }
    
    // Verify this host is the owner
    if (place.ownerId !== userData.id) {
      return res.status(403).json({ error: "You can only delete your own conference rooms" });
    }
    
    // Find all bookings associated with this place
    const bookings = await Booking.findAll({
      where: { placeId: id }
    });
    
    // Delete all bookings first (to maintain referential integrity)
    if (bookings.length > 0) {
      await Booking.destroy({
        where: { placeId: id }
      });
    }
    
    // Delete the place
    await place.destroy();
    
    res.json({ success: true, message: "Conference room and all associated bookings deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting conference room:", error);
    res.status(422).json({ error: error.message });
  }
});

// New endpoint: Get all places (for agents only)
apiRouter.get("/places", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access all places" });
    }
    
    // Get all places with their owners
    const places = await Place.findAll({
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(422).json({ error: error.message });
  }
});

// Mount the API router at /api prefix
app.use('/api', apiRouter);

// Register specialized routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/telegram-auth', telegramAuthRoutes);

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
