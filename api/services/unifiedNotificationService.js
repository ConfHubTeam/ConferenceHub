/**
 * Unified Notification Service
 * 
 * Following SOLID principles:
 * - Single Responsibility: Handles notification creation and dispatching
 * - Open/Closed: Extensible for new notification channels without modifying existing code
 * - Liskov Substitution: Can work with different notification providers
 * - Interface Segregation: Focused notification orchestration methods
 * - Dependency Inversion: Depends on abstractions (notification channels) not implementations
 * 
 * Implements DRY principle by centralizing notification logic and template generation
 */

const Notification = require("../models/notification");
const User = require("../models/users");
const Place = require("../models/places");
const Booking = require("../models/bookings");
const eskizSMSService = require("./eskizSMSService");

class UnifiedNotificationService {
  /**
   * SMS message templates for different notification types
   * Following DRY principle by centralizing template definitions
   */
  static SMS_TEMPLATES = {
    booking_requested: (data) => 
      `New booking request #${data.bookingReference} for ${data.placeName} on ${data.dates}`,
    
    booking_selected: (data) => 
      `Your booking #${data.bookingReference} for ${data.placeName} has been selected! Complete payment to confirm.`,
    
    booking_approved: (data) => 
      `Booking #${data.bookingReference} for ${data.placeName} has been approved. Please proceed with payment.`,
    
    booking_confirmed: (data) => 
      data.isHost 
        ? `Booking #${data.bookingReference} for ${data.placeName} confirmed - payment received from ${data.clientName}`
        : `Great news! Your booking #${data.bookingReference} for ${data.placeName} is confirmed.`,
    
    booking_paid: (data) => 
      `Payment received for booking #${data.bookingReference}. Payout to host ${data.hostName} required.`,
    
    booking_rejected: (data) => 
      `Your booking #${data.bookingReference} for ${data.placeName} was declined.`,
    
    booking_paid_to_host: (data) => 
      `Payout of ${data.amount} has been processed for booking #${data.bookingReference}`
  };

  /**
   * Create and dispatch unified notification (in-app + SMS for booking types only)
   * @param {object} notificationData - Notification configuration
   * @returns {Promise<object>} Creation result
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    metadata = {},
    sendSMS = true
  }) {
    try {
      // Create in-app notification first (primary channel)
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        metadata,
        isRead: false,
        isEmailSent: false,
        isSMSSent: false
      });

      console.log(`Notification created for user ${userId}, type: ${type}`);

      // Only send SMS for booking-related notifications to reduce costs
      const isBookingNotification = type.startsWith('booking_');
      
      if (sendSMS && isBookingNotification) {
        // Don't await SMS to avoid blocking in-app notification
        this.sendSMSNotification(notification.id, userId, type, metadata)
          .catch(error => {
            console.error(`SMS notification failed for notification ${notification.id}:`, error.message);
          });
      } else if (sendSMS && !isBookingNotification) {
        console.log(`Skipping SMS for ${type} - only booking notifications sent via SMS`);
      }

      return {
        success: true,
        notification,
        message: "Notification created successfully"
      };
    } catch (error) {
      console.error("Failed to create notification:", error.message);
      throw new Error(`Notification creation failed: ${error.message}`);
    }
  }

  /**
   * Send SMS notification
   * @param {number} notificationId - Notification database ID
   * @param {number} userId - Target user ID
   * @param {string} type - Notification type
   * @param {object} metadata - Notification metadata
   * @returns {Promise<object>} SMS sending result
   */
  static async sendSMSNotification(notificationId, userId, type, metadata = {}) {
    try {
      // Get user's phone number
      const user = await User.findByPk(userId, {
        attributes: ["id", "phoneNumber", "name"]
      });

      if (!user || !user.phoneNumber) {
        console.log(`User ${userId} has no phone number, skipping SMS`);
        return { success: false, reason: "No phone number" };
      }

      // Generate SMS message based on type and metadata
      const smsMessage = await this.generateSMSMessage(type, metadata, user);

      if (!smsMessage) {
        console.log(`No SMS template for notification type: ${type}`);
        return { success: false, reason: "No SMS template" };
      }

      // Send SMS via Eskiz service
      const smsResult = await eskizSMSService.sendSMS(user.phoneNumber, smsMessage);

      // Update notification record with SMS status
      await this.updateNotificationSMSStatus(notificationId, smsResult);

      if (smsResult.success) {
        console.log(`SMS sent successfully to user ${userId} (${user.phoneNumber})`);
        return {
          success: true,
          requestId: smsResult.requestId,
          message: "SMS sent successfully"
        };
      } else {
        console.error(`SMS failed for user ${userId}:`, smsResult.error);
        return {
          success: false,
          error: smsResult.error,
          reason: "SMS service error"
        };
      }
    } catch (error) {
      console.error(`SMS notification error for user ${userId}:`, error.message);
      
      // Update notification with error status
      try {
        await this.updateNotificationSMSStatus(notificationId, {
          success: false,
          error: error.message
        });
      } catch (updateError) {
        console.error("Failed to update notification SMS error status:", updateError.message);
      }

      return {
        success: false,
        error: error.message,
        reason: "SMS processing error"
      };
    }
  }

