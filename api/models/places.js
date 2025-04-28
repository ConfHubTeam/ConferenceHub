const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');

const Place = sequelize.define('Place', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  photos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  perks: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  extraInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checkIn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  roomType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Conference Room'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define relationship with User
Place.belongsTo(User, { 
  foreignKey: 'ownerId', // This replaces the owner field in MongoDB
  as: 'owner' // Alias to maintain compatibility with existing code
});

module.exports = Place;