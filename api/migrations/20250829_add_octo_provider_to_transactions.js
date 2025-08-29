'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For Postgres: alter type by recreating enum
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1) Rename old type
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_Transaction_provider" RENAME TO "enum_Transaction_provider_old";',
        { transaction }
      );

      // 2) Create new type with octo
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_Transaction_provider\" AS ENUM('payme','click','octo');",
        { transaction }
      );

      // 3) Alter column to new type using cast
      await queryInterface.sequelize.query(
        'ALTER TABLE "Transaction" ALTER COLUMN "provider" TYPE "enum_Transaction_provider" USING "provider"::text::"enum_Transaction_provider";',
        { transaction }
      );

      // 4) Drop old type
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Transaction_provider_old";',
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_Transaction_provider" RENAME TO "enum_Transaction_provider_old";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_Transaction_provider\" AS ENUM('payme','click');",
        { transaction }
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "Transaction" ALTER COLUMN "provider" TYPE "enum_Transaction_provider" USING "provider"::text::"enum_Transaction_provider";',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Transaction_provider_old";',
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
