const sequelize = require('../config/database');
const User = require('./users');
const Place = require('./places');
const Booking = require('./bookings');
const Currency = require('./currency');
const Transaction = require('./transaction');
const Review = require('./review');
const ReviewReply = require('./reviewReply');
const ReviewHelpful = require('./reviewHelpful');
const ReviewReport = require('./reviewReport');
const Notification = require('./notification');
const UserFavorite = require('./userFavorite');

// Additional associations for existing models
User.hasMany(Place, { foreignKey: 'ownerId', as: 'places' });
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Place.hasMany(Booking, { foreignKey: 'placeId', as: 'bookings' });
Currency.hasMany(Place, { foreignKey: 'currencyId', as: 'places' });
Booking.hasMany(Transaction, { foreignKey: 'bookingId', as: 'transactions' });
Transaction.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Review system associations
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Place.hasMany(Review, { foreignKey: 'placeId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Review.belongsTo(Place, { foreignKey: 'placeId', as: 'Place' });

User.hasMany(ReviewReply, { foreignKey: 'userId', as: 'reviewReplies' });
Review.hasMany(ReviewReply, { foreignKey: 'reviewId', as: 'ReviewReplies' });
Review.hasOne(ReviewReply, { foreignKey: 'reviewId', as: 'Reply' });
ReviewReply.belongsTo(User, { foreignKey: 'userId', as: 'User' });
ReviewReply.belongsTo(Review, { foreignKey: 'reviewId', as: 'Review' });

User.hasMany(ReviewHelpful, { foreignKey: 'userId', as: 'helpfulVotes' });
Review.hasMany(ReviewHelpful, { foreignKey: 'reviewId', as: 'HelpfulVotes' });
ReviewHelpful.belongsTo(User, { foreignKey: 'userId', as: 'User' });
ReviewHelpful.belongsTo(Review, { foreignKey: 'reviewId', as: 'Review' });

User.hasMany(ReviewReport, { foreignKey: 'reporterId', as: 'reports' });
Review.hasMany(ReviewReport, { foreignKey: 'reviewId', as: 'Reports' });
ReviewReport.belongsTo(User, { foreignKey: 'reporterId', as: 'Reporter' });
ReviewReport.belongsTo(Review, { foreignKey: 'reviewId', as: 'Review' });

// Notification system associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User favorites associations
User.hasMany(UserFavorite, { foreignKey: 'userId', as: 'favorites' });
Place.hasMany(UserFavorite, { foreignKey: 'placeId', as: 'favoritedBy' });
UserFavorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserFavorite.belongsTo(Place, { foreignKey: 'placeId', as: 'place' });

// Export models and sequelize connection
module.exports = {
  sequelize,
  User,
  Place,
  Booking,
  Currency,
  Transaction,
  Review,
  ReviewReply,
  ReviewHelpful,
  ReviewReport,
  Notification,
  UserFavorite
};