exports.shorthands = undefined;

exports.up = pgm => {
  // Add refund_options column to places table
  pgm.addColumns('places', {
    refund_options: {
      type: 'json',
      notNull: false,
      default: '[]'
    }
  });
};

exports.down = pgm => {
  // Remove refund_options column
  pgm.dropColumns('places', ['refund_options']);
};
