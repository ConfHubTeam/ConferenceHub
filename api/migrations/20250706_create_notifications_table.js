/**
 * Migration: Create notifications table for review notifications
 * Purpose: Store notification data for review-related events
 * Follows SOLID principles with single responsibility for notification storage
 */

exports.up = async (pgm) => {
  // Create notifications table
  pgm.createTable("notifications", {
    id: {
      type: "serial",
      primaryKey: true
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: "Users(id)",
      onDelete: "CASCADE",
      comment: "User who receives the notification"
    },
    type: {
      type: "varchar(50)",
      notNull: true,
      check: "type IN ('review_created', 'review_reply', 'reply_helpful')",
      comment: "Type of notification"
    },
    title: {
      type: "varchar(255)",
      notNull: true,
      comment: "Notification title"
    },
    message: {
      type: "text",
      notNull: true,
      comment: "Notification message content"
    },
    metadata: {
      type: "jsonb",
      comment: "Additional data (review_id, place_id, rating, etc.)"
    },
    is_read: {
      type: "boolean",
      notNull: true,
      default: false,
      comment: "Whether notification has been read"
    },
    is_email_sent: {
      type: "boolean",
      notNull: true,
      default: false,
      comment: "Whether email notification was sent"
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp")
    },
    read_at: {
      type: "timestamp",
      comment: "When notification was marked as read"
    }
  });

  // Add indexes for better performance
  pgm.createIndex("notifications", "user_id", {
    name: "notifications_user_id_idx"
  });

  pgm.createIndex("notifications", "type", {
    name: "notifications_type_idx"
  });

  pgm.createIndex("notifications", "is_read", {
    name: "notifications_is_read_idx"
  });

  pgm.createIndex("notifications", "created_at", {
    name: "notifications_created_at_idx"
  });

  // Composite index for fetching user's unread notifications
  pgm.createIndex("notifications", ["user_id", "is_read"], {
    name: "notifications_user_unread_idx"
  });
};

exports.down = async (pgm) => {
  // Remove indexes
  pgm.dropIndex("notifications", "notifications_user_id_idx");
  pgm.dropIndex("notifications", "notifications_type_idx");
  pgm.dropIndex("notifications", "notifications_is_read_idx");
  pgm.dropIndex("notifications", "notifications_created_at_idx");
  pgm.dropIndex("notifications", "notifications_user_unread_idx");

  // Remove table
  pgm.dropTable("notifications");
};
