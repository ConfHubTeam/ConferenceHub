'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change perks column from ARRAY(STRING) to JSONB to support paid/free structure
    await queryInterface.changeColumn('Places', 'perks', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to ARRAY(STRING) - this will lose paid/free information
    await queryInterface.changeColumn('Places', 'perks', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      allowNull: false
    });
  }
};
