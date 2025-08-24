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
    
    // Extract booked time slots with booking information
    const bookedTimeSlots = [];
    
    approvedBookings.forEach(booking => {
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          // If no date specified or date matches
          if (!date || slot.date === date) {
            bookedTimeSlots.push({
              ...slot,
              bookingId: booking.id,
              uniqueRequestId: booking.uniqueRequestId,
              guestName: booking.guestName,
              status: booking.status,
              totalPrice: booking.totalPrice
            });
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
    
    // Extract booked time slots with booking information
    const bookedTimeSlots = [];
    approvedBookings.forEach(booking => {
      if (booking.timeSlots && booking.timeSlots.length > 0) {
        booking.timeSlots.forEach(slot => {
          // If no date specified or date matches
          if (!date || slot.date === date) {
            bookedTimeSlots.push({
              ...slot,
              bookingId: booking.id,
              uniqueRequestId: booking.uniqueRequestId,
              guestName: booking.guestName,
              status: booking.status,
              totalPrice: booking.totalPrice
            });
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

/**
 * Check payment status for a booking (single check for polling)
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await getUserDataFromToken(req);
    
    // Check if user has access to this booking
    const booking = await BookingService.getBookingById(id, userData);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Use optimized payment poller for better API efficiency
    const OptimizedPaymentPoller = require("../services/optimizedPaymentPoller");
    const poller = new OptimizedPaymentPoller();
    
    // Single check (immediate=true, maxAttempts=1)
    const result = await poller.smartCheckPaymentStatus(id, {
      maxAttempts: 1,
      immediate: true
    });
    
    if (result.success && result.isPaid) {
      // Get updated booking data
      const updatedBooking = await BookingService.getBookingById(id, userData);
      res.json({ 
        success: true, 
        isPaid: true, 
        booking: updatedBooking,
        paymentId: result.paymentId,
        alreadyProcessed: result.alreadyProcessed || false
      });
    } else {
      res.json({ 
        success: true, 
        isPaid: false, 
        status: booking.status,
        message: result.message || 'Payment not completed yet'
      });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Smart payment status check with unified support for Click.uz and Payme
 * Returns actual payment provider status for optimized frontend polling
 */
const checkPaymentStatusSmart = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await getUserDataFromToken(req);
    
    // Check if user has access to this booking
    const booking = await BookingService.getBookingById(id, userData);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check for manual approval by agent (booking approved and paid without payment system)
    if (booking.status === 'approved' && booking.paidAt) {
      return res.json({
        success: true,
        isPaid: true,
        paymentStatus: 2, // Successful status
        errorCode: 0,
        paymentId: booking.clickPaymentId || 'payme-payment',
        booking: booking,
        manuallyApproved: !booking.clickPaymentId && !booking.paymentResponse?.provider,
        provider: booking.paymentResponse?.provider || 'manual',
        message: "Payment already confirmed"
      });
    }

    // First check for Payme payment (since it updates via webhook immediately)
    const TransactionService = require("../services/transactionService");
    const paymeTransaction = await TransactionService.getPaymeTransactionByBooking(id);
    
    if (paymeTransaction) {
      console.log(`🔍 Found Payme transaction for booking ${id}, state: ${paymeTransaction.state}`);
      
      switch (paymeTransaction.state) {
        case 2: // Paid
          // Update booking if not already updated
          if (booking.status !== 'approved' || !booking.paidAt) {
            await booking.update({
              status: 'approved',
              paidAt: paymeTransaction.performDate || new Date(),
              approvedAt: paymeTransaction.performDate || new Date()
            });
          }
          
          const updatedBooking = await BookingService.getBookingById(id, userData);
          return res.json({
            success: true,
            isPaid: true,
            paymentStatus: 2, // Successful status
            errorCode: 0,
            paymentId: paymeTransaction.providerTransactionId,
            booking: updatedBooking,
            provider: 'payme',
            message: "Payment confirmed via Payme"
          });
          
        case 1: // Pending
          return res.json({
            success: true,
            isPaid: false,
            paymentStatus: 1, // Processing status
            errorCode: 0,
            paymentId: paymeTransaction.providerTransactionId,
            booking: booking,
            provider: 'payme',
            message: "Payme payment is pending"
          });
          
        case -1: // Cancelled from pending
        case -2: // Cancelled after payment
          return res.json({
            success: true,
            isPaid: false,
            paymentStatus: -1, // Cancelled status
            errorCode: -1,
            paymentId: paymeTransaction.providerTransactionId,
            booking: booking,
            provider: 'payme',
            message: "Payme payment was cancelled"
          });
          
        default:
          console.warn(`Unknown Payme transaction state: ${paymeTransaction.state}`);
          // Continue to check Click.uz payment as fallback
      }
    }

    // Fallback to Click.uz payment check if no Payme transaction or unknown state
    
    // If no Click invoice created yet, can't check
    if (!booking.clickInvoiceId) {
      return res.json({
        success: false,
        isPaid: false,
        paymentStatus: null,
        errorCode: -1,
        errorNote: "No payment invoice found",
        booking: booking,
        provider: null,
        message: "No payment method initiated"
      });
    }

    // Use enhanced Click service to get raw API response
    const EnhancedClickService = require("../services/enhancedClickService");
    const clickService = new EnhancedClickService();
    
    try {
      // Get payment status from Click.uz directly
      const statusResult = await clickService.getDetailedPaymentStatus(id);
      
      if (statusResult.success && statusResult.isPaid) {
        // Payment found and completed
        const updatedBooking = await BookingService.getBookingById(id, userData);
        
        return res.json({
          success: true,
          isPaid: true,
          paymentStatus: 2, // Click.uz successful
          errorCode: 0,
          paymentId: statusResult.paymentId,
          booking: updatedBooking,
          provider: 'click',
          message: "Payment confirmed via Click.uz"
        });
      } else {
        // Payment not found or not completed
        return res.json({
          success: true,
          isPaid: false,
          paymentStatus: statusResult.paymentStatus || 0, // Click.uz status
          errorCode: statusResult.errorCode || (statusResult.paymentStatus === null ? -16 : 0),
          errorNote: statusResult.errorNote || "Payment not completed",
          booking: booking,
          provider: 'click',
          message: statusResult.message || "Payment not found or incomplete"
        });
      }
    } catch (clickError) {
      console.error("❌ Click.uz API error:", clickError);
      
      return res.json({
        success: false,
        isPaid: false,
        paymentStatus: null,
        errorCode: -1,
        errorNote: clickError.message || "Click.uz API error",
        booking: booking,
        provider: 'click',
        message: "Unable to check payment status"
      });
    }
    
  } catch (error) {
    console.error("💥 Smart payment status check exception:", error);
    res.status(500).json({ 
      error: "Failed to check payment status",
      details: error.message,
      errorCode: -1,
      success: false,
      isPaid: false
    });
  }
};

/**
 * Manual cleanup of expired bookings (Agent only)
 * Deletes all expired "pending" and "selected" bookings
 */
const manualCleanupExpiredBookings = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);

    // Only agents can perform manual cleanup
    if (userData.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only agents can perform booking cleanup.'
      });
    }

    console.log(`🧹 Agent ${userData.name} (${userData.email}) initiated manual cleanup of expired bookings`);

    // Perform the cleanup
    const deletedCount = await cleanupExpiredBookings();

    console.log(`✅ Manual cleanup completed: ${deletedCount} expired bookings deleted`);

    res.json({
      success: true,
      deletedCount,
      message: deletedCount > 0 
        ? `Successfully deleted ${deletedCount} expired booking${deletedCount === 1 ? '' : 's'}`
        : 'No expired bookings found to delete',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during manual booking cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired bookings',
      error: error.message
    });
  }
};

/**
 * Select cash payment for a booking (Client only)
 * Notifies agents that client wants to pay with cash
 */
const selectCashPayment = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const bookingId = req.params.id;

    // Only clients can select cash payment
    if (userData.userType !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients can select cash payment.'
      });
    }

    // Get the booking with place information
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Place,
          as: "place",
          attributes: ["id", "title", "ownerId"]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify that this booking belongs to the current user
    if (booking.userId !== userData.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only select payment for your own bookings.'
      });
    }

    // Check if booking is in the correct status (should be "selected" or "approved")
    if (!['selected', 'approved'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cash payment can only be selected for approved or selected bookings.'
      });
    }

    // Check if cash payment notification has already been sent
    if (booking.cashNotificationSent) {
      // Get agent information for response
      const AgentService = require('../services/agentService');
      const agents = await AgentService.getAllAgents();
      const primaryAgent = agents && agents.length > 0 ? agents[0] : null;
      
      return res.json({
        success: true,
        message: 'Cash payment was already selected. Agents were previously notified.',
        booking: {
          id: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          status: booking.status,
          paymentMethod: 'cash',
          cashPaymentSelected: true,
          cashPaymentSelectedAt: booking.cashPaymentSelectedAt,
          cashNotificationSent: booking.cashNotificationSent,
          cashNotificationSentAt: booking.cashNotificationSentAt
        },
        agentContact: primaryAgent ? {
          name: primaryAgent.name,
          phone: primaryAgent.phone
        } : null,
        alreadyNotified: true
      });
    }

    // Import the notification service
    const BookingNotificationService = require('../services/bookingNotificationService');

    // Get agent information for response
    const AgentService = require('../services/agentService');
    const agents = await AgentService.getAllAgents();
    
    // For simplicity, use the first available agent's contact info
    const primaryAgent = agents && agents.length > 0 ? agents[0] : null;
    
    // Send notification to agents
    const notifications = await BookingNotificationService.createCashPaymentSelectedNotification(booking);

    // Update booking to mark cash payment selected and notification sent
    const now = new Date();
    await booking.update({
      cashPaymentSelected: true,
      cashPaymentSelectedAt: now,
      cashNotificationSent: true,
      cashNotificationSentAt: now
    });

    res.json({
      success: true,
      message: 'Cash payment selected successfully. Agents have been notified.',
      booking: {
        id: booking.id,
        uniqueRequestId: booking.uniqueRequestId,
        status: booking.status,
        paymentMethod: 'cash',
        cashPaymentSelected: true,
        cashPaymentSelectedAt: now,
        cashNotificationSent: true,
        cashNotificationSentAt: now
      },
      agentContact: primaryAgent ? {
        name: primaryAgent.name,
        phone: primaryAgent.phoneNumber,
        email: primaryAgent.email
      } : null,
      agentsNotified: notifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error selecting cash payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select cash payment',
      error: error.message
    });
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
  markPaidToHost,
  checkPaymentStatus,
  checkPaymentStatusSmart,
  selectCashPayment,
  manualCleanupExpiredBookings
};
