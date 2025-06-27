/**
 * Add 'selected' status to booking status enum
 * This status allows hosts to pre-select a booking request,
 * enabling the client to proceed with payment before final approval.
 */

const { DataTypes } = require('sequelize');

async function up(queryInterface, Sequelize) {
  // Add 'selected' to the existing enum
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_Bookings_status" ADD VALUE 'selected';
  `);
  
  console.log('✅ Added "selected" status to booking status enum');
}

async function down(queryInterface, Sequelize) {
  // Note: PostgreSQL doesn't support removing enum values directly
  // This would require recreating the enum type and updating all references
  console.log('⚠️  Cannot remove enum value "selected" without recreating the entire enum type');
  console.log('   This migration cannot be automatically rolled back');
}

module.exports = { up, down };
