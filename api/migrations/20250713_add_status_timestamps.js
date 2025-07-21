exports.up = async (pgm) => {
  // Add timestamp fields for each booking status
  pgm.addColumns('bookings', {
    selected_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when booking was selected for payment'
    },
    approved_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when booking was approved'
    },
    rejected_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when booking was rejected'
    },
    cancelled_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Timestamp when booking was cancelled'
    }
  });

  // Add indexes for better query performance
  pgm.createIndex('bookings', 'selected_at');
  pgm.createIndex('bookings', 'approved_at');
  pgm.createIndex('bookings', 'rejected_at');
  pgm.createIndex('bookings', 'cancelled_at');
};

exports.down = async (pgm) => {
  // Drop indexes first
  pgm.dropIndex('bookings', 'selected_at');
  pgm.dropIndex('bookings', 'approved_at');
  pgm.dropIndex('bookings', 'rejected_at');
  pgm.dropIndex('bookings', 'cancelled_at');

  // Drop columns
  pgm.dropColumns('bookings', [
    'selected_at',
    'approved_at',
    'rejected_at',
    'cancelled_at'
  ]);
};
