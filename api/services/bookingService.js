const { Booking, Place, User, Currency } = require("../models");
const { Op } = require("sequelize");
const { validateBookingTimeSlots, findConflictingBookings, cleanupExpiredBookings, findCompetingBookings } = require("../utils/bookingUtils");

/**
 * Booking Service - Handles core booking business logic
 */
class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(userData, bookingData) {
    const {
      place, 
      checkInDate, 
      checkOutDate, 
      selectedTimeSlots,
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice,
      serviceFee,
      protectionPlanSelected = false,
      protectionPlanFee = 0,
      finalTotal
    } = bookingData;

    // Only clients can create bookings
    if (userData.userType !== 'client') {
      throw new Error("Only clients can create bookings. Hosts and agents cannot make bookings.");
    }

    // Get place details
    const placeDetails = await Place.findByPk(place);
    if (!placeDetails) {
      throw new Error("Place not found");
    }
    
    // Validate time slots for conflicts
    if (selectedTimeSlots && selectedTimeSlots.length > 0) {
      const validation = await validateBookingTimeSlots(
        selectedTimeSlots, 
        place, 
        placeDetails.cooldown || 0
      );
      
      if (!validation.isValid) {
        const error = new Error(`Booking conflict detected: ${validation.message}`);
        error.conflictingSlot = validation.conflictingSlot;
        error.statusCode = 422;
        throw error;
      }
    }
    
    // Determine final dates
    const { finalCheckInDate, finalCheckOutDate } = this._determineFinalDates(
      checkInDate, 
      checkOutDate, 
      selectedTimeSlots
    );

    // Generate unique request ID
    const uniqueRequestId = this._generateUniqueRequestId();

    // Capture refund policy snapshot from place details
    // If place has no refund options set, store null to indicate no policy was captured
    const refundPolicySnapshot = placeDetails.refundOptions && placeDetails.refundOptions.length > 0 
      ? placeDetails.refundOptions 
      : null;

    // Create booking
    const booking = await Booking.create({
      userId: userData.id,
      placeId: place, 
      checkInDate: finalCheckInDate,
      checkOutDate: finalCheckOutDate, 
      numOfGuests, 
      guestName, 
      guestPhone, 
      totalPrice,
      serviceFee: serviceFee || 0,
      protectionPlanSelected,
      protectionPlanFee,
      finalTotal: finalTotal || totalPrice,
      refundPolicySnapshot,
      status: 'pending',
      timeSlots: selectedTimeSlots || [],
      uniqueRequestId
    });

