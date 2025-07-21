/**
 * Notification Routes
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only notification routing
 * - Open/Closed: Extensible for new notification endpoints
 * - Dependency Inversion: Uses controller abstraction
 * 
 * US-R011 compliant notification endpoints
 */

const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  testSMS
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication
router.use(isAuthenticated);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for header badge (US-R011)
 */
router.get("/unread-count", getUnreadCount);

/**
 * GET /api/notifications
 * Get user's notifications with pagination (US-R011)
 * Query params: page, limit, unreadOnly
 */
router.get("/", getUserNotifications);

/**
 * PUT /api/notifications/:notificationId/read
 * Mark specific notification as read (US-R011)
 */
router.put("/:notificationId/read", markAsRead);

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read (US-R011)
 */
router.put("/mark-all-read", markAllAsRead);

/**
 * POST /api/notifications/test-sms
 * Test SMS notification service (development/testing purposes)
 */
router.post("/test-sms", testSMS);

module.exports = router;
