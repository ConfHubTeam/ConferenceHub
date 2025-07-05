const sequelize = require('../config/database');
const User = require('./users');
const Place = require('./places');
const Booking = require('./bookings');
const Currency = require('./currency');
const Transaction = require('./transaction');

// Additional associations
User.hasMany(Place, { foreignKey: 'ownerId', as: 'places' });
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Place.hasMany(Booking, { foreignKey: 'placeId', as: 'bookings' });
Currency.hasMany(Place, { foreignKey: 'currencyId', as: 'places' });
Booking.hasMany(Transaction, { foreignKey: 'bookingId', as: 'transactions' });

// Export models and sequelize connection
module.exports = {
  sequelize,
  User,
  Place,
  Booking,
  Currency,
  Transaction
};