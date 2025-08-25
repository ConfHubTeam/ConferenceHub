const { Place, Booking, User } = require('../models');
const { getUserDataFromToken } = require('../middleware/auth');
const Currency = require('../models/currency');
const { validateRefundOptions, processRefundOptions } = require('../services/refundOptionsService');
const PlaceAvailabilityService = require('../services/placeAvailabilityService');
const PlaceRatingService = require('../services/placeRatingService');
const OptimizedPlaceService = require('../services/optimizedPlaceService');

// Create optimized place service instance for US-LOCK-002
const optimizedPlaceService = new OptimizedPlaceService();

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

    // Get userData from middleware (set by isAuthenticated middleware)
    const userData = req.userData || req.user;
    
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
    
    // Process perks to support both legacy string format and new object format
    let processedPerks = [];
    if (Array.isArray(perks)) {
      processedPerks = perks.map(perk => {
        // If it's already an object with name and isPaid, keep it as is
        if (typeof perk === 'object' && perk !== null && perk.name) {
          return {
            name: perk.name,
            isPaid: Boolean(perk.isPaid) // Ensure isPaid is boolean
          };
        }
        // If it's a string (legacy format), convert to object with isPaid: false
        if (typeof perk === 'string') {
          return {
            name: perk,
            isPaid: false // Default to free for legacy data
          };
        }
        return null;
      }).filter(Boolean); // Remove any null entries
    }
    
    // Ensure processedPerks is valid JSON for JSONB field
    if (!Array.isArray(processedPerks)) {
      processedPerks = [];
    }
    
    const processedData = {
      ownerId: ownerId, // Use the determined ownerId (host ID for agents, user ID for hosts)
      title, 
      address, 
      photos: processedPhotos,
      description: description || "",
      perks: processedPerks,
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
    // Get userData from middleware (set by isAuthenticated middleware)
    const userData = req.userData || req.user;
    
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
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
 * Optimized for US-LOCK-002: Uses optimized service to reduce lock usage
 */
const getPlaceById = async (req, res) => {
  const {id} = req.params;
  try {
    // Use optimized place service for lock-efficient retrieval
    const place = await optimizedPlaceService.getPlaceDetails(parseInt(id, 10));
    
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }
    
    // Include lock monitoring info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 US-LOCK-002 Optimization: Place ${id} loaded with ${place._optimizationMeta.locksUsed} locks in ${place._optimizationMeta.retrievalTime}ms`);
    }
    
    res.json(place);
  } catch (error) {
    console.error("Error in optimized getPlaceById:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get a specific booking for a place
 */
const getBookingForPlace = async (req, res) => {
  const {bookingId} = req.params;
  try {
    // Update findById to Sequelize findByPk
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

    // Get userData from middleware (set by isAuthenticated middleware)
    const userData = req.userData || req.user;
    
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
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

    // Process perks to support both legacy string format and new object format
    let processedPerks = [];
    if (Array.isArray(perks)) {
      processedPerks = perks.map(perk => {
        // If it's already an object with name and isPaid, keep it as is
        if (typeof perk === 'object' && perk !== null && perk.name) {
          return {
            name: perk.name,
            isPaid: Boolean(perk.isPaid) // Ensure isPaid is boolean
          };
        }
        // If it's a string (legacy format), convert to object with isPaid: false
        if (typeof perk === 'string') {
          return {
            name: perk,
            isPaid: false // Default to free for legacy data
          };
        }
        return null;
      }).filter(Boolean); // Remove any null entries
    }
    
    // Ensure processedPerks is valid JSON for JSONB field
    if (!Array.isArray(processedPerks)) {
      processedPerks = [];
    }

    // Update place properties
    place.title = title;
    place.address = address;
    place.photos = processedPhotos;
    place.description = description;
    place.perks = processedPerks;
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
 * Optimized for US-LOCK-002: Uses batch processing for better performance
 */
const getHomePlaces = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    // Get query parameters for pagination
    const { page = 1, limit = 20, optimized } = req.query;
    const offset = (page - 1) * limit;
    
    // Parse availability filters from query parameters
    const availabilityFilters = PlaceAvailabilityService.parseAvailabilityFilters(req.query);
    
    // Use optimized batch processing if requested (US-LOCK-002)
    if (optimized === 'true') {
      return await getOptimizedHomePlaces(req, res, availabilityFilters, page, limit, offset);
    }
    
    // Legacy implementation (preserved for backward compatibility)
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
 * Optimized version of getHomePlaces using batch processing (US-LOCK-002)
 * 
 * @private
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Object} availabilityFilters - Availability filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {number} offset - Offset for pagination
 */
async function getOptimizedHomePlaces(req, res, availabilityFilters, page, limit, offset) {
  const startTime = Date.now();
  
  try {
    // Step 1: Get place IDs with minimal data (1 lock)
    const placeQuery = await Place.findAndCountAll({
      attributes: ['id', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true
    });
    
    let { count, rows: placeRows } = placeQuery;
    let allPlaceIds = placeRows.map(p => p.id);
    
    // Step 2: Apply availability filtering if needed
    if (availabilityFilters.hasDateFilter || availabilityFilters.hasTimeFilter) {
      // Use optimized batch availability checking
      const availablePlaceIds = await batchCheckAvailability(allPlaceIds, availabilityFilters);
      allPlaceIds = availablePlaceIds;
      count = availablePlaceIds.length;
    }
    
    // Step 3: Apply pagination to filtered IDs
    const paginatedIds = allPlaceIds.slice(offset, offset + parseInt(limit));
    
    // Step 4: Batch fetch full place details for paginated results
    const paginatedPlaces = await optimizedPlaceService.batchGetPlaceDetails(paginatedIds);
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    const processingTime = Date.now() - startTime;
    
    // Log optimization metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 US-LOCK-002 Optimized Home Places: ${paginatedPlaces.length} places loaded in ${processingTime}ms`);
    }
    
    // Return optimized response
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
        },
        _optimization: {
          userStory: 'US-LOCK-002',
          processingTime,
          optimizedBatch: true,
          availabilityFiltered: availabilityFilters.hasDateFilter || availabilityFilters.hasTimeFilter
        }
      });
    }
  } catch (error) {
    console.error("Error in optimized home places:", error);
    res.status(422).json({ error: error.message });
  }
}

