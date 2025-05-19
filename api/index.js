require("dotenv").config();
const express = require("express");
const cors = require("cors");
// Replace mongoose with Sequelize imports
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Import models from the index.js file
const { sequelize, User, Place, Booking } = require('./models');
const cookieParser = require("cookie-parser");
const multer = require("multer");
const bodyParser = require("body-parser");
const cloudinary = require('./config/cloudinary');
const streamifier = require('streamifier');
const path = require('path');
const session = require('express-session'); // Add session middleware

// Import routes
const telegramAuthRoutes = require('./routes/telegramAuth');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // to read cookies

// Session middleware for Telegram verification
app.use(session({
  secret: process.env.SESSION_SECRET || 'telegram-verification-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  unset: 'destroy' // Ensure session data is completely removed when destroyed
}));

// We're keeping this line for any static files, but primary image hosting will be on Cloudinary
app.use("/uploads", express.static(__dirname + "/uploads")); 

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
      // Empty array if parsing fails
      corsOrigins = [];
    }
  }
  
  // Add FRONTEND_URL if it exists and not already included
  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
    if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
      corsOrigins.push(frontendUrl);
    }
  }
  
  return corsOrigins.filter(Boolean); // Remove any undefined/empty values
};

// Get allowed origins from environment variables
const allowedOrigins = parseAllowedOrigins();
console.log('CORS allowed origins:', allowedOrigins);

// CORS configuration with dynamic origins
app.use(
  cors({
    credentials: true,
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      console.log(`CORS request from origin: ${origin}`);
      
      // Check if the origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`Origin not allowed by CORS: ${origin}`);
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  })
);

const bcryptSalt = bcrypt.genSaltSync(8);
const jwtSecret = process.env.JWT_SECRET;

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

// Move all API endpoints to the apiRouter
apiRouter.get("/test", (req, res) => {
  res.json("test ok");
});

// Endpoint to get password requirements
apiRouter.get("/password-requirements", (req, res) => {
  const allowedSpecialChars = "@$!%*?&";
  res.json({
    minLength: 8,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecialChar: true,
    allowedSpecialChars: allowedSpecialChars,
    regex: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
  });
});

apiRouter.post("/check-user", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  try {
    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (e) {
    console.error("Error checking user existence:", e);
    res.status(500).json({ error: "Failed to check if user exists" });
  }
});

apiRouter.post("/register", async (req, res) => {
  const { name, email, password, userType } = req.body;
  
  // Validate email format
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  
  // Check if password is strong enough
  const allowedSpecialChars = "@$!%*?&";
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    // Check what specific requirement is failing
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = new RegExp(`[${allowedSpecialChars}]`).test(password);
    const hasMinLength = password.length >= 8;
    
    let specificError = "Password must be at least 8 characters with uppercase, lowercase, number and special character";
    
    // If it has invalid special characters but meets all other requirements
    if (hasLowercase && hasUppercase && hasNumber && !hasSpecialChar && hasMinLength) {
      specificError = `Password must include at least one of these special characters: ${allowedSpecialChars}`;
    }
    
    return res.status(400).json({ 
      error: specificError,
      allowedSpecialChars: allowedSpecialChars
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "This email is already registered" });
    }
    
    const userData = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
      userType: userType || 'client', // Default to client if not provided
    });
    res.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      userType: userData.userType
    });
  } catch (e) {
    res.status(422).json(e);
  }
});

apiRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Validate email format
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  
  try {
    // Update Mongoose query to Sequelize query
    const userData = await User.findOne({ where: { email } });
    if (userData) {
      const pass = bcrypt.compareSync(password, userData.password);
      if (pass) {
        jwt.sign(
          { email: userData.email, id: userData.id, userType: userData.userType },
          jwtSecret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            }).json({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              userType: userData.userType
            });
          }
        );
      } else {
        const allowedSpecialChars = "@$!%*?&";
        // Check if password might be failing due to special characters
        const hasSpecialChar = new RegExp(`[${allowedSpecialChars}]`).test(password);
        if (!hasSpecialChar && password.length >= 8) {
          res.status(422).json({ 
            error: "Password must include at least one special character",
            allowedSpecialChars: allowedSpecialChars
          });
        } else {
          res.status(422).json({ error: "Password is incorrect" });
        }
      }
    } else {
      res.status(422).json({ error: "User not found" });
    }
  } catch (e) {
    res.status(422).json(e);
  }
});

