const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Place = require('./places');
const User = require('./users');

const Booking = sequelize.define('Booking', {
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  numOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.FLOAT
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  timeSlots: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of time slots with date, startTime, endTime for each booking day'
  },
  uniqueRequestId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique identifier for booking requests visible to hosts'
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Flag to track if notifications were sent for this booking'
  }
}, {
  timestamps: true
});

// Define relationships
Booking.belongsTo(Place, { 
  foreignKey: 'placeId',
  as: 'place' // Alias to maintain compatibility with existing code
});

Booking.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user' // Alias to maintain compatibility with existing code
});

module.exports = Booking;