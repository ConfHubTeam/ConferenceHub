/**
 * Migration: Add paid_to_host status to bookings
 * 
 * This migration adds a new boolean field to track when agent has paid the host
 * for approved bookings. This field is only relevant for agent-host interactions
 * and should not be visible to clients.
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only the addition of paid_to_host field
 * - Open/Closed: Extendable for future payment tracking enhancements
 */

exports.up = (pgm) => {
  // Add paid_to_host field to bookings table
  pgm.addColumns("Bookings", {
    paid_to_host: {
      type: "boolean",
      notNull: true,
      default: false,
      comment: "Whether agent has paid the host for this approved booking"
    },
    paid_to_host_at: {
      type: "timestamp",
      notNull: false,
      comment: "Timestamp when agent marked payment to host as complete"
    }
  });

  // Add index for efficient filtering of paid bookings
  pgm.createIndex("Bookings", ["paid_to_host"], {
    name: "idx_bookings_paid_to_host"
  });

  // Add composite index for status and paid_to_host filtering
  pgm.createIndex("Bookings", ["status", "paid_to_host"], {
    name: "idx_bookings_status_paid_to_host"
  });
};

exports.down = (pgm) => {
  // Remove indexes first
  pgm.dropIndex("Bookings", ["paid_to_host"], {
    name: "idx_bookings_paid_to_host",
    ifExists: true
  });

  pgm.dropIndex("Bookings", ["status", "paid_to_host"], {
    name: "idx_bookings_status_paid_to_host", 
    ifExists: true
  });

  // Remove columns
  pgm.dropColumns("Bookings", ["paid_to_host", "paid_to_host_at"]);
};
