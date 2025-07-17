/**
 * Migration: Add SMS notification fields to notifications table
 * 
 * Following database best practices:
 * - Snake_case naming convention
 * - Proper indexing for query performance
 * - Non-nullable fields with appropriate defaults
 */

exports.up = async (pgm) => {
  // Add SMS-related fields to notifications table
  pgm.addColumns("notifications", {
    is_sms_sent: {
      type: "boolean",
      notNull: true,
      default: false,
      comment: "Whether SMS notification was sent successfully"
    },
    sms_delivered_at: {
      type: "timestamp",
      notNull: false,
      comment: "Timestamp when SMS was successfully delivered"
    },
    sms_error: {
      type: "text",
      notNull: false,
      comment: "Error message if SMS delivery failed"
    },
    sms_request_id: {
      type: "varchar(255)",
      notNull: false,
      comment: "Eskiz API request ID for tracking SMS delivery status"
    }
  });

  // Add indexes for SMS-related queries
  pgm.createIndex("notifications", ["is_sms_sent"], {
    name: "idx_notifications_is_sms_sent"
  });

  pgm.createIndex("notifications", ["sms_delivered_at"], {
    name: "idx_notifications_sms_delivered_at"
  });

  pgm.createIndex("notifications", ["user_id", "is_sms_sent"], {
    name: "idx_notifications_user_sms_status"
  });
};

exports.down = async (pgm) => {
  // Drop indexes first
  pgm.dropIndex("notifications", ["user_id", "is_sms_sent"], {
    name: "idx_notifications_user_sms_status"
  });

  pgm.dropIndex("notifications", ["sms_delivered_at"], {
    name: "idx_notifications_sms_delivered_at"
  });

  pgm.dropIndex("notifications", ["is_sms_sent"], {
    name: "idx_notifications_is_sms_sent"
  });

  // Drop columns
  pgm.dropColumns("notifications", [
    "is_sms_sent",
    "sms_delivered_at", 
    "sms_error",
    "sms_request_id"
  ]);
};
