'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add blockedWeekdays column (array of integers representing days of the week 0-6)
      await queryInterface.addColumn(
        'Places', 
        'blockedWeekdays', 
        {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: true,
          defaultValue: []
        },
        { transaction }
      );

      // Add blockedDates column (array of date strings)
      await queryInterface.addColumn(
        'Places', 
        'blockedDates', 
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          defaultValue: []
        },
        { transaction }
      );

      // Add weekdayTimeSlots column (JSON object with weekday configurations)
      await queryInterface.addColumn(
        'Places', 
        'weekdayTimeSlots', 
        {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: {
            0: { start: "", end: "" }, // Sunday
            1: { start: "", end: "" }, // Monday
            2: { start: "", end: "" }, // Tuesday
            3: { start: "", end: "" }, // Wednesday
            4: { start: "", end: "" }, // Thursday
            5: { start: "", end: "" }, // Friday
            6: { start: "", end: "" }  // Saturday
          }
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove columns in reverse order
      await queryInterface.removeColumn('Places', 'weekdayTimeSlots', { transaction });
      await queryInterface.removeColumn('Places', 'blockedDates', { transaction });
      await queryInterface.removeColumn('Places', 'blockedWeekdays', { transaction });
    });
  }
};
