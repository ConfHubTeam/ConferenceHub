exports.up = (pgm) => {
  // Add full day hours field
  pgm.addColumn('Places', {
    fullDayHours: {
      type: 'integer',
      notNull: false,
      default: 8,
      check: 'fullDayHours >= 1 AND fullDayHours <= 24'
    }
  });

  // Add full day discount price field
  pgm.addColumn('Places', {
    fullDayDiscountPrice: {
      type: 'numeric(10,2)',
      notNull: false,
      default: 0
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('Places', 'fullDayDiscountPrice');
  pgm.dropColumn('Places', 'fullDayHours');
};
