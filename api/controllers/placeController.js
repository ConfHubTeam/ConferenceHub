const { Place, Booking, User } = require('../models');
const { getUserDataFromToken } = require('../middleware/auth');
const Currency = require('../models/currency');
const { validateRefundOptions, processRefundOptions } = require('../services/refundOptionsService');
const PlaceAvailabilityService = require('../services/placeAvailabilityService');
const PlaceRatingService = require('../services/placeRatingService');

/**
 * Create a new place
 */
const createPlace = async (req, res) => {
  const {
    title, address, photos,
    description, perks, extraInfo, 
    checkIn, checkOut, maxGuests, 
    price, startDate, endDate,
    youtubeLink, matterportLink, lat, lng, currencyId, cooldown,
    fullDayHours, fullDayDiscountPrice, minimumHours,
    blockedWeekdays, blockedDates, weekdayTimeSlots,
    squareMeters, isHotel, hostId, refundOptions
  } = req.body;

  try {
    // Validate required fields
    if (!title || !address) {
      return res.status(422).json({ error: "Title and address are required fields" });
    }

    // Validate refund options using service
    const refundValidation = validateRefundOptions(refundOptions);
    if (!refundValidation.isValid) {
      return res.status(422).json({ error: refundValidation.error });
    }

    const userData = await getUserDataFromToken(req);
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    let ownerId = userData.id;
    
    // Handle agent creating place for a host
    if (userData.userType === 'agent') {
      if (!hostId) {
        return res.status(422).json({ error: "Agents must specify a host ID when creating places" });
      }
      
      // Verify that the specified host exists and is actually a host
      const hostUser = await User.findByPk(hostId);
      if (!hostUser) {
        return res.status(404).json({ error: "Specified host not found" });
      }
      if (hostUser.userType !== 'host') {
        return res.status(422).json({ error: "Specified user is not a host" });
      }
      
      ownerId = hostId; // Set the host as the owner
    } else if (userData.userType === 'host') {
      // Host creating their own place - use their ID
      ownerId = userData.id;
    } else {
      return res.status(403).json({ error: "Only hosts and agents can create conference rooms" });
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
    
    // Process availability data
    const processedBlockedWeekdays = Array.isArray(blockedWeekdays) ? blockedWeekdays : [];
    const processedBlockedDates = Array.isArray(blockedDates) ? blockedDates.filter(date => date !== "") : [];
    const processedWeekdayTimeSlots = weekdayTimeSlots || {
      0: { start: "", end: "" }, // Sunday
      1: { start: "", end: "" }, // Monday
      2: { start: "", end: "" }, // Tuesday
      3: { start: "", end: "" }, // Wednesday
      4: { start: "", end: "" }, // Thursday
      5: { start: "", end: "" }, // Friday
      6: { start: "", end: "" }  // Saturday
    };

    // Process refund options using service
    const processedRefundOptions = processRefundOptions(refundOptions);
    
    const processedData = {
      ownerId: ownerId, // Use the determined ownerId (host ID for agents, user ID for hosts)
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
      matterportLink: matterportLink || null, // Add the Matterport link field
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      currencyId: validatedCurrencyId,
      cooldown: cooldown ? parseInt(cooldown, 10) : 60,
      fullDayHours: fullDayHours ? parseInt(fullDayHours, 10) : 8,
      fullDayDiscountPrice: fullDayDiscountPrice ? parseFloat(fullDayDiscountPrice) : 0,
      minimumHours: minimumHours ? parseInt(minimumHours, 10) : 1,
      blockedWeekdays: processedBlockedWeekdays,
      blockedDates: processedBlockedDates,
      weekdayTimeSlots: processedWeekdayTimeSlots,
      squareMeters: squareMeters ? parseFloat(squareMeters) : null,
      isHotel: Boolean(isHotel),
      refundOptions: processedRefundOptions,
      blockedWeekdays: processedBlockedWeekdays,
      blockedDates: processedBlockedDates,
      weekdayTimeSlots: processedWeekdayTimeSlots
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
    // Include currency and owner relations to get full details plus rating data (US-R010)
    const place = await Place.findByPk(id, {
      include: [
        { model: Currency, as: 'currency' },
        { model: User, as: 'owner' }
      ],
      attributes: {
        include: [
          'averageRating',
          'totalReviews',
          'ratingBreakdown',
          'ratingUpdatedAt'
        ]
      }
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
    price, startDate, endDate, youtubeLink, matterportLink, lat, lng,
    currencyId, cooldown, fullDayHours, fullDayDiscountPrice,
    minimumHours, blockedWeekdays, blockedDates, weekdayTimeSlots,
    squareMeters, isHotel, refundOptions
  } = req.body;
  
  try {
    // Validate refund options if provided
    if (refundOptions) {
      const refundValidation = validateRefundOptions(refundOptions);
      if (!refundValidation.isValid) {
        return res.status(422).json({ error: refundValidation.error });
      }
    }

    const userData = await getUserDataFromToken(req);
    
    // Check if user is a host or agent
    if (userData.userType !== 'host' && userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only hosts and agents can update conference rooms" });
    }
    
    // Update Mongoose findById to Sequelize findByPk
    const place = await Place.findByPk(id);
    
    if (!place) {
      return res.status(404).json({ error: "Conference room not found" });
    }
    
    // Check if the current user is the owner or an agent (agents can update any place)
    if (userData.userType === 'host' && userData.id !== place.ownerId) {
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

    // Process availability data
    const processedBlockedWeekdays = Array.isArray(blockedWeekdays) ? blockedWeekdays : [];
    const processedBlockedDates = Array.isArray(blockedDates) ? blockedDates.filter(date => date !== "") : [];
    const processedWeekdayTimeSlots = weekdayTimeSlots || {
      0: { start: "", end: "" }, // Sunday
      1: { start: "", end: "" }, // Monday
      2: { start: "", end: "" }, // Tuesday
      3: { start: "", end: "" }, // Wednesday
      4: { start: "", end: "" }, // Thursday
      5: { start: "", end: "" }, // Friday
      6: { start: "", end: "" }  // Saturday
    };

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
    place.matterportLink = matterportLink || null; // Add the Matterport link
    place.lat = lat ? parseFloat(lat) : null;
    place.lng = lng ? parseFloat(lng) : null;
    place.blockedWeekdays = processedBlockedWeekdays;
    place.blockedDates = processedBlockedDates;
    place.weekdayTimeSlots = processedWeekdayTimeSlots;
    place.fullDayHours = fullDayHours ? parseInt(fullDayHours, 10) : 8;
    place.fullDayDiscountPrice = fullDayDiscountPrice ? parseFloat(fullDayDiscountPrice) : 0;
    place.minimumHours = minimumHours ? parseInt(minimumHours, 10) : 1;
    place.squareMeters = squareMeters ? parseFloat(squareMeters) : null;
    place.isHotel = Boolean(isHotel);
    
    // Update refund options if provided
    if (refundOptions) {
      const processedRefundOptions = processRefundOptions(refundOptions);
      place.refundOptions = processedRefundOptions;
    }
    
    // Update refund options if provided
    if (refundOptions) {
      const refundValidation = validateRefundOptions(refundOptions);
      if (!refundValidation.isValid) {
        return res.status(422).json({ error: refundValidation.error });
      }
      place.refundOptions = processRefundOptions(refundOptions);
    }
    
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
    
    place.cooldown = cooldown ? parseInt(cooldown, 10) : 60;
    
    await place.save();
    res.json("ok");
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get all places with optional date and time availability filtering and pagination
 * Supports filtering by multiple dates and time ranges
 */
const getHomePlaces = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    // Get query parameters for pagination
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Parse availability filters from query parameters
    const availabilityFilters = PlaceAvailabilityService.parseAvailabilityFilters(req.query);
    
    // Get all places with currency information first
    let { count, rows: allPlaces } = await Place.findAndCountAll({
      include: [
        {
          model: Currency,
          as: 'currency',
          attributes: ['id', 'name', 'code', 'charCode']
        }
      ],
      attributes: {
        include: [
          'averageRating',
          'totalReviews',
          'ratingBreakdown'
        ]
      },
      order: [['createdAt', 'DESC']] // Show newest places first
    });
    
    // Apply availability filtering if date/time filters are present
    if (availabilityFilters.hasDateFilter || availabilityFilters.hasTimeFilter) {
      // Pass full place objects instead of just IDs for comprehensive filtering
      const availablePlaceIds = await PlaceAvailabilityService.filterAvailablePlaces(
        allPlaces, // Pass full place objects
        availabilityFilters
      );
      
      // Filter the places to only include available ones
      allPlaces = allPlaces.filter(place => 
        availablePlaceIds.includes(place.id)
      );
      
      // Update count to reflect filtered results
      count = allPlaces.length;
    }
    
    // Apply pagination to filtered results
    const paginatedPlaces = allPlaces.slice(offset, offset + parseInt(limit));
    
    // Calculate pagination info based on filtered results
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    // For backwards compatibility, return just the places array if no pagination params are provided
    // Otherwise return paginated response format
    if (!req.query.page && !req.query.limit) {
      res.json(paginatedPlaces);
    } else {
      res.json({
        places: paginatedPlaces,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      });
    }
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
    
    // Check if user is a host or agent
    if (userData.userType !== 'host' && userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only hosts and agents can delete conference rooms" });
    }
    
    // Find the place
    const place = await Place.findByPk(id);
    
    if (!place) {
      return res.status(404).json({ error: "Conference room not found" });
    }
    
    // Verify this host is the owner or user is an agent (agents can delete any place)
    if (userData.userType === 'host' && place.ownerId !== userData.id) {
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
 * Get all places with optional availability filtering (for agents only)
 * Supports filtering by multiple dates and time ranges
 */
const getAllPlaces = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access all places" });
    }
    
    // Get query parameters for filtering and pagination
    const { userId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // Parse availability filters from query parameters
    const availabilityFilters = PlaceAvailabilityService.parseAvailabilityFilters(req.query);
    
    // Build query options
    const queryOptions = {
      include: [
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
      attributes: {
        include: [
          'averageRating',
          'totalReviews',
          'ratingBreakdown'
        ]
      },
      order: [['createdAt', 'DESC']]
    };
    
    // Add userId filter if provided
    if (userId) {
      queryOptions.where = {
        ownerId: userId
      };
    }
    
    // Get places with count for pagination
    let { count, rows: places } = await Place.findAndCountAll(queryOptions);
    
    // Apply availability filtering if date/time filters are present
    if (availabilityFilters.hasDateFilter || availabilityFilters.hasTimeFilter) {
      const availablePlaceIds = await PlaceAvailabilityService.filterAvailablePlaces(
        places, // Pass full place objects
        availabilityFilters
      );
      
      // Filter places to only include available ones
      places = places.filter(place => availablePlaceIds.includes(place.id));
      
      // Update count to reflect filtered results
      count = places.length;
    }
    
    // Apply pagination to filtered results
    const paginatedPlaces = places.slice(offset, offset + parseInt(limit));
    
    // Calculate pagination info based on filtered results
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      places: paginatedPlaces,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
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
