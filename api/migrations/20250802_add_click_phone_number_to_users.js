const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'clickPhoneNumber', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User\'s preferred phone number for Click payments'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'clickPhoneNumber');
  }
};
