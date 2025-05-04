const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userType: {
    type: DataTypes.ENUM('host', 'client', 'agent'),
    allowNull: false,
    defaultValue: 'client'
  }
}, {
  timestamps: true // Equivalent to Mongoose timestamps
});

module.exports = User;