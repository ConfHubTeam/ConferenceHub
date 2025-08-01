const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Place = require('./places');
const User = require('./users');

const Booking = sequelize.define('Booking', {
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  numOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.FLOAT
  },
  protectionPlanSelected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether client selected protection plan for this booking'
  },
  protectionPlanFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    comment: 'Protection plan fee charged (0 if not selected)'
  },
  finalTotal: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Total amount including all fees and protection'
  },
  refundPolicySnapshot: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Refund options that were active on the place when booking was made'
  },
  status: {
    type: DataTypes.ENUM('pending', 'selected', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  timeSlots: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of time slots with date, startTime, endTime for each booking day'
  },
  uniqueRequestId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique identifier for booking requests visible to hosts'
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Flag to track if notifications were sent for this booking'
  },
  paidToHost: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'paid_to_host',
    comment: 'Whether agent has paid the host for this approved booking'
  },
  paidToHostAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_to_host_at',
    comment: 'Timestamp when agent marked payment to host as complete'
  },
  selectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'selected_at',
    comment: 'Timestamp when booking was selected for payment'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
    comment: 'Timestamp when booking was approved'
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'rejected_at',
    comment: 'Timestamp when booking was rejected'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
    comment: 'Timestamp when booking was cancelled'
  },
  paymentResponse: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'payment_response',
    comment: 'Full payment response from payment provider'
  },
  clickInvoiceId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'click_invoice_id',
    comment: 'Click.uz invoice ID from Merchant API'
  },
  clickInvoiceCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'click_invoice_created_at',
    comment: 'When the Click.uz invoice was created'
  },
  clickPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'click_payment_id',
    comment: 'Click.uz payment ID when payment is completed'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
    comment: 'When the payment was successfully completed'
  }
}, {
  timestamps: true
});

// Define relationships
Booking.belongsTo(Place, { 
  foreignKey: 'placeId',
  as: 'place' // Alias to maintain compatibility with existing code
});

Booking.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user' // Alias to maintain compatibility with existing code
});

module.exports = Booking;