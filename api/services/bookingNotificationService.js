/**
 * Booking Notification Service
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only booking notification logic
 * - Open/Closed: Extensible for new booking notification types
 * - Liskov Substitution: Can be extended with different notification strategies
 * - Interface Segregation: Focused interface for booking notification operations
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 * 
 * Implements DRY principle by centralizing booking notification creation logic
 */

const { Notification, User, Place, Booking } = require("../models");
const AgentService = require("./agentService");

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
          attributes: ["id", "name", "email"]
        }]
      });

      // Get booking user information
      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Don't create notification if user is booking their own place
      if (place.owner.id === booking.userId) {
        return null;
      }

      // Create notification for place owner (host)
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Include unique booking ID and detailed date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      
      const notification = await Notification.create({
        userId: place.owner.id,
        type: "booking_requested",
        title: "New Booking Request",
        message: `Booking #${bookingReference} requested for "${place.title}" on ${dateRange}${timeSlotInfo}`,
        metadata: {
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeId: booking.placeId,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          numOfGuests: booking.numOfGuests,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return notification;

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
          attributes: ["id", "name", "email"]
        }]
      });

      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email"]
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
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create notifications for all agents
      const notifications = [];
      for (const agent of agents) {
        const notification = await Notification.create({
          userId: agent.id,
          type: "booking_paid",
          title: "Payment Received",
          message: `Payment received for booking #${bookingReference} of "${place.title}" on ${dateRange}${timeSlotInfo}. Payout to host required.`,
          metadata: {
            bookingId: booking.id,
            uniqueRequestId: booking.uniqueRequestId,
            bookingReference,
            placeId: booking.placeId,
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
        notifications.push(notification);
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
          attributes: ["id", "name", "email"]
        }]
      });

      if (!place || !place.owner) {
        throw new Error("Place or owner not found");
      }

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      const approverText = isAgentApproval ? "by an agent" : "by the host";
      
      // Create notification for booking user (client)
      const notification = await Notification.create({
        userId: booking.userId,
        type: "booking_approved",
        title: "Booking Approved",
        message: `Booking #${bookingReference} for "${place.title}" on ${dateRange}${timeSlotInfo} has been approved ${approverText}. Please proceed with payment.`,
        metadata: {
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeId: booking.placeId,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          isAgentApproval,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return notification;

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
          attributes: ["id", "name", "email"]
        }]
      });

      const bookingUser = await User.findByPk(booking.userId, {
        attributes: ["id", "name", "email"]
      });

      if (!place || !place.owner || !bookingUser) {
        throw new Error("Place, owner, or booking user not found");
      }

      // Don't create notification if user is booking their own place
      if (place.owner.id === booking.userId) {
        return null;
      }

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create notification for place owner (host)
      const notification = await Notification.create({
        userId: place.owner.id,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: `Booking #${bookingReference} for "${place.title}" on ${dateRange}${timeSlotInfo} has been confirmed. Payment completed by ${bookingUser.name}.`,
        metadata: {
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeId: booking.placeId,
          placeName: place.title,
          clientId: booking.userId,
          clientName: bookingUser.name,
          totalPrice: booking.totalPrice,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`,
          notificationType: "host_confirmation"
        }
      });

      return notification;

    } catch (error) {
      console.error("Error creating booking confirmed notification:", error);
      throw new Error(`Failed to create booking confirmed notification: ${error.message}`);
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

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create notification for booking user (client)
      const notification = await Notification.create({
        userId: booking.userId,
        type: "booking_selected",
        title: "Booking Selected",
        message: `Booking #${bookingReference} for "${place.title}" on ${dateRange}${timeSlotInfo} has been selected. Please proceed with payment.`,
        metadata: {
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeId: booking.placeId,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return notification;

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

      // Include unique booking ID and date/time window in message
      const bookingReference = booking.uniqueRequestId || booking.id;
      const timeSlotInfo = booking.timeSlots && booking.timeSlots.length > 0 
        ? ` from ${booking.timeSlots[0].startTime} to ${booking.timeSlots[booking.timeSlots.length - 1].endTime}`
        : '';
      
      const dateRange = booking.checkInDate === booking.checkOutDate 
        ? this._formatDate(booking.checkInDate)
        : `${this._formatDate(booking.checkInDate)} - ${this._formatDate(booking.checkOutDate)}`;

      // Create notification for booking user (client)
      const notification = await Notification.create({
        userId: booking.userId,
        type: "booking_rejected",
        title: "Booking Rejected",
        message: `Booking #${bookingReference} for "${place.title}" on ${dateRange}${timeSlotInfo} has been rejected.`,
        metadata: {
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          bookingReference,
          placeId: booking.placeId,
          placeName: place.title,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          timeSlots: booking.timeSlots,
          dateTimeWindow: `${dateRange}${timeSlotInfo}`
        }
      });

      return notification;

    } catch (error) {
      console.error("Error creating booking rejected notification:", error);
      throw new Error(`Failed to create booking rejected notification: ${error.message}`);
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
}

module.exports = BookingNotificationService;
