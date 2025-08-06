/**
 * Notification Controller
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only notification-related HTTP requests
 * - Open/Closed: Extensible for new notification endpoints
 * - Interface Segregation: Focused on notification operations
 * - Dependency Inversion: Uses notification service abstraction
 * 
 * Implements DRY principle by centralizing notification request handling
 */

const ReviewNotificationService = require("../services/reviewNotificationService");
const UnifiedNotificationService = require("../services/unifiedNotificationService");

/**
 * Get user's unread notification count
 * GET /api/notifications/unread-count
 * Authenticated users only (US-R011)
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await ReviewNotificationService.getUnreadCount(userId);

    res.json({
      ok: true,
      count
    });

  } catch (error) {
    console.error("Error getting unread notification count:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get notification count"
    });
  }
};

/**
 * Get user's notifications with pagination
 * GET /api/notifications
 * Authenticated users only (US-R011)
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await ReviewNotificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === "true"
    });

    res.json({
      ok: true,
      ...result
    });

  } catch (error) {
    console.error("Error getting user notifications:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to get notifications"
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:notificationId/read
 * Authenticated users only (US-R011)
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await ReviewNotificationService.markAsRead(
      parseInt(notificationId), 
      userId
    );

    res.json({
      ok: true,
      notification
    });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to mark notification as read"
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 * Authenticated users only (US-R011)
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedCount = await ReviewNotificationService.markAllAsRead(userId);

    res.json({
      ok: true,
      message: `${updatedCount} notifications marked as read`,
      updatedCount
    });

  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to mark all notifications as read"
    });
  }
};

/**
 * Delete all notifications for the authenticated user
 * DELETE /api/notifications/delete-all
 * Authenticated users only
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedCount = await ReviewNotificationService.deleteAllNotifications(userId);

    res.json({
      ok: true,
      message: `${deletedCount} notifications deleted`,
      deletedCount
    });

  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to delete all notifications"
    });
  }
};

/**
 * Test SMS service connectivity and send test SMS
 * POST /api/notifications/test-sms
 * Authenticated users only (development/testing purposes)
 */
const testSMS = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, message } = req.body;

    // Test SMS service connectivity first
    const connectionTest = await UnifiedNotificationService.testSMSService();
    
    if (!connectionTest.success) {
      return res.status(503).json({
        ok: false,
        error: "SMS service unavailable",
        details: connectionTest.message
      });
    }

    // Create test notification with SMS
    const testMessage = message || "Test SMS from Airbnb Clone Platform";
    const result = await UnifiedNotificationService.createNotification({
      userId,
      type: "booking_confirmed",
      title: "SMS Test",
      message: testMessage,
      metadata: {
        bookingReference: "TEST-123",
        placeName: "Test Property",
        isTest: true
      },
      sendSMS: true
    });

    res.json({
      ok: true,
      message: "Test SMS sent successfully",
      notification: result.notification,
      smsService: connectionTest
    });

  } catch (error) {
    console.error("Error testing SMS:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to test SMS service",
      details: error.message
    });
  }
};

module.exports = {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteAllNotifications,
  testSMS
};
