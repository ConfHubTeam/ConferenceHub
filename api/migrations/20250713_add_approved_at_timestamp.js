exports.up = pgm => {
  // Add approved_at column to track when booking was approved
  pgm.addColumn('bookings', {
    approved_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when booking was approved'
    }
  });

  // Update existing approved bookings to set approved_at to their updatedAt if status is approved
  pgm.sql(`
    UPDATE bookings 
    SET approved_at = updated_at 
    WHERE status = 'approved' AND approved_at IS NULL
  `);

  // Add index for faster queries
  pgm.createIndex('bookings', 'approved_at');
};

exports.down = pgm => {
  pgm.dropIndex('bookings', 'approved_at');
  pgm.dropColumn('bookings', 'approved_at');
};