  /**
   * Generate SMS message based on notification type and metadata
   * @param {string} type - Notification type
   * @param {object} metadata - Notification metadata
   * @param {object} user - User information
   * @returns {Promise<string>} Generated SMS message
   */
  static async generateSMSMessage(type, metadata, user) {
    try {
      const template = this.SMS_TEMPLATES[type];
      
      if (!template) {
        return null;
      }

      // Prepare template data by enriching metadata
      const templateData = await this.enrichMetadataForSMS(metadata, user);

      // Generate message using template
      return template(templateData);
    } catch (error) {
      console.error("SMS message generation failed:", error.message);
      return null;
    }
  }

  /**
   * Enrich metadata with additional data needed for SMS templates
   * @param {object} metadata - Original metadata
   * @param {object} user - User information
   * @returns {Promise<object>} Enriched metadata
   */
  static async enrichMetadataForSMS(metadata, user) {
    const enriched = { ...metadata };

    try {
      // Add user information
      enriched.userName = `${user.firstName} ${user.lastName}`.trim();

      // Enrich booking-related data
      if (metadata.bookingId) {
        const booking = await Booking.findByPk(metadata.bookingId, {
          include: [
            {
              model: Place,
              as: "place",
              attributes: ["id", "title"]
            },
            {
              model: User,
              as: "client",
              attributes: ["id", "firstName", "lastName"]
            },
            {
              model: User,
              as: "host",
              attributes: ["id", "firstName", "lastName"]
            }
          ]
        });

        if (booking) {
          enriched.bookingReference = booking.reference || booking.id;
          enriched.placeName = booking.place ? booking.place.title : "Property";
          enriched.clientName = booking.client ? `${booking.client.firstName} ${booking.client.lastName}`.trim() : "Guest";
          enriched.hostName = booking.host ? `${booking.host.firstName} ${booking.host.lastName}`.trim() : "Host";
          enriched.amount = booking.totalAmount;
          
          // Format dates
          if (booking.checkIn && booking.checkOut) {
            enriched.dates = `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`;
          }
        }
      }

      // Enrich place-related data
      if (metadata.placeId && !enriched.placeName) {
        const place = await Place.findByPk(metadata.placeId, {
          attributes: ["id", "title"]
        });
        
        if (place) {
          enriched.placeName = place.title;
        }
      }

      return enriched;
    } catch (error) {
      console.error("Metadata enrichment failed:", error.message);
      return enriched; // Return original metadata if enrichment fails
    }
  }

  /**
   * Update notification record with SMS delivery status
   * @param {number} notificationId - Notification ID
   * @param {object} smsResult - SMS sending result
   * @returns {Promise<void>}
   */
  static async updateNotificationSMSStatus(notificationId, smsResult) {
    try {
      const updateData = {
        isSMSSent: smsResult.success
      };

      if (smsResult.success) {
        updateData.smsRequestId = smsResult.requestId;
        updateData.smsDeliveredAt = new Date();
        updateData.smsError = null;
      } else {
        updateData.smsError = smsResult.error || "SMS delivery failed";
        updateData.smsRequestId = null;
      }

      await Notification.update(updateData, {
        where: { id: notificationId }
      });
    } catch (error) {
      console.error(`Failed to update SMS status for notification ${notificationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create booking notification with SMS
   * @param {object} bookingData - Booking notification data
   * @returns {Promise<object>} Creation result
   */
  static async createBookingNotification({
    userId,
    type,
    title,
    message,
    bookingId,
    placeId,
    additionalMetadata = {}
  }) {
    const metadata = {
      bookingId,
      placeId,
      ...additionalMetadata
    };

    return await this.createNotification({
      userId,
      type,
      title,
      message,
      metadata,
      sendSMS: true
    });
  }

  /**
   * Create review notification (in-app only - no SMS to reduce costs)
   * @param {object} reviewData - Review notification data
   * @returns {Promise<object>} Creation result
   */
  static async createReviewNotification({
    userId,
    type,
    title,
    message,
    reviewId,
    placeId,
    additionalMetadata = {}
  }) {
    const metadata = {
      reviewId,
      placeId,
      ...additionalMetadata
    };

    return await this.createNotification({
      userId,
      type,
      title,
      message,
      metadata,
      sendSMS: false // Explicitly disable SMS for review notifications
    });
  }

  /**
   * Test SMS service connectivity
   * @returns {Promise<object>} Test result
   */
  static async testSMSService() {
    return await eskizSMSService.testConnection();
  }
}

module.exports = UnifiedNotificationService;