    return this.getBookingWithAssociations(booking.id);
  }

  /**
   * Get bookings for a specific user (used by agents)
   */
  static async getUserBookings(userId) {
    await cleanupExpiredBookings();
    
    return Booking.findAll({
      where: { userId },
      include: [
        {
          model: Place,
          as: 'place',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email', 'phoneNumber']
            },
            {
              model: Currency,
              as: 'currency',
              attributes: ['id', 'name', 'code', 'charCode']
            }
          ],
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'ownerId', 'currencyId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phoneNumber']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Get bookings based on user type
   */
  static async getBookings(userData) {
    // Clean up expired bookings first
    await cleanupExpiredBookings();

    if (userData.userType === 'agent') {
      return this._getAgentBookings();
    } else if (userData.userType === 'host') {
      return this._getHostBookings(userData.id);
    } else {
      return this._getClientBookings(userData.id);
    }
  }

  /**
   * Update booking status with validation and conflict resolution
   */
  static async updateBookingStatus(bookingId, userData, statusData) {
    // Clean up expired bookings first
    await cleanupExpiredBookings();
    
    const { status, paymentConfirmed = false, agentApproval = false } = statusData;
    
    // Validate status
    if (!['pending', 'selected', 'approved', 'rejected'].includes(status)) {
      throw new Error("Invalid status value");
    }
    
    // Get booking with associations
    const booking = await this.getBookingWithAssociations(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }
    
    // Validate status transition
    this._validateStatusTransition(booking.status, status);
    
    // Check authorization
    this._checkUpdateAuthorization(userData, booking, status);
    
    // Handle payment confirmation for selected bookings
    if (status === 'approved' && booking.status === 'selected') {
      this._handlePaymentConfirmation(paymentConfirmed, agentApproval);
    }
    
    // Handle client cancellation (delete booking)
    if (this._isClientCancellation(userData, booking, status)) {
      await booking.destroy();
      return {
        message: "Booking cancelled successfully", 
        booking: null,
        deleted: true 
      };
    }
    
    // Handle conflicts for approved bookings
    if (status === 'approved') {
      await this._handleBookingConflicts(booking);
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();

    // Reload with associations
    const updatedBooking = await this.getBookingWithAssociations(booking.id);
    
    return {
      success: true, 
      booking: updatedBooking,
      message: this._generateStatusMessage(status, booking.status, agentApproval)
    };
  }

  /**
   * Get booking by ID with full associations
   */
  static async getBookingById(bookingId, userData) {
    const booking = await this.getBookingWithAssociations(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    const canAccess = 
      userData.userType === 'agent' ||
      (userData.userType === 'client' && booking.userId === userData.id) ||
      (userData.userType === 'host' && booking.place?.ownerId === userData.id);

    if (!canAccess) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    return booking;
  }

  /**
   * Get competing bookings for time slots
   */
  static async getCompetingBookings(userData, placeId, timeSlots, excludeBookingId) {
    const place = await Place.findByPk(placeId);
    if (!place) {
      throw new Error("Place not found");
    }

    // Authorization check
    if (userData.userType === 'host' && place.ownerId !== userData.id) {
      const error = new Error("Access denied");
      error.statusCode = 403;
      throw error;
    }

    if (userData.userType === 'client') {
      const error = new Error("Clients cannot view competing bookings");
      error.statusCode = 403;
      throw error;
    }

    let parsedTimeSlots;
    try {
      const decodedTimeSlots = decodeURIComponent(timeSlots);
      parsedTimeSlots = JSON.parse(decodedTimeSlots);
    } catch (parseError) {
      const error = new Error("Invalid timeSlots format");
      error.statusCode = 400;
      throw error;
    }
    
    return findCompetingBookings(parsedTimeSlots, placeId, excludeBookingId);
  }

  /**
   * Get booking counts for hosts/agents
   */
  static async getBookingCounts(userData) {
    await cleanupExpiredBookings();
    
    if (userData.userType !== 'host' && userData.userType !== 'agent') {
      const error = new Error("Only hosts and agents can access booking counts");
      error.statusCode = 403;
      throw error;
    }
    
    let pendingCount;
    
    if (userData.userType === 'agent') {
      pendingCount = await Booking.count({
        where: { status: { [Op.in]: ['pending', 'selected'] } }
      });
    } else {
      pendingCount = await Booking.count({
        include: [
          {
            model: Place,
            as: 'place',
            where: { ownerId: userData.id },
            attributes: []
          }
        ],
        where: {
          status: { [Op.in]: ['pending', 'selected'] }
        }
      });
    }
    
    return { pendingCount };
  }

  // Private helper methods
  static _generateUniqueRequestId() {
    return `REQ-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }

  static _determineFinalDates(checkInDate, checkOutDate, selectedTimeSlots) {
    let finalCheckInDate = checkInDate;
    let finalCheckOutDate = checkOutDate;
    
    if (selectedTimeSlots && selectedTimeSlots.length > 0) {
      const sortedDates = [...selectedTimeSlots].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      finalCheckInDate = sortedDates[0].date;
      finalCheckOutDate = sortedDates[sortedDates.length - 1].date;
    }

    return { finalCheckInDate, finalCheckOutDate };
  }

  static _validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      "pending": ["selected", "approved", "rejected"],
      "selected": ["approved", "rejected"], // Removed pending transition
      "approved": [],
      "rejected": [],
      "cancelled": []
    };
    
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      const error = new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }
  }

  static _checkUpdateAuthorization(userData, booking, status) {
    let isAuthorized = false;
    
    if (status === 'selected') {
      isAuthorized = (
        (userData.userType === 'host' && booking.place.ownerId === userData.id) ||
        (userData.userType === 'agent')
      );
    } else if (status === 'approved' || status === 'rejected') {
      isAuthorized = (
        (userData.userType === 'host' && booking.place.ownerId === userData.id) ||
        (userData.userType === 'agent') ||
        (userData.userType === 'client' && booking.userId === userData.id && status === 'rejected')
      );
    }
    
    if (!isAuthorized) {
      const error = new Error("You are not authorized to update this booking");
      error.statusCode = 403;
      throw error;
    }
  }

  static _handlePaymentConfirmation(paymentConfirmed, agentApproval) {
    if (!paymentConfirmed && !agentApproval) {
      const error = new Error("Payment confirmation required for selected bookings");
      error.statusCode = 400;
      error.requiresPaymentCheck = true;
      error.message = "This booking was selected but payment may not be complete. Do you want to approve anyway?";
      throw error;
    }
  }

  static _isClientCancellation(userData, booking, status) {
    return userData.userType === 'client' && 
           booking.userId === userData.id && 
           status === 'rejected';
  }

  static async _handleBookingConflicts(booking) {
    const placeDetails = await Place.findByPk(booking.placeId);
    const cooldownMinutes = placeDetails ? placeDetails.cooldown || 0 : 0;
    
    const competingBookings = await Booking.findAll({
      where: {
        placeId: booking.placeId,
        status: { [Op.in]: ['pending', 'selected'] },
        id: { [Op.ne]: booking.id }
      }
    });
    
    const conflictingBookings = findConflictingBookings(
      booking,
      competingBookings,
      cooldownMinutes
    );
    
    if (conflictingBookings.length > 0) {
      for (const conflictBooking of conflictingBookings) {
        conflictBooking.status = 'rejected';
        await conflictBooking.save();
      }
    }
  }

  static _generateStatusMessage(status, originalStatus, agentApproval) {
    switch (status) {
      case 'selected':
        return 'Booking selected successfully. Client can now proceed with payment.';
      case 'approved':
        if (agentApproval) {
          return 'Booking approved by agent. Payment and approval steps completed.';
        } else {
          return originalStatus === 'selected' 
            ? 'Booking approved after payment confirmation. Any remaining conflicting bookings have been rejected.' 
            : 'Booking approved. Any conflicting bookings have been automatically rejected.';
        }
      case 'rejected':
        return 'Booking rejected successfully.';
      default:
        return `Booking ${status} successfully.`;
    }
  }

  static async getBookingWithAssociations(bookingId) {
    return Booking.findByPk(bookingId, {
      include: [
        {
          model: Place,
          as: 'place',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email', 'phoneNumber']
            },
            {
              model: Currency,
              as: 'currency',
              attributes: ['id', 'name', 'code', 'charCode']
            }
          ],
          attributes: [
            'id', 'title', 'address', 'description', 'photos', 'price', 
            'checkIn', 'checkOut', 'maxGuests', 'ownerId', 'currencyId',
            'squareMeters', 'isHotel', 'minimumHours', 'lat', 'lng', 'refundOptions'
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phoneNumber']
        }
      ]
    });
  }

  static async _getAgentBookings() {
    return Booking.findAll({
      include: [
        {
          model: Place,
          as: 'place',
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
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'currencyId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  static async _getHostBookings(hostId) {
    return Booking.findAll({
      include: [
        {
          model: Place,
          as: 'place',
          where: { ownerId: hostId },
          include: [
            {
              model: Currency,
              as: 'currency',
              attributes: ['id', 'name', 'code', 'charCode']
            }
          ],
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'currencyId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  static async _getClientBookings(clientId) {
    return Booking.findAll({
      where: { userId: clientId },
      include: {
        model: Place,
        as: 'place',
        include: [
          {
            model: Currency,
            as: 'currency',
            attributes: ['id', 'name', 'code', 'charCode']
          }
        ],
        attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'currencyId']
      },
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = BookingService;
