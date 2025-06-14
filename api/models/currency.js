const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Currency = sequelize.define('Currency', {
  name: {
    type: DataTypes.STRING, // Российский рубль
    allowNull: false
  },
  code: {
    type: DataTypes.STRING, // 643
    allowNull: false,
    unique: true
  },
  charCode: {
    type: DataTypes.STRING, // RUB
    allowNull: false,
    unique: true
  }
}, {
  timestamps: false
});

module.exports = Currency;