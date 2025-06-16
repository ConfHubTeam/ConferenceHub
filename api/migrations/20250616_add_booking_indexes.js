'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add index on placeId for faster lookups when querying bookings by place
    await queryInterface.addIndex('Bookings', ['placeId']);
    
    // Add composite index on placeId and status for faster filtering of bookings by status for a specific place
    await queryInterface.addIndex('Bookings', ['placeId', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Bookings', ['placeId']);
    await queryInterface.removeIndex('Bookings', ['placeId', 'status']);
  }
};
