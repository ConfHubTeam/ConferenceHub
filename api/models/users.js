const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,  // Allow null because users might register via Telegram only
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true  // Allow null for Telegram-only users
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  telegramUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegramFirstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegramPhotoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telegramPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  telegramLinked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  clickPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User\'s preferred phone number for Click payments'
  },
  userType: {
    type: DataTypes.ENUM('host', 'client', 'agent'),
    allowNull: false,
    defaultValue: 'client'
  },
  preferredLanguage: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'ru',
    validate: {
      isIn: [['en', 'ru', 'uz']]
    },
    comment: 'User\'s preferred language for notifications (en, ru, uz)'
  }
}, {
  timestamps: true // Equivalent to Mongoose timestamps
});

module.exports = User;