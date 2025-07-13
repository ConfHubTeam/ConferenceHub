const { Booking, Place, User, Currency } = require("../models");
const { getUserDataFromToken } = require("../middleware/auth");
const BookingService = require("../services/bookingService");
const BookingValidationService = require("../services/bookingValidationService");
const { cleanupExpiredBookings } = require("../utils/bookingUtils");
const { 
  getCurrentDateInUzbekistan,
  getUzbekistanAwareAvailableSlots,
  getAvailableDatesFromUzbekistan,
  isDateInPastUzbekistan
} = require("../utils/uzbekistanTimezoneUtils");

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const bookingData = req.body;

    // Validate booking data
    BookingValidationService.validateBookingCreation(bookingData);

    // Create booking using service
    const booking = await BookingService.createBooking(userData, bookingData);
    
    res.json(booking);
  } catch (error) {
    const statusCode = error.statusCode || 422;
    const response = { error: error.message };
    
    // Include additional error data if present
    if (error.conflictingSlot) {
      response.conflictingSlot = error.conflictingSlot;
    }
    
    res.status(statusCode).json(response);
  }
};

/**
 * Get bookings based on user role and filters
 */
const getBookings = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { userId, paidFilter } = req.query;
    
    // For agents with userId parameter - get bookings for a specific user
    if (userData.userType === 'agent' && userId) {
      const userBookings = await BookingService.getUserBookings(userId);
      return res.json(userBookings);
    }
    
    // Get bookings based on user type with optional paid filter
    const bookings = await BookingService.getBookings(userData, { paidFilter });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    const statusCode = error.statusCode || 422;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Update booking status (approve/reject)
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const statusData = req.body;
    const userData = await getUserDataFromToken(req);
    
    // Validate status
    BookingValidationService.validateBookingStatus(statusData.status);
    
    // Update booking status using service
    const result = await BookingService.updateBookingStatus(id, userData, statusData);
    
    res.json(result);
  } catch (error) {
    console.error("Error updating booking:", error);
    const statusCode = error.statusCode || 422;
    const response = { error: error.message };
    
    // Include additional error data if present
    if (error.requiresPaymentCheck) {
      response.requiresPaymentCheck = error.requiresPaymentCheck;
      response.message = error.message;
    }
    
    res.status(statusCode).json(response);
  }
};

/**
 * Get pending booking counts for hosts
 */
const getBookingCounts = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Validate user permissions
    BookingValidationService.validateUserPermissions(userData.userType, 'getCounts');
    
    // Get booking counts using service
    const counts = await BookingService.getBookingCounts(userData);
    
    res.json(counts);
  } catch (error) {
    console.error("Error fetching booking counts:", error);
    const statusCode = error.statusCode || 422;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Check availability of time slots for a place
 * This endpoint allows unauthenticated users to check availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { placeId, date } = req.query;
    
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    // Get the place
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }
    
    // Get bookings with approved status for this place
    const query = { 
      placeId, 
      status: 'approved' 
    };
    
    // Get all approved bookings
    const approvedBookings = await Booking.findAll({ where: query });
    
    // Extract booked time slots
    const bookedTimeSlots = [];
    
    approvedBookings.forEach(booking => {
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          // If no date specified or date matches
          if (!date || slot.date === date) {
            bookedTimeSlots.push(slot);
          }
        });
      }
    });
    
    // Build response
    const response = {
      placeId,
      placeName: place.title,
      bookedTimeSlots,
      operatingHours: {
        checkIn: place.checkIn || "09:00",
        checkOut: place.checkOut || "17:00",
        weekdayTimeSlots: place.weekdayTimeSlots || {},
        minimumHours: place.minimumHours || 1,
        cooldown: place.cooldown || 30
      },
      blockedDates: place.blockedDates || [],
      blockedWeekdays: place.blockedWeekdays || []
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get timezone-aware availability for Uzbekistan timezone
 */
const checkTimezoneAwareAvailability = async (req, res) => {
  try {
    const { placeId, date } = req.query;
    
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    // Get the place
    const place = await Place.findByPk(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    const currentDateUzbekistan = getCurrentDateInUzbekistan();
    
    // Get bookings with approved status for this place
    const approvedBookings = await Booking.findAll({ 
      where: { 
        placeId, 
        status: 'approved' 
      } 
    });
    
    // Extract booked time slots
    const bookedTimeSlots = [];
    approvedBookings.forEach(booking => {
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          // If no date specified or date matches
          if (!date || slot.date === date) {
            bookedTimeSlots.push(slot);
          }
        });
      }
    });

    // Get available dates excluding past dates in Uzbekistan timezone
    const startDate = place.startDate || currentDateUzbekistan;
    
    // Use Uzbekistan timezone for consistent date calculation (1 year from current Uzbekistan date)
    const uzbekistanDate = new Date(currentDateUzbekistan);
    uzbekistanDate.setFullYear(uzbekistanDate.getFullYear() + 1);
    const endDate = place.endDate || uzbekistanDate.toISOString().split('T')[0]; // 1 year from current Uzbekistan date
    
    const availableDates = getAvailableDatesFromUzbekistan(
      startDate,
      endDate,
      place.blockedDates || [],
      place.blockedWeekdays || []
    );

    // If specific date requested, get timezone-aware available time slots
    let availableTimeSlots = [];
    if (date) {
      // Check if date is not in the past
      const dateIsInPast = isDateInPastUzbekistan(date);
      
      if (!dateIsInPast) {
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();
        
        // Get working hours for this day
        const workingHours = place.weekdayTimeSlots && place.weekdayTimeSlots[dayOfWeek] 
          ? place.weekdayTimeSlots[dayOfWeek]
          : { start: place.checkIn || "09:00", end: place.checkOut || "17:00" };

        // Get timezone-aware available slots
        if (workingHours.start && workingHours.end) {
          availableTimeSlots = getUzbekistanAwareAvailableSlots(
            date,
            workingHours,
            place.minimumHours || 1,
            place.cooldown || 30
          );

          // Filter out booked time slots
          availableTimeSlots = availableTimeSlots.filter(timeSlot => {
            return !bookedTimeSlots.some(bookedSlot => 
              bookedSlot.date === date && bookedSlot.startTime === timeSlot
            );
          });
        }
      }
    }
    
    // Build response
    const response = {
      placeId,
      placeName: place.title,
      currentDateUzbekistan,
      availableDates,
      availableTimeSlots: date ? availableTimeSlots : [],
      bookedTimeSlots,
      operatingHours: {
        checkIn: place.checkIn || "09:00",
        checkOut: place.checkOut || "17:00",
        weekdayTimeSlots: place.weekdayTimeSlots || {},
        minimumHours: place.minimumHours || 1,
        cooldown: place.cooldown || 30
      },
      blockedDates: place.blockedDates || [],
      blockedWeekdays: place.blockedWeekdays || [],
      timezone: 'Asia/Tashkent'
    };
    
    res.json(response);
  } catch (error) {
    console.error("Error checking timezone-aware availability:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get competing bookings for the same time slots
 * Used by hosts to see competing requests
 */
const getCompetingBookings = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { placeId, timeSlots, excludeBookingId } = req.query;

    if (!placeId || !timeSlots) {
      return res.status(400).json({ error: "placeId and timeSlots are required" });
    }

    // Validate user permissions
    BookingValidationService.validateUserPermissions(userData.userType, 'viewCompeting');
    
    // Get competing bookings using service
    const competingBookings = await BookingService.getCompetingBookings(
      userData, 
      placeId, 
      timeSlots, 
      excludeBookingId
    );

    res.json(competingBookings);
  } catch (error) {
    console.error("Error getting competing bookings:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get a single booking by ID with all related information
 */
const getBookingById = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { id } = req.params;
    
    // Get booking by ID using service
    const booking = await BookingService.getBookingById(id, userData);
    
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Mark booking as paid to host (Agent-only action)
 */
const markPaidToHost = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await getUserDataFromToken(req);
    
    // Mark booking as paid to host using service
    const result = await BookingService.markPaidToHost(id, userData);
    
    res.json(result);
  } catch (error) {
    console.error("Error marking booking as paid to host:", error);
    const statusCode = error.statusCode || 422;
    res.status(statusCode).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  getBookingCounts,
  checkAvailability,
  checkTimezoneAwareAvailability,
  getCompetingBookings,
  getBookingById,
  markPaidToHost
};
