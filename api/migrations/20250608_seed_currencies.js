'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add seed data for currencies
    await queryInterface.bulkInsert('Currencies', [
      {
        name: 'Uzbekistan Som',
        code: '860',
        charCode: 'UZS'
      },
      {
        name: 'United States Dollar',
        code: '840',
        charCode: 'USD'
      },
      {
        name: 'Russian Ruble',
        code: '643',
        charCode: 'RUB'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the seed data
    await queryInterface.bulkDelete('Currencies', null, {});
  }
};
