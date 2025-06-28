const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove serviceFee column from Bookings table
    await queryInterface.removeColumn('Bookings', 'serviceFee');
  },

  async down(queryInterface, Sequelize) {
    // Re-add serviceFee column if migration needs to be rolled back
    await queryInterface.addColumn('Bookings', 'serviceFee', {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: 'Platform service fee charged for this booking'
    });
  }
};
