/**
 * Migration: Add booking_id to reviews table
 * Allows tracking one review per booking instead of one review per place
 * Follows business requirement of one review per booking experience
 */

exports.up = async (pgm) => {
  // Add booking_id column to reviews table
  pgm.addColumn('reviews', {
    booking_id: {
      type: 'INTEGER',
      allowNull: true, // Allow null for existing reviews
      references: 'bookings(id)',
      onDelete: 'CASCADE'
    }
  });

  // Add index for performance on booking_id lookups
  pgm.createIndex('reviews', 'booking_id');

  // Add unique constraint to ensure one review per booking
  pgm.addConstraint('reviews', 'unique_review_per_booking', {
    unique: ['booking_id']
  });
};

exports.down = async (pgm) => {
  // Remove constraint first
  pgm.dropConstraint('reviews', 'unique_review_per_booking');
  
  // Remove index
  pgm.dropIndex('reviews', 'booking_id');
  
  // Remove column
  pgm.dropColumn('reviews', 'booking_id');
};
