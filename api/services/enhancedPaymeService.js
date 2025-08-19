const PaymeApiService = require('./paymeApiService');
const TransactionService = require('./transactionService');
const { Booking } = require('../models');

/**
 * Enhanced Payme Service
 * High-level service that orchestrates Payme payment operations
 * Follows Interface Segregation and Dependency Inversion principles
 * Uses unified TransactionService for consistent data management
 */
class EnhancedPaymeService {
  constructor() {
    this.paymeApi = new PaymeApiService(
      process.env.PAYME_MERCHANT_ID,
      process.env.PAYME_TEST_KEY || process.env.PAYME_SECRET_KEY,
      process.env.PAYME_BASE_URL || 'https://checkout.paycom.uz',
      process.env.NODE_ENV !== 'production'
    );
  }

  // Payme transaction states
  get STATES() {
    return {
      PENDING: 1,
      PAID: 2,
      PENDING_CANCELED: -1,
      PAID_CANCELED: -2
    };
  }

  /**
   * Get payment information for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Payment information
   */
  async getPaymentInfo(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      const transaction = await TransactionService.getPaymeTransactionByBooking(bookingId);
      const amount = booking.finalTotal || booking.totalPrice;
      
      return {
        bookingId: bookingId,
        amount: amount,
        currency: 'UZS',
        status: booking.status,
        paymentProvider: 'payme',
        hasExistingTransaction: !!transaction,
        transactionId: transaction?.providerTransactionId || null,
        transactionState: transaction?.state || null,
        canPay: booking.status === 'selected' && !transaction
      };
      
    } catch (error) {
      console.error(`Error getting Payme payment info for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Check if payment is available for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Availability result
   */
  async checkPaymentAvailability(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        return {
          available: false,
          reason: 'Booking not found'
        };
      }

      const user = await booking.getUser();
      if (!user) {
        return {
          available: false,
          reason: 'User not found'
        };
      }

      if (booking.status !== 'selected') {
        return {
          available: false,
          reason: `Booking must be in 'selected' status. Current status: ${booking.status}`
        };
      }

      const existingTransaction = await TransactionService.getPaymeTransactionByBooking(bookingId);
      if (existingTransaction && existingTransaction.state === this.STATES.PAID) {
        return {
          available: false,
          reason: 'Booking already paid'
        };
      }

      const amount = booking.finalTotal || booking.totalPrice;
      if (!amount || amount <= 0) {
        return {
          available: false,
          reason: 'Invalid amount'
        };
      }

      return {
        available: true,
        amount: amount,
        currency: 'UZS',
        amountInTiyin: amount * 100,
        bookingId: bookingId,
        userId: user.id
      };
      
    } catch (error) {
      console.error(`Error checking Payme payment availability for booking ${bookingId}:`, error);
      return {
        available: false,
        reason: 'Internal error'
      };
    }
  }

  /**
   * Get transaction history for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(bookingId) {
    try {
      const transactions = await TransactionService.getTransactionsByBooking(bookingId);
      return transactions.filter(t => t.provider === 'payme');
    } catch (error) {
      console.error(`Error getting Payme transaction history for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed payment status
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Detailed payment status
   */
  async getDetailedPaymentStatus(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      const transaction = await TransactionService.getPaymeTransactionByBooking(bookingId);
      
      if (!transaction) {
        return {
          bookingId: bookingId,
          status: 'no_payment_transaction',
          message: 'No payment transaction created',
          amount: booking.finalTotal || booking.totalPrice
        };
      }

      const stateNames = {
        [this.STATES.PENDING]: 'pending',
        [this.STATES.PAID]: 'paid',
        [this.STATES.PENDING_CANCELED]: 'pending_canceled',
        [this.STATES.PAID_CANCELED]: 'paid_canceled'
      };

      return {
        bookingId: bookingId,
        transactionId: transaction.providerTransactionId,
        status: stateNames[transaction.state] || 'unknown',
        state: transaction.state,
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createDate,
        updatedAt: transaction.updatedAt
      };
      
    } catch (error) {
      console.error(`Error getting detailed Payme payment status for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a payment transaction
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPaymentTransaction(bookingId, reason = 'User cancellation') {
    try {
      const transaction = await TransactionService.getPaymeTransactionByBooking(bookingId);
      
      if (!transaction) {
        return {
          success: true,
          message: 'No transaction to cancel'
        };
      }

      const newState = transaction.state === this.STATES.PAID 
        ? this.STATES.PAID_CANCELED 
        : this.STATES.PENDING_CANCELED;

      await TransactionService.updateTransactionState(
        transaction.providerTransactionId, 
        newState,
        { canceledAt: new Date(), cancelReason: reason }
      );

      return {
        success: true,
        transactionId: transaction.providerTransactionId,
        previousState: transaction.state,
        newState: newState,
        message: 'Transaction canceled successfully'
      };
      
    } catch (error) {
      console.error(`Error canceling Payme payment for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Utility methods for state checking
   */
  isPending(state) {
    return state === this.STATES.PENDING;
  }

  isPaid(state) {
    return state === this.STATES.PAID;
  }

  isCanceled(state) {
    return state === this.STATES.PENDING_CANCELED || state === this.STATES.PAID_CANCELED;
  }

  /**
   * Health check method
   * @returns {Promise<Object>} Service health status
   */
  async healthCheck() {
    try {
      const availability = await this.checkPaymentAvailability('999999');
      
      return {
        service: 'EnhancedPaymeService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          paymentAvailabilityCheck: !!availability,
          transactionService: 'connected'
        }
      };
    } catch (error) {
      return {
        service: 'EnhancedPaymeService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = EnhancedPaymeService;
