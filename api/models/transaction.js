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
    defaultValue: DataTypes.NOW
  },
  provider: {
    type: DataTypes.ENUM('payme'),
    allowNull: false,
    defaultValue: 'payme'
  },

  // PAYME specific fields
  paymeTransId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
}, {
  timestamps: true,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['paymeTransId'],
      where: { provider: 'payme' }
    }
  ]
});

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = Transaction;