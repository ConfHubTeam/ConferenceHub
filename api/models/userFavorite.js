const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFavorite = sequelize.define('UserFavorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',  // Capitalized to match actual table name
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  placeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Places',  // Capitalized to match actual table name
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_favorites',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'placeId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['placeId']
    }
  ]
});

module.exports = UserFavorite;