/**
 * Batch availability checking using optimized queries (US-LOCK-002)
 * 
 * @private
 * @param {Array<number>} placeIds - Place IDs to check
 * @param {Object} availabilityFilters - Availability filters
 * @returns {Promise<Array<number>>} Available place IDs
 */
async function batchCheckAvailability(placeIds, availabilityFilters) {
  const { selectedDates, startTime, endTime } = availabilityFilters;
  
  if (!selectedDates || selectedDates.length === 0) {
    return placeIds;
  }
  
  try {
    // Use single optimized query for all places
    const [results] = await Place.sequelize.query(`
      WITH requested_dates AS (
        SELECT unnest(:selectedDates::date[]) as req_date
      ),
      place_conflicts AS (
        SELECT DISTINCT b."placeId"
        FROM "Bookings" b
        CROSS JOIN requested_dates rd
        WHERE b."placeId" = ANY(:placeIds)
          AND b.status = 'approved'
          AND (
            -- Time slot conflicts
            (b."timeSlots" IS NOT NULL 
             AND jsonb_array_length(b."timeSlots") > 0
             AND EXISTS (
               SELECT 1 FROM jsonb_array_elements(b."timeSlots") as slot
               WHERE (slot->>'date')::date = rd.req_date
                 AND (slot->>'startTime')::time < :endTime::time
                 AND (slot->>'endTime')::time > :startTime::time
             ))
            OR
            -- Full day booking conflicts
            (b."checkInDate"::date <= rd.req_date 
             AND b."checkOutDate"::date >= rd.req_date
             AND (b."timeSlots" IS NULL OR jsonb_array_length(b."timeSlots") = 0))
          )
      )
      SELECT unnest(:placeIds::integer[]) as place_id
      EXCEPT
      SELECT "placeId" FROM place_conflicts
    `, {
      replacements: {
        placeIds,
        selectedDates,
        startTime: startTime || '00:00',
        endTime: endTime || '23:59'
      },
      type: Place.sequelize.QueryTypes.SELECT
    });
    
    return results.map(r => r.place_id);
    
  } catch (error) {
    console.error('Error in batch availability check:', error);
    // Return empty array on error for safety
    return [];
  }
}

/**
 * Get optimized availability for a place (US-LOCK-002)
 * Endpoint: GET /api/places/:id/availability-check
 */
const checkPlaceAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    // Parse availability filters from query parameters
    const availabilityFilters = PlaceAvailabilityService.parseAvailabilityFilters(req.query);
    
    // Use optimized availability checking
    const availabilityStatus = await optimizedPlaceService.checkOptimizedAvailability(
      parseInt(id, 10), 
      availabilityFilters
    );
    
    res.json({
      placeId: parseInt(id, 10),
      availabilityStatus,
      filters: availabilityFilters,
      _optimization: {
        userStory: 'US-LOCK-002',
        description: 'Optimized availability check with minimal lock usage'
      }
    });
  } catch (error) {
    console.error("Error in optimized availability check:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get lock monitoring report (US-LOCK-002)
 * Endpoint: GET /api/places/optimization/lock-report
 */
const getLockMonitoringReport = async (req, res) => {
  try {
    const report = optimizedPlaceService.getLockMonitoringReport();
    res.json({
      userStory: 'US-LOCK-002',
      lockMonitoring: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting lock monitoring report:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Clear optimization cache (US-LOCK-002)
 * Endpoint: POST /api/places/optimization/clear-cache
 */
const clearOptimizationCache = async (req, res) => {
  try {
    optimizedPlaceService.clearCache();
    res.json({
      userStory: 'US-LOCK-002',
      message: 'Optimization cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error clearing optimization cache:", error);
    res.status(422).json({ error: error.message });
  }
};
const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;
    // Get userData from middleware (set by isAuthenticated middleware)
    const userData = req.userData || req.user;

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
    // Get userData from middleware (set by isAuthenticated middleware)
    const userData = req.userData || req.user;
    
    // Verify user is an agent
    if (!userData || userData.userType !== 'agent') {
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
  getAllPlaces,
  // US-LOCK-002 Optimized endpoints
  checkPlaceAvailability,
  getLockMonitoringReport,
  clearOptimizationCache
};
