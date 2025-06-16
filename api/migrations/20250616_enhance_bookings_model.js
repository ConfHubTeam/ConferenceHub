'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add timeSlots column to store detailed time slot information for each date
    await queryInterface.addColumn('Bookings', 'timeSlots', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    // Add uniqueRequestId column for tracking booking requests
    await queryInterface.addColumn('Bookings', 'uniqueRequestId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add notificationSent flag for tracking if notifications were sent
    await queryInterface.addColumn('Bookings', 'notificationSent', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Generate unique request IDs for existing bookings
    await queryInterface.sequelize.query(`
      UPDATE "Bookings" 
      SET "uniqueRequestId" = CONCAT('REQ-', "id", '-', FLOOR(RANDOM() * 1000)::text)
      WHERE "uniqueRequestId" IS NULL
    `);

    // Add index on uniqueRequestId for faster lookups
    await queryInterface.addIndex('Bookings', ['uniqueRequestId']);
    
    // Add indexes on status and dates for better query performance
    await queryInterface.addIndex('Bookings', ['status']);
    await queryInterface.addIndex('Bookings', ['checkInDate', 'checkOutDate']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Bookings', ['uniqueRequestId']);
    await queryInterface.removeIndex('Bookings', ['status']);
    await queryInterface.removeIndex('Bookings', ['checkInDate', 'checkOutDate']);
    
    // Remove columns
    await queryInterface.removeColumn('Bookings', 'timeSlots');
    await queryInterface.removeColumn('Bookings', 'uniqueRequestId');
    await queryInterface.removeColumn('Bookings', 'notificationSent');
  }
};
