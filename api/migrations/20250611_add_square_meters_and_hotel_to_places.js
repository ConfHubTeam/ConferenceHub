'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add squareMeters column (float value for room size)
      await queryInterface.addColumn(
        'Places', 
        'squareMeters', 
        {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: null
        },
        { transaction }
      );

      // Add isHotel column (boolean to indicate if the place is a hotel)
      await queryInterface.addColumn(
        'Places', 
        'isHotel', 
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove columns in reverse order
      await queryInterface.removeColumn('Places', 'isHotel', { transaction });
      await queryInterface.removeColumn('Places', 'squareMeters', { transaction });
    });
  }
};
