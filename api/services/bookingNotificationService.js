/**
 * Booking Notification Service
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only booking notification logic
 * - Open/Closed: Extensible for new booking notification types
 * - Liskov Substitution:       if (!place || !place.owner) {
        throw new Error("Place or place owner not found for booking approval notification");
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const messageKey = isAgentApproval ? "booking.approved.byAgent" : "booking.approved.byHost";
      const message = this._createLocalizedMessage(messageKey, {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage); with different notification strategies
 * - Interface Segregation: Focused interface for booking notification operations
 * - Dependency Inversion: Depends on abstraction      if (!place) {
        throw new Error("Place not found for booking selected notification");
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.selected", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage); implementations
 * 
 * Implements DRY principle by centralizing booking notification creation logic
 */

const { Notification, User, Place, Booking, Currency } = require("../models");
const AgentService = require("./agentService");
const UnifiedNotificationService = require("./unifiedNotificationService");
const { translate, formatCurrency } = require("../i18n/config");

class BookingNotificationService {
  /**
   * Create notification for new booking request (US-R011)
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification
   */
  static async createBookingRequestNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      // Get place and owner information
      const place = await Place.findByPk(booking.placeId, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "preferredLanguage"]
        }]
      });

      // Get booking user information
      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email", "preferredLanguage"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Don't create notification if user is booking their own place
      if (place.owner.id === booking.userId) {
        return null;
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(place.owner.id);

      // Create notification for place owner (host)
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Include unique booking ID and detailed date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      
      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.requested", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);
      
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: place.owner.id,
        type: "booking_requested",
        title: "New Booking Request",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          dates: dateRange, // Add this for SMS template
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          numOfGuests: booking.numOfGuests,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking request notification:", error);
      throw new Error(`Failed to create booking request notification: ${error.message}`);
    }
  }

  /**
   * Create notification for booking payment (US-R011)
   * Payment notifications go to agents, not hosts
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Array>} Array of created notifications for agents
   */
  static async createBookingPaidNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "preferredLanguage"]
        }]
      });

      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email", "preferredLanguage"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Get all agents to notify about payment
      const agents = await AgentService.getAllAgents();
      
      if (!agents || agents.length === 0) {
        console.warn("No agents found to notify about payment");
        return [];
      }

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create notifications for all agents
      const notifications = [];
      for (const agent of agents) {
        // Get agent's preferred language (agents will use default English for now)
        const userLanguage = await this._getUserLanguage(agent.id);
        
        // Create localized message using i18n
        const message = this._createLocalizedMessage("booking.paid", {
          bookingReference,
          placeName: place.title,
          dateRange: dateRange + timeSlotInfo
        }, userLanguage);

        const result = await UnifiedNotificationService.createBookingNotification({
          userId: agent.id,
          type: "booking_paid",
          title: "Payment Received",
          message: message,
          bookingId: booking.id,
          placeId: booking.placeId,
          additionalMetadata: {
            uniqueRequestId: booking.uniqueRequestId,
            bookingReference,
            placeName: place.title,
            hostId: place.owner.id,
            hostName: place.owner.name,
            totalPrice: booking.totalPrice,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            timeSlots: booking.timeSlots,
            dateTimeWindow: `${dateRange}${timeSlotInfo}`,
            notificationType: "agent_payment"
          }
        });
        notifications.push(result.notification);
      }

      return notifications;

    } catch (error) {
      console.error("Error creating booking paid notification:", error);
      throw new Error(`Failed to create booking paid notification: ${error.message}`);
    }
  }

  /**
   * Create notification for booking approval (US-R011)
   * @param {Object} booking - Booking object with place and user data
   * @param {boolean} isAgentApproval - Whether approval was done by agent
   * @returns {Promise<Object>} Created notification
   */
  static async createBookingApprovedNotification(booking, isAgentApproval = false) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
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

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const messageKey = isAgentApproval ? "booking.approved.byAgent" : "booking.approved.byHost";
      const message = this._createLocalizedMessage(messageKey, {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);

      const approverText = isAgentApproval ? "by an agent" : "by the host";
      
      // Create notification for booking user (client)
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: booking.userId,
        type: "booking_approved",
        title: "Booking Approved",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          isAgentApproval,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking approved notification:", error);
      throw new Error(`Failed to create booking approved notification: ${error.message}`);
    }
  }

  /**
   * Create notification for booking confirmation (after payment is completed)
   * This notification goes to the host to inform them the booking is confirmed
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification for host
   */
  static async createBookingConfirmedNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "preferredLanguage"]
        }]
      });

      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email", "preferredLanguage"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Don't create notification if user is booking their own place
      if (place.owner.id === booking.userId) {
        return null;
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(place.owner.id);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.confirmed.host", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);
      // Create notification for place owner (host)
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: place.owner.id,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          clientId: booking.userId,
          clientName: bookingUser.name,
          totalPrice: booking.totalPrice,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`,
          notificationType: "host_confirmation",
          isHost: true
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking confirmed notification:", error);
      throw new Error(`Failed to create booking confirmed notification: ${error.message}`);
    }
  }

  /**
   * Create notification for booking confirmation for client (US-R011)
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification for client
   */
  static async createBookingConfirmedNotificationForClient(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "name", "email", "preferredLanguage"]
        }]
      });

      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email", "preferredLanguage"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Don't create notification if user is booking their own place
      if (place.owner.id === booking.userId) {
        return null;
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.confirmed.client", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);
      // Create notification for client (booking user)
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: booking.userId,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          hostId: place.owner.id,
          hostName: place.owner.name,
          totalPrice: booking.totalPrice,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`,
          notificationType: "client_confirmation",
          isHost: false
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking confirmed notification for client:", error);
      throw new Error(`Failed to create booking confirmed notification for client: ${error.message}`);
    }
  }

  /**
   * Create notification for booking selection (US-R011)
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification
   */
  static async createBookingSelectedNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        attributes: ["id", "title"]
      });

      if (!place) {
        throw new Error("Place not found");
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.selected", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);

      // Create notification for booking user (client)
      // Create notification for booking user (client)
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: booking.userId,
        type: "booking_selected",
        title: "Booking Selected",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking selected notification:", error);
      throw new Error(`Failed to create booking selected notification: ${error.message}`);
    }
  }

  /**
   * Create notification for booking rejection (US-R011)
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification
   */
  static async createBookingRejectedNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        attributes: ["id", "title"]
      });

      if (!place) {
        throw new Error("Place not found");
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(booking.userId);

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.rejected", {
        bookingReference,
        placeName: place.title,
        dateRange: dateRange + timeSlotInfo
      }, userLanguage);

      // Create notification for booking user (client)
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: booking.userId,
        type: "booking_rejected",
        title: "Booking Rejected",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking rejected notification:", error);
      throw new Error(`Failed to create booking rejected notification: ${error.message}`);
    }
  }

  /**
   * Create notification for agent payment to host (New Feature)
   * Notifies host when agent has completed payment for their booking
   * @param {Object} booking - Booking object with place and user data
   * @returns {Promise<Object>} Created notification for host
   */
  static async createBookingPaidToHostNotification(booking) {
    if (!booking || !booking.placeId || !booking.userId) {
      throw new Error("Invalid booking data for notification");
    }

    try {
      const place = await Place.findByPk(booking.placeId, {
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "name", "email", "preferredLanguage"]
          },
          {
            model: Currency,
            as: "currency",
            attributes: ["id", "charCode", "name"]
          }
        ]
      });

      if (!place || !place.owner) {
        throw new Error("Place or owner not found");
      }

      // Get user's preferred language
      const userLanguage = await this._getUserLanguage(place.owner.id);

      // Include unique booking ID and amount
      const bookingReference = booking.uniqueRequestId || booking.id;
      const amount = booking.totalPrice || 0;
      
      // Get currency from the place's currency setting, not from user language
      // This ensures the currency matches what the booking was actually made in
      const currency = place.currency?.charCode || "USD"; // Default to USD if no currency found
      const formattedAmount = formatCurrency(amount, userLanguage, currency);
      
      // Include date/time window calculation following same pattern as other methods
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = this._isSameDay(booking.checkInDate, booking.checkOutDate) 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create localized message using i18n
      const message = this._createLocalizedMessage("booking.paidToHost", {
        bookingReference,
        amount: formattedAmount
      }, userLanguage);

      // Create notification for host about payment received
      const result = await UnifiedNotificationService.createBookingNotification({
        userId: place.owner.id,
        type: "booking_paid_to_host",
        title: "Payment Received",
        message: message,
        bookingId: booking.id,
        placeId: booking.placeId,
        additionalMetadata: {
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeName: place.title,
          totalPrice: booking.totalPrice,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`,
          notificationType: "host_payment_received",
          paidAt: new Date().toISOString(),
          amount: booking.totalPrice
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating booking paid to host notification:", error);
      throw new Error(`Failed to create booking paid to host notification: ${error.message}`);
    }
  }

  /**
   * Get user's preferred language or fallback to Russian
   * @param {number} userId - User ID
   * @returns {Promise<string>} Language code (en, ru, uz)
   */
  static async _getUserLanguage(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ["preferredLanguage"]
      });
      
      const supportedLanguages = ["en", "ru", "uz"];
      const userLang = user?.preferredLanguage || "ru";
      
      return supportedLanguages.includes(userLang) ? userLang : "ru";
    } catch (error) {
      console.error("Error getting user language:", error);
      return "ru"; // Fallback to Russian
    }
  }

  /**
   * Create localized SMS message using i18n templates
   * @param {string} messageKey - Translation key (e.g., "booking.requested")
   * @param {Object} variables - Variables for interpolation
   * @param {string} language - Language code
   * @returns {string} Localized message
   */
  static _createLocalizedMessage(messageKey, variables, language = "ru") {
    try {
      return translate(messageKey, {
        lng: language,
        ns: "sms",
        ...variables
      });
    } catch (error) {
      console.error(`Error creating localized message for key ${messageKey}:`, error);
      // Fallback to Russian if translation fails
      if (language !== "ru") {
        return translate(messageKey, {
          lng: "ru",
          ns: "sms",
          ...variables
        });
      }
      return `Error: Missing translation for ${messageKey}`;
    }
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  static _formatDate(date) {
    if (!date) return "Unknown";
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  }

  /**
   * Check if two dates are the same day
   * @param {Date|string} date1 - First date
   * @param {Date|string} date2 - Second date
   * @returns {boolean} True if same day
   */
  static _isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return d1.getTime() === d2.getTime();
    } catch (error) {
      console.error("Error comparing dates:", error);
      return false;
    }
  }
}

module.exports = BookingNotificationService;
