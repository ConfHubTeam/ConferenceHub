require("dotenv").config();
const express = require("express");
const cors = require("cors");
// Replace mongoose with Sequelize imports
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Import models from the index.js file
const { sequelize, User, Place, Booking } = require('./models');
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const bodyParser = require("body-parser");
const cloudinary = require('./config/cloudinary');
const streamifier = require('streamifier');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // to read cookies
// We're keeping this line for any static files, but primary image hosting will be on Cloudinary
app.use("/uploads", express.static(__dirname + "/uploads")); 

// Updated CORS configuration for both development and production
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
  .then(() => {
    console.log('All models were synchronized successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Create API router for all API endpoints
const apiRouter = express.Router();

// Move all API endpoints to the apiRouter
apiRouter.get("/test", (req, res) => {
  res.json("test ok");
});

apiRouter.post("/register", async (req, res) => {
  const { name, email, password, userType } = req.body;
  try {
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
            res.cookie("token", token).json({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              userType: userData.userType
            }); // set a cookie
          }
        );
      } else {
        res.status(422).json("password is wrong");
      }
    } else {
      res.status(422).json("user not found");
    }
  } catch (e) {
    res.status(422).json(e);
  }
});

function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) reject(err);
      resolve(userData);
    });
  });
}

apiRouter.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    // reloading info of the logged in user after refreshing
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      // Update Mongoose findById to Sequelize findByPk
      const user = await User.findByPk(userData.id, {
        attributes: ['id', 'name', 'email', 'userType'] // Include userType
      });
      res.json(user);
    });
  } else {
    res.json(null);
  }
});

apiRouter.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

apiRouter.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  try {
    // Upload directly to cloudinary using the external URL
    const result = await cloudinary.uploader.upload(link, {
      folder: 'conferencehub',
    });
    
    // Return the secure URL and public ID for storage in the database
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Error uploading image by link:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
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
    price, startDate, endDate, roomType
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
      roomType: roomType || "Conference Room"
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
    price, startDate, endDate, roomType
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
    place.roomType = roomType || "Conference Room";
    
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
      type, 
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
    
    // Filter by room type
    if (type) {
      whereConditions.roomType = {
        [Op.eq]: type // Exact match on room type
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

// Mount the API router at /api prefix
app.use('/api', apiRouter);

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
