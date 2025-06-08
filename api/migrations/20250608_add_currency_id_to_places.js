'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the default UZS currency
    const [currencies] = await queryInterface.sequelize.query(
      `SELECT id FROM "Currencies" WHERE "charCode" = 'UZS' LIMIT 1;`
    );
    
    const uzsId = currencies.length > 0 ? currencies[0].id : null;
    
    if (uzsId) {
      // Update existing places to use UZS as default
      await queryInterface.sequelize.query(
        `UPDATE "Places" SET "currencyId" = ${uzsId} WHERE "currencyId" IS NULL;`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // No downgrade action needed
  }
};
