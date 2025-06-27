'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new fields to bookings table for complete booking details
    await queryInterface.addColumn('Bookings', 'serviceFee', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: 0,
      comment: 'Platform service fee charged for this booking'
    });

    await queryInterface.addColumn('Bookings', 'protectionPlanSelected', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether client selected protection plan for this booking'
    });

    await queryInterface.addColumn('Bookings', 'protectionPlanFee', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: false,
      comment: 'Protection plan fee charged (0 if not selected)'
    });

    await queryInterface.addColumn('Bookings', 'finalTotal', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Total amount including all fees and protection'
    });

    await queryInterface.addColumn('Bookings', 'refundPolicySnapshot', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Refund options that were active on the place when booking was made'
    });

    // Update status enum to include 'cancelled' for booking cancellations
    await queryInterface.changeColumn('Bookings', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('Bookings', 'serviceFee');
    await queryInterface.removeColumn('Bookings', 'protectionPlanSelected');
    await queryInterface.removeColumn('Bookings', 'protectionPlanFee');
    await queryInterface.removeColumn('Bookings', 'finalTotal');
    await queryInterface.removeColumn('Bookings', 'refundPolicySnapshot');
    
    // Revert status enum to original values
    await queryInterface.changeColumn('Bookings', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });
  }
};
