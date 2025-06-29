const sequelize = require('../config/database');
const User = require('./users');
const Place = require('./places');
const Booking = require('./bookings');
const Currency = require('./currency');
const ClickTransaction = require('./clickTransaction');
const PaymeTransaction = require('./paymeTransaction');

// Additional associations
User.hasMany(Place, { foreignKey: 'ownerId', as: 'places' });
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
User.hasMany(ClickTransaction, { foreignKey: 'userId', as: 'clickTransactions' });
User.hasMany(PaymeTransaction, { foreignKey: 'userId', as: 'paymeTransactions' });
Place.hasMany(Booking, { foreignKey: 'placeId', as: 'bookings' });
Currency.hasMany(Place, { foreignKey: 'currencyId', as: 'places' });
Booking.hasMany(ClickTransaction, { foreignKey: 'bookingId', as: 'clickTransactions' });
Booking.hasMany(PaymeTransaction, { foreignKey: 'bookingId', as: 'paymeTransactions' });

// Export models and sequelize connection
module.exports = {
  sequelize,
  User,
  Place,
  Booking,
  Currency,
  ClickTransaction,
  PaymeTransaction
};