/**
 * Review Notification Service
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only review notification logic
 * - Open/Closed: Extensible for new notification types
 * - Liskov Substitution: Can be extended with different notification strategies
 * - Interface Segregation: Focused interface for notification operations
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 * 
 * Implements DRY principle by centralizing notification creation logic
 */

const { Notification, User, Place, Review } = require("../models");
const { Op } = require("sequelize");
const UnifiedNotificationService = require("./unifiedNotificationService");

class ReviewNotificationService {
  /**
   * Create notification for new review (US-R011)
   * @param {Object} review - Review object with place and user data
   * @returns {Promise<Object>} Created notification
   */
  static async createReviewNotification(review) {
    if (!review || !review.placeId || !review.User) {
      throw new Error("Invalid review data for notification");
    }

    try {
      // Get place and owner information
      const place = await Place.findByPk(review.placeId, {
        include: [{
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"]
        }]
      });

      if (!place || !place.owner) {
        throw new Error("Place or owner not found");
      }

      // Don't create notification if reviewer is the owner
      if (place.owner.id === review.User.id) {
        return null;
      }

      // Create notification for place owner
      const result = await UnifiedNotificationService.createReviewNotification({
        userId: place.owner.id,
        type: "review_created",
        title: "New Review Received",
        message: `${review.User.name} left a ${review.rating}-star review for "${place.title}": "${this._getReviewExcerpt(review.comment)}"`,
        reviewId: review.id,
        placeId: review.placeId,
        additionalMetadata: {
          placeName: place.title,
          reviewerName: review.User.name,
          rating: review.rating,
          reviewExcerpt: this._getReviewExcerpt(review.comment)
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating review notification:", error);
      throw new Error(`Failed to create review notification: ${error.message}`);
    }
  }

  /**
   * Create notification for host reply (US-R011)
   * @param {Object} reply - Reply object with review and user data
   * @returns {Promise<Object>} Created notification
   */
  static async createReplyNotification(reply) {
    if (!reply || !reply.reviewId || !reply.userId) {
      throw new Error("Invalid reply data for notification");
    }

    try {
      // Get review with user and place information
      const review = await Review.findByPk(reply.reviewId, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email"]
          },
          {
            model: Place,
            as: "Place",
            attributes: ["id", "title"],
            include: [{
              model: User,
              as: "owner",
              attributes: ["id", "name"]
            }]
          }
        ]
      });

      if (!review || !review.User || !review.Place) {
        throw new Error("Review, user, or place not found");
      }

      // Don't create notification if reply author is the original reviewer
      if (review.User.id === reply.userId) {
        return null;
      }

      // Create notification for original reviewer
      const result = await UnifiedNotificationService.createReviewNotification({
        userId: review.User.id,
        type: "review_reply",
        title: "Host Replied to Your Review",
        message: `${review.Place.owner.name} replied to your review of "${review.Place.title}": "${this._getReviewExcerpt(reply.replyText)}"`,
        reviewId: review.id,
        placeId: review.placeId,
        additionalMetadata: {
          replyId: reply.id,
          placeName: review.Place.title,
          hostName: review.Place.owner.name,
          replyExcerpt: this._getReviewExcerpt(reply.replyText)
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating reply notification:", error);
      throw new Error(`Failed to create reply notification: ${error.message}`);
    }
  }

  /**
   * Create notification when reply is marked as helpful (US-R011)
   * @param {Object} helpfulVote - Helpful vote object with user and reply data
   * @returns {Promise<Object>} Created notification
   */
  static async createReplyHelpfulNotification(helpfulVote) {
    if (!helpfulVote || !helpfulVote.reviewId || !helpfulVote.userId) {
      throw new Error("Invalid helpful vote data for notification");
    }

    try {
      // Get review with reply and place information
      const review = await Review.findByPk(helpfulVote.reviewId, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name"]
          },
          {
            model: Place,
            as: "Place",
            attributes: ["id", "title"],
            include: [{
              model: User,
              as: "owner",
              attributes: ["id", "name"]
            }]
          },
          {
            association: "Reply",
            include: [{
              model: User,
              as: "User",
              attributes: ["id", "name"]
            }]
          }
        ]
      });

      if (!review || !review.Reply || !review.Place) {
        throw new Error("Review, reply, or place not found");
      }

      // Don't create notification if helpful voter is the reply author
      if (review.Reply.userId === helpfulVote.userId) {
        return null;
      }

      const voter = await User.findByPk(helpfulVote.userId, {
        attributes: ["id", "name"]
      });

      if (!voter) {
        throw new Error("Voter not found");
      }

      // Create notification for reply author (host)
      const result = await UnifiedNotificationService.createReviewNotification({
        userId: review.Reply.userId,
        type: "reply_helpful",
        title: "Your Reply Was Marked Helpful",
        message: `${voter.name} found your reply helpful on "${review.Place.title}"`,
        reviewId: review.id,
        placeId: review.placeId,
        additionalMetadata: {
          replyId: review.Reply.id,
          placeName: review.Place.title,
          voterName: voter.name
        }
      });

      return result.notification;

    } catch (error) {
      console.error("Error creating reply helpful notification:", error);
      throw new Error(`Failed to create reply helpful notification: ${error.message}`);
    }
  }

  /**
   * Get user's unread notifications count (US-R011)
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const count = await Notification.count({
        where: {
          userId: userId,
          isRead: false,
          // Only count notifications with proper translation structure
          metadata: {
            [Op.and]: [
              { [Op.ne]: null },
              // Check that metadata contains both translationKey and translationVariables
              {
                [Op.and]: [
                  Notification.sequelize.literal("metadata::json->'translationKey' IS NOT NULL"),
                  Notification.sequelize.literal("metadata::json->'translationVariables' IS NOT NULL")
                ]
              }
            ]
          }
        }
      });

      return count;

    } catch (error) {
      console.error("Error getting unread notification count:", error);
      throw new Error(`Failed to get unread notification count: ${error.message}`);
    }
  }

  /**
   * Get user's notifications with pagination
   * @param {number} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Notifications with pagination info
   */
  static async getUserNotifications(userId, options = {}) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { page = 1, limit = 20, unreadOnly = false } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause = { userId };
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: {
          ...whereClause,
          // Only return notifications with proper translation structure
          metadata: {
            [Op.and]: [
              { [Op.ne]: null },
              // Check that metadata contains both translationKey and translationVariables
              {
                [Op.and]: [
                  Notification.sequelize.literal("metadata::json->'translationKey' IS NOT NULL"),
                  Notification.sequelize.literal("metadata::json->'translationVariables' IS NOT NULL")
                ]
              }
            ]
          }
        },
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Transform database field names to camelCase for frontend consistency
      const transformedNotifications = notifications.map(notification => {
        const notificationData = notification.toJSON ? notification.toJSON() : notification;
        return {
          ...notificationData,
          createdAt: notificationData.created_at,
          isRead: notificationData.is_read,
          readAt: notificationData.read_at,
          isEmailSent: notificationData.is_email_sent
        };
      });

      return {
        notifications: transformedNotifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID (for security)
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    if (!notificationId || !userId) {
      throw new Error("Notification ID and User ID are required");
    }

    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (!notification.isRead) {
        await notification.update({
          isRead: true,
          readAt: new Date()
        });
      }

      // Transform to camelCase for frontend consistency
      const notificationData = notification.toJSON ? notification.toJSON() : notification;
      return {
        ...notificationData,
        createdAt: notificationData.created_at,
        isRead: notificationData.is_read,
        readAt: notificationData.read_at,
        isEmailSent: notificationData.is_email_sent
      };

    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of updated notifications
   */
  static async markAllAsRead(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const [updatedCount] = await Notification.update({
        isRead: true,
        readAt: new Date()
      }, {
        where: {
          userId: userId,
          isRead: false
        }
      });

      return updatedCount;

    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete all notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of deleted notifications
   */
  static async deleteAllNotifications(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const deletedCount = await Notification.destroy({
        where: {
          userId: userId
        }
      });

      return deletedCount;

    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw new Error(`Failed to delete all notifications: ${error.message}`);
    }
  }

  /**
   * Get review excerpt for notifications (private helper)
   * @param {string} text - Full text
   * @returns {string} Truncated excerpt
   * @private
   */
  static _getReviewExcerpt(text) {
    if (!text) return "No comment provided";
    
    const maxLength = 100;
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength).trim() + "...";
  }
}

module.exports = ReviewNotificationService;