function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    // Try to get token from cookies first
    let token = req.cookies.token;
    
    // If not in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      // Extract token from Bearer token format
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return reject(new Error('No authentication token found'));
    }
    
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) reject(err);
      resolve(userData);
    });
  });
}

apiRouter.get("/profile", (req, res) => {
  // Try to get token from cookies first
  let token = req.cookies.token;
  
  // If not in cookies, check Authorization header
  if (!token && req.headers.authorization) {
    // Extract token from Bearer token format
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (token) {
    // reloading info of the logged in user after refreshing
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      try {
        // Update Mongoose findById to Sequelize findByPk
        const user = await User.findByPk(userData.id, {
          // Include all relevant user attributes, particularly Telegram fields
          attributes: [
            'id', 'name', 'email', 'userType', 
            'telegramId', 'telegramUsername', 'telegramFirstName',
            'telegramPhotoUrl', 'telegramPhone', 'telegramLinked'
          ]
        });
        
        if (!user) {
          // User might have been deleted but token is still valid
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User data found:', user.id, user.name, user.email);
        res.json(user);
      } catch (error) {
        console.error('Database error in /profile:', error);
        res.status(500).json({ error: 'Server error while retrieving user profile' });
      }
    });
  } else {
    console.log('No token found in either cookies or Authorization header');
    res.json(null);
  }
});

apiRouter.post("/logout", (req, res) => {
  // Properly clear the token cookie with the same options used when setting it
  res.clearCookie("token", {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }).json({ success: true, message: "Logged out successfully" });
});

// Modified upload function for Cloudinary
const photoMiddleware = multer({ storage: multer.memoryStorage() });
apiRouter.post("/upload", photoMiddleware.array("photos", 100), async (req, res) => {
  const uploadedFiles = [];
  try {
    // Process each file with Cloudinary
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Create upload stream to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
          folder: 'conferencehub',
        }, (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        });
        
        // Pipe the file buffer to the upload stream
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
      
      const uploadResult = await uploadPromise;
      uploadedFiles.push(uploadResult);
    }
    
    res.json(uploadedFiles);
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
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

// New endpoint: Get all users (for agents only)
apiRouter.get("/users", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access user lists" });
    }
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'userType', 'createdAt']
    });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(422).json({ error: error.message });
  }
});

// New endpoint: Delete a user (for agents only)
apiRouter.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.query;
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can delete users" });
    }
    
    // Prevent agents from deleting themselves
    if (id === userData.id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    
    // Additional safety check - require confirmation parameter
    if (confirmation !== 'true') {
      return res.status(400).json({ error: "Confirmation parameter required to delete user" });
    }
    
    // Find the user to delete
    const userToDelete = await User.findByPk(id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Log the deletion attempt for audit purposes
    console.log(`Agent ${userData.id} (${userData.email}) attempting to delete user ${id} (${userToDelete.email})`);
    
    // First, delete all bookings associated with this user
    await Booking.destroy({
      where: { userId: id }
    });
    
    // For hosts, delete all their places and the bookings for those places
    if (userToDelete.userType === 'host') {
      // Find all places owned by this host
      const places = await Place.findAll({
        where: { ownerId: id }
      });
      
      // Delete all bookings for each place
      for (const place of places) {
        await Booking.destroy({
          where: { placeId: place.id }
        });
      }
      
      // Delete all places owned by this host
      await Place.destroy({
        where: { ownerId: id }
      });
    }
    
    // Finally, delete the user
    await userToDelete.destroy();
    
    // Log successful deletion
    console.log(`User ${id} (${userToDelete.email}) successfully deleted by agent ${userData.id}`);
    
    res.json({ success: true, message: "User and all associated data deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting user:", error);
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

// New endpoint: Get booking statistics (for agents only)
apiRouter.get("/stats", async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access statistics" });
    }
    
    // Count total users by type
    const userCounts = await User.findAll({
      attributes: [
        'userType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userType']
    });
    
    // Count bookings by status
    const bookingCounts = await Booking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Count total places
    const totalPlaces = await Place.count();
    
    res.json({
      users: userCounts,
      bookings: bookingCounts,
      places: { total: totalPlaces }
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(422).json({ error: error.message });
  }
});

// Mount the API router at /api prefix
app.use('/api', apiRouter);

// Register Telegram authentication routes
app.use('/api/telegram-auth', telegramAuthRoutes);

// Update the port to use environment variable
const PORT = process.env.PORT || 4000;

// For production: Serve static files from the client build folder
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  
  // Serve static assets from the build folder
  app.use(express.static(clientBuildPath));
  
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
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
