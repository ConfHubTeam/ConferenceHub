'use strict';

/**
 * Migration to convert timeSlots column from JSON to JSONB
 * This is required to support PostgreSQL operators like @> (contains)
 * which are only available for JSONB columns
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Convert timeSlots column from JSON to JSONB
    await queryInterface.sequelize.query(`
      ALTER TABLE "Bookings" 
      ALTER COLUMN "timeSlots" TYPE jsonb USING "timeSlots"::jsonb
    `);
    
    // Add GIN index on timeSlots for better performance with JSONB operations
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_timeslots_gin 
      ON "Bookings" USING gin("timeSlots")
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the GIN index
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_bookings_timeslots_gin
    `);
    
    // Convert timeSlots column back from JSONB to JSON
    await queryInterface.sequelize.query(`
      ALTER TABLE "Bookings" 
      ALTER COLUMN "timeSlots" TYPE json USING "timeSlots"::json
    `);
  }
};
