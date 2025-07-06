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

module.exports = {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
