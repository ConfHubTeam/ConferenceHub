const { Place, Booking, User } = require('../models');
const { getUserDataFromToken } = require('../middleware/auth');
const Currency = require('../models/currency');

/**
 * Create a new place
 */
const createPlace = async (req, res) => {
  const {
    title, address, photos,
    description, perks, extraInfo, 
    checkIn, checkOut, maxGuests, 
    price, startDate, endDate,
    youtubeLink, lat, lng, currencyId, cooldown
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
    // Validate currencyId exists in the database
    let validatedCurrencyId = null;
    if (currencyId) {
      // Try to parse as an integer
      const parsedId = parseInt(currencyId, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        try {
          // Check if the currency exists in the database
          const currencyExists = await Currency.findByPk(parsedId);
          if (currencyExists) {
            validatedCurrencyId = parsedId;
          } else {
            console.warn(`Currency with ID ${parsedId} not found, defaulting to null`);
          }
        } catch (err) {
          console.error("Error validating currency:", err);
        }
      }
    }
    
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
      lng: lng ? parseFloat(lng) : null,
      currencyId: validatedCurrencyId,
      cooldown: cooldown ? parseInt(cooldown, 10) : 30
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
};

/**
 * Get places for the current user
 */
const getUserPlaces = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    // Update Mongoose find to Sequelize findAll with currency join
    const places = await Place.findAll({
      where: { ownerId: userData.id },
      include: [
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'name', 'code', 'charCode']
        }
      ]
    });
    res.json(places);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get a specific place by ID
 */
const getPlaceById = async (req, res) => {
  const {id} = req.params;
  try {
    // Include currency relation to get currency details
    const place = await Place.findByPk(id, {
      include: [
        { model: Currency, as: 'currency' }
      ]
    });
    res.json(place);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get a specific booking for a place
 */
const getBookingForPlace = async (req, res) => {
  const {bookingId} = req.params;
  try {
    // Update Mongoose findById to Sequelize findByPk
    const booking = await Booking.findByPk(bookingId);
    res.json(booking);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
};

/**
 * Update a place
 */
const updatePlace = async (req, res) => {
  const {
    id, title, address, photos, description,
    perks, extraInfo, checkIn, checkOut, maxGuests,
    price, startDate, endDate, youtubeLink, lat, lng,
    currencyId, cooldown
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
    
    // Validate currencyId exists in the database before updating
    if (currencyId) {
      // Try to parse as an integer
      const parsedId = parseInt(currencyId, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        try {
          // Check if the currency exists in the database
          const currencyExists = await Currency.findByPk(parsedId);
          if (currencyExists) {
            place.currencyId = parsedId;
          } else {
            console.warn(`Currency with ID ${parsedId} not found, not updating currencyId`);
          }
        } catch (err) {
          console.error("Error validating currency:", err);
        }
      }
    } else {
      place.currencyId = null;
    }
    
    place.cooldown = cooldown ? parseInt(cooldown, 10) : 30;
    
    await place.save();
    res.json("ok");
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get all places (with optional filtering)
 */
const getHomePlaces = async (req, res) => {
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
    
    // Get all places matching the filters with currency information
    const places = await Place.findAll({
      where: whereConditions,
      include: [
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'name', 'code', 'charCode']
        }
      ],
      order: [['createdAt', 'DESC']] // Show newest places first
    });
    
    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Delete a place and all its associated bookings
 */
const deletePlace = async (req, res) => {
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
};

/**
 * Get all places (for agents only)
 */
const getAllPlaces = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access all places" });
    }
    
    // Get all places with their owners
    const places = await Place.findAll({
      include:[
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
       },
       {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'name', 'code', 'charCode']
      }
    ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(422).json({ error: error.message });
  }
};

module.exports = {
  createPlace,
  getUserPlaces,
  getPlaceById,
  getBookingForPlace,
  updatePlace,
  getHomePlaces,
  deletePlace,
  getAllPlaces
};
