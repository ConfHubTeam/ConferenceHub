const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Booking = require('./bookings');
const User = require('./users');

const ClickTransaction = sequelize.define('ClickTransaction', {
  state: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  clickTransId: {
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
  },
  prepareId: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  timestamps: true,
  freezeTableName: true
});

ClickTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ClickTransaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = ClickTransaction;