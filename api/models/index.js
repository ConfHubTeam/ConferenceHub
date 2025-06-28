const sequelize = require('../config/database');
const User = require('./users');
const Place = require('./places');
const Booking = require('./bookings');
const Currency = require('./currency');
const ClickTransaction = require('./clickTransaction');

// Additional associations
User.hasMany(Place, { foreignKey: 'ownerId', as: 'places' });
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
User.hasMany(ClickTransaction, { foreignKey: 'userId', as: 'clickTransactions' });
Place.hasMany(Booking, { foreignKey: 'placeId', as: 'bookings' });
Currency.hasMany(Place, { foreignKey: 'currencyId', as: 'places' });
Booking.hasMany(ClickTransaction, { foreignKey: 'bookingId', as: 'clickTransactions' });

// Export models and sequelize connection
module.exports = {
  sequelize,
  User,
  Place,
  Booking,
  Currency,
  ClickTransaction
};