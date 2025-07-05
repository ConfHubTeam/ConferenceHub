const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Booking = require('./bookings');
const User = require('./users');

const Transaction = sequelize.define('Transaction', {
  state: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  performDate:{
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelDate:{
    type: DataTypes.DATE,
    allowNull: true
  },
  createDate: {
    type: DataTypes.DATE,
    allowNull: false,
    degfaultValue: DataTypes.NOW
  },
  provider: {
    type: DataTypes.ENUM('click', 'payme'),
    allowNull: false
  },

  // CLICK specific fields
  prepareId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clickTransId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // PAYME specific fields
  paymeTransId: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  timestamps: true,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['paymeTransId'],
      where: { provider: 'payme' }
    },
  ],
  indexes: [
    {
      unique: true,
      fields: ['clickTransId'],
      where: { provider: 'click' }
    },
  ]
});

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = Transaction;