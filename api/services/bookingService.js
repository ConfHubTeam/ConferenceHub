const { Booking, Place, User, Currency } = require("../models");
const { Op } = require("sequelize");
const { validateBookingTimeSlots, findConflictingBookings, cleanupExpiredBookings, findCompetingBookings } = require("../utils/bookingUtils");
const BookingNotificationService = require("./bookingNotificationService");

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
      protectionPlanSelected,
      protectionPlanFee,
      finalTotal: finalTotal || totalPrice,
      refundPolicySnapshot,
      status: 'pending',
      timeSlots: selectedTimeSlots || [],
      uniqueRequestId
    });

    // Create notification for booking request (US-R011)
    try {
      await BookingNotificationService.createBookingRequestNotification(booking);
    } catch (error) {
      console.error("Error creating booking request notification:", error);
      // Don't fail the booking creation if notification fails
    }

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
  static async getBookings(userData, filters = {}) {
    // Clean up expired bookings first
    await cleanupExpiredBookings();

    if (userData.userType === 'agent') {
      return this._getAgentBookings(filters);
    } else if (userData.userType === 'host') {
      return this._getHostBookings(userData.id, filters);
    } else {
      return this._getClientBookings(userData.id, filters);
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
      try {
        // First, send rejection notification to the host using the same method
        await this._createRejectionNotificationForHost(booking);
      } catch (error) {
        console.error("Error creating cancellation notification for host:", error);
        // Don't fail the cancellation if notification fails
      }
      
      // Set cancelled timestamp before deletion for record keeping
      booking.cancelledAt = new Date();
      booking.status = 'cancelled';
      await booking.save();
      
      // Then delete the booking
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
    
    // Store previous status for notification logic
    const previousStatus = booking.status;
    
    // Update booking status
    booking.status = status;
    
    // Set appropriate timestamp when status changes for the first time
    const currentTime = new Date();
    if (status !== previousStatus) {
      switch (status) {
        case 'selected':
          if (!booking.selectedAt) {
            booking.selectedAt = currentTime;
          }
          break;
        case 'approved':
          if (!booking.approvedAt) {
            booking.approvedAt = currentTime;
          }
          break;
        case 'rejected':
          if (!booking.rejectedAt) {
            booking.rejectedAt = currentTime;
          }
          break;
        case 'cancelled':
          if (!booking.cancelledAt) {
            booking.cancelledAt = currentTime;
          }
          break;
      }
    }
    
    await booking.save();

    // Create notifications based on status change (US-R011)
    try {
      await this._createStatusChangeNotification(booking, status, previousStatus, agentApproval);
    } catch (error) {
      console.error("Error creating status change notification:", error);
      // Don't fail the status update if notification fails
    }

    // Reload with associations
    const updatedBooking = await this.getBookingWithAssociations(booking.id);
    
    return {
      success: true, 
      booking: updatedBooking,
      message: this._generateStatusMessage(status, previousStatus, agentApproval)
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
    
    let pendingCount, paidToHostCount, unpaidToHostCount;
    
    if (userData.userType === 'agent') {
      pendingCount = await Booking.count({
        where: { status: { [Op.in]: ['pending', 'selected'] } }
      });
      
      // Count paid and unpaid approved bookings for agents
      paidToHostCount = await Booking.count({
        where: { 
          status: 'approved',
          paidToHost: true 
        }
      });
      
      unpaidToHostCount = await Booking.count({
        where: { 
          status: 'approved',
          paidToHost: false 
        }
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
      
      // Count paid and unpaid approved bookings for hosts
      paidToHostCount = await Booking.count({
        include: [
          {
            model: Place,
            as: 'place',
            where: { ownerId: userData.id },
            attributes: []
          }
        ],
        where: {
          status: 'approved',
          paidToHost: true
        }
      });
      
      unpaidToHostCount = await Booking.count({
        include: [
          {
            model: Place,
            as: 'place',
            where: { ownerId: userData.id },
            attributes: []
          }
        ],
        where: {
          status: 'approved',
          paidToHost: false
        }
      });
    }
    
    return { 
      pendingCount, 
      paidToHostCount, 
      unpaidToHostCount 
    };
  }

  /**
   * Mark booking as paid to host (Agent-only action)
   * This is the final step in the booking process where agent pays the host
   */
  static async markPaidToHost(bookingId, userData) {
    // Only agents can perform this action
    if (userData.userType !== 'agent') {
      const error = new Error("Only agents can mark bookings as paid to host");
      error.statusCode = 403;
      throw error;
    }

    // Get booking with associations
    const booking = await this.getBookingWithAssociations(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Validate booking status - only approved bookings can be paid to host
    if (booking.status !== 'approved') {
      const error = new Error("Only approved bookings can be marked as paid to host");
      error.statusCode = 400;
      throw error;
    }

    // Check if already paid to host
    if (booking.paidToHost) {
      const error = new Error("This booking has already been marked as paid to host");
      error.statusCode = 400;
      throw error;
    }

    // Update booking to mark as paid to host
    booking.paidToHost = true;
    booking.paidToHostAt = new Date();
    await booking.save();

    // Create notification for host about payment received (US-R011)
    try {
      await BookingNotificationService.createBookingPaidToHostNotification(booking);
    } catch (error) {
      console.error("Error creating paid to host notification:", error);
      // Don't fail the payment marking if notification fails
    }

    // Reload with associations
    const updatedBooking = await this.getBookingWithAssociations(booking.id);
    
    return {
      success: true,
      booking: updatedBooking,
      message: "Payment to host marked successfully"
    };
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

  /**
   * Create rejection notification for host when client cancels
   * Uses the same message format as regular rejection but sends to host
   */
  static async _createRejectionNotificationForHost(booking) {
    // Get place and host information
    const place = await Place.findByPk(booking.placeId, {
      include: [{
        model: User,
        as: "owner",
        attributes: ["id", "name", "email", "preferredLanguage"]
      }]
    });

    if (!place || !place.owner) {
      throw new Error("Place or owner not found");
    }

    // Don't create notification if client is cancelling their own place
    if (place.owner.id === booking.userId) {
      return null;
    }

    // Get host's preferred language
    const userLanguage = await User.findByPk(place.owner.id, {
      attributes: ["preferredLanguage"]
    }).then(user => {
      const supportedLanguages = ["en", "ru", "uz"];
      const userLang = user?.preferredLanguage || "ru";
      return supportedLanguages.includes(userLang) ? userLang : "ru";
    }).catch(() => "ru");

    // Include unique booking ID and date/time window in message
    const bookingReference = booking.uniqueRequestId || booking.id;
    const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
      ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
      : '';
    
    // Format dates
    const isSameDay = (date1, date2) => {
      if (!date1 || !date2) return false;
      try {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getTime() === d2.getTime();
      } catch (error) {
        return false;
      }
    };

    const formatDate = (date, language = "en") => {
      if (!date) return "Unknown";
      try {
        const dateObj = new Date(date);
        const localeMap = {
          "en": "en-US",
          "ru": "ru-RU", 
          "uz": "uz-UZ"
        };
        const locale = localeMap[language] || "en-US";
        return dateObj.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      } catch (error) {
        return "Unknown";
      }
    };

    const dateRange = isSameDay(booking.checkInDate, booking.checkOutDate) 
      ? formatDate(booking.checkInDate, userLanguage)
      : `${formatDate(booking.checkInDate, userLanguage)} - ${formatDate(booking.checkOutDate, userLanguage)}`;

    // Create localized SMS message using the same rejected template
    const { translate } = require("../i18n/config");
    const smsMessage = translate("booking.rejected", {
      lng: userLanguage,
      ns: "sms",
      bookingReference,
      placeName: place.title,
      dateRange: dateRange + timeSlotInfo
    });

    // Create notification for host using the same rejection notification format
    const UnifiedNotificationService = require("./unifiedNotificationService");
    const result = await UnifiedNotificationService.createBookingNotification({
      userId: place.owner.id,  // Send to host instead of client
      type: "booking_rejected",
      translationKey: "booking_rejected",
      translationVariables: {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      },
      smsMessage: smsMessage,
      bookingId: booking.id,
      placeId: booking.placeId,
      additionalMetadata: {
        uniqueRequestId: booking.uniqueRequestId,
        bookingReference,
        placeName: place.title,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        timeSlots: booking.timeSlots,
        dateTimeWindow: `${dateRange}${timeSlotInfo}`,
        cancelledByClient: true,  // Flag to indicate this was a client cancellation
        clientId: booking.userId
      }
    });

    return result.notification;
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

  static async _getAgentBookings(filters = {}) {
    const whereClause = {};
    
    // Apply paid filter if specified - only for approved bookings
    if (filters.paidFilter === 'paid') {
      whereClause.status = 'approved';
      whereClause.paidToHost = true;
    } else if (filters.paidFilter === 'unpaid') {
      whereClause.status = 'approved';
      whereClause.paidToHost = false;
    }
    // If no paid filter specified, show all bookings regardless of status
    
    return Booking.findAll({
      where: whereClause,
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
          attributes: ['id', 'title', 'address', 'photos', 'price', 'checkIn', 'checkOut', 'currencyId']
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

  static async _getHostBookings(hostId, filters = {}) {
    const whereClause = {};
    
    // Apply paid filter if specified for approved bookings only
    if (filters.paidFilter === 'paid') {
      whereClause.status = 'approved';
      whereClause.paidToHost = true;
    } else if (filters.paidFilter === 'unpaid') {
      whereClause.status = 'approved';
      whereClause.paidToHost = false;
    }
    // If no paid filter specified, show all bookings (pending, selected, approved, rejected)
    
    return Booking.findAll({
      include: [
        {
          model: Place,
          as: 'place',
          where: { ownerId: hostId }, // This ensures we only get bookings for this host's places
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
          attributes: ['id', 'name', 'email', 'phoneNumber']
        }
      ],
      where: whereClause, // Apply status/paid filters here
      order: [['createdAt', 'DESC']]
    });
  }

  static async _getClientBookings(clientId, filters = {}) {
    // Clients don't need to see paid status - this is for agent/host only
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

  /**
   * Create notifications based on booking status changes (US-R011)
   * Updated to follow new notification flow:
   * - Hosts receive approved/confirmed notifications only
   * - Agents receive payment notifications
   * @param {Object} booking - The booking object
   * @param {string} newStatus - New status
   * @param {string} previousStatus - Previous status
   * @param {boolean} agentApproval - Whether approval was done by agent
   */
  static async _createStatusChangeNotification(booking, newStatus, previousStatus, agentApproval = false) {
    // Only create notifications for specific status transitions
    switch (newStatus) {
      case 'selected':
        if (previousStatus === 'pending') {
          await BookingNotificationService.createBookingSelectedNotification(booking);
        }
        break;
        
      case 'approved':
        if (previousStatus === 'selected') {
          // This means payment was confirmed and booking was approved
          // Notify agents about payment (they handle payouts to hosts)
          await BookingNotificationService.createBookingPaidNotification(booking);
          // Notify host about confirmation (not payment)
          await BookingNotificationService.createBookingConfirmedNotification(booking);
          // Notify client about booking confirmation
          await BookingNotificationService.createBookingConfirmedNotificationForClient(booking);
        } else if (previousStatus === 'pending') {
          // Direct approval without payment selection
          // Only notify host about approval/confirmation
          await BookingNotificationService.createBookingApprovedNotification(booking, agentApproval);
          // Also notify client about booking approval
          await BookingNotificationService.createBookingConfirmedNotificationForClient(booking);
        }
        break;
        
      case 'rejected':
        if (previousStatus === 'pending' || previousStatus === 'selected') {
          await BookingNotificationService.createBookingRejectedNotification(booking);
        }
        break;
        
      default:
        // No notification needed for other status changes
        break;
    }
  }
}

module.exports = BookingService;
