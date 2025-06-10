/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.addColumn('Places', {
    minimumHours: {
      type: 'integer',
      notNull: true,
      default: 1,
      check: 'minimumHours >= 1 AND minimumHours <= 5',
      comment: 'Minimum number of hours required for booking (1-5 hours)'
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropColumn('Places', 'minimumHours');
};
