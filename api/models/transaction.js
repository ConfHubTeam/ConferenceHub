const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./users');

const Transaction = sequelize.define('Transaction', {
  state: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  performDate:{
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelDate:{
    type: DataTypes.DATE,
    allowNull: true
  },
  createDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  provider: {
    type: DataTypes.ENUM('payme', 'click', 'octo'),
    allowNull: false,
    defaultValue: 'payme'
  },

  // Provider-specific transaction ID
  providerTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  // Provider-specific data (JSON field for flexibility)
  providerData: {
    type: DataTypes.JSONB,
    allowNull: true
  },

  // Currency support
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'UZS'
  },

  // PAYME specific fields (deprecated - use providerTransactionId)
  paymeTransId: {
    type: DataTypes.STRING,
    allowNull: true,
    // Do not declare a column-level unique constraint here to avoid
    // Sequelize auto-creating duplicate unique constraints during sync.
    // We enforce uniqueness for Payme via a partial unique index instead.
    unique: false
  },
}, {
  timestamps: true,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['paymeTransId'],
      where: { provider: 'payme' }
    },
    {
      unique: true,
      fields: ['providerTransactionId']
    },
    {
      fields: ['provider', 'state']
    },
    {
      fields: ['bookingId']
    }
  ]
});

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Note: Booking relationship will be defined in models/index.js to avoid circular dependency

module.exports = Transaction;