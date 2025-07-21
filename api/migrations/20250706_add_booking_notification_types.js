/**
 * Migration: Add booking notification types to notifications table
 * Purpose: Extend notification system to handle booking-related notifications
 * Follows SOLID principles with single responsibility for notification type expansion
 */

exports.up = (pgm) => {
  // Update the type enum to include booking notification types
  pgm.sql(`
    ALTER TYPE enum_notifications_type 
    ADD VALUE 'booking_requested',
    ADD VALUE 'booking_paid',
    ADD VALUE 'booking_approved', 
    ADD VALUE 'booking_selected',
    ADD VALUE 'booking_rejected';
  `);
};

exports.down = (pgm) => {
  // Note: PostgreSQL doesn't support removing enum values directly
  // In a real migration rollback, you would need to recreate the enum
  // For this implementation, we'll leave a comment about the limitation
  pgm.sql('-- Cannot remove enum values in PostgreSQL. Manual intervention required for rollback.');
};
