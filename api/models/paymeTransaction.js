const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Booking = require('./bookings');
const User = require('./users');

const PaymeTransaction = sequelize.define('PaymeTransaction', {
  state: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paymeTransId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
    allowNull: true,
    degfaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  freezeTableName: true
});

PaymeTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PaymeTransaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = PaymeTransaction;