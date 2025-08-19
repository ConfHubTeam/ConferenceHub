const ClickMerchantApiService = require('./clickMerchantApiService');
const TransactionService = require('./transactionService');
const { Booking } = require('../models');

/**
 * Payment Status Service
 * Handles payment verification and booking status updates for both Click and Payme
 * Follows Single Responsibility Principle - only handles payment status logic
 */
class PaymentStatusService {
  constructor() {
    this.clickMerchantApi = new ClickMerchantApiService();
  }

  /**
   * Verify payment for a booking and update status if paid
   * Supports both Click and Payme payment providers
   * @param {string} bookingId - The booking ID to check
   * @returns {Promise<Object>} Payment verification result
   */
  async verifyAndUpdatePaymentStatus(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Check if already paid
      if (booking.status === 'approved' && booking.paidAt) {
        return {
          success: true,
          isPaid: true,
          alreadyProcessed: true,
          message: 'Payment already confirmed',
          bookingStatus: booking.status,
          paymentId: booking.clickPaymentId || 'payme-payment'
        };
      }

      // Check for Payme payment first (since it updates directly via webhook)
      const paymeResult = await this._checkPaymePayment(booking);
      if (paymeResult.success && paymeResult.isPaid) {
        return paymeResult;
      }

      // Fallback to Click.uz payment check
      const clickResult = await this._checkClickPayment(booking);
      return clickResult;

    } catch (error) {
      console.error(`❌ Error verifying payment for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check Payme payment status for a booking
   * @param {Object} booking - Booking instance
   * @returns {Promise<Object>} Payme payment result
   * @private
   */
  async _checkPaymePayment(booking) {
    try {
      const paymeTransaction = await TransactionService.getPaymeTransactionByBooking(booking.id);
      
      if (!paymeTransaction) {
        return {
          success: true,
          isPaid: false,
          method: 'payme',
          message: 'No Payme transaction found',
          bookingStatus: booking.status
        };
      }

      // Check Payme transaction state
      switch (paymeTransaction.state) {
        case 2: // Paid
          // Update booking if not already updated
          if (booking.status !== 'approved' || !booking.paidAt) {
            await this._updateBookingAsPaymePaid(booking, paymeTransaction);
          }
          
          return {
            success: true,
            isPaid: true,
            paymentId: paymeTransaction.providerTransactionId,
            method: 'payme',
            bookingStatus: 'approved',
            message: 'Payment confirmed via Payme and booking approved'
          };
          
        case 1: // Pending
          return {
            success: true,
            isPaid: false,
            method: 'payme',
            message: 'Payme payment is pending',
            bookingStatus: booking.status
          };
          
        case -1: // Cancelled from pending
        case -2: // Cancelled after payment
          return {
            success: true,
            isPaid: false,
            method: 'payme',
            message: 'Payme payment was cancelled',
            bookingStatus: booking.status
          };
          
        default:
          return {
            success: true,
            isPaid: false,
            method: 'payme',
            message: `Unknown Payme transaction state: ${paymeTransaction.state}`,
            bookingStatus: booking.status
          };
      }

    } catch (error) {
      console.error(`❌ Error checking Payme payment for booking ${booking.id}:`, error);
      return {
        success: true,
        isPaid: false,
        method: 'payme',
        message: 'Error checking Payme payment',
        bookingStatus: booking.status
      };
    }
  }

  /**
   * Check Click.uz payment status for a booking
   * @param {Object} booking - Booking instance
   * @returns {Promise<Object>} Click payment result
   * @private
   */
  async _checkClickPayment(booking) {
    try {
      // Use simplified payment check (invoice status only)
      const paymentResult = await this.clickMerchantApi.checkPaymentStatus(booking);

      if (paymentResult.success && paymentResult.isPaid) {
        // Payment confirmed - update booking
        await this._updateBookingAsClickPaid(booking, paymentResult);
        
        return {
          success: true,
          isPaid: true,
          paymentId: paymentResult.paymentId,
          method: paymentResult.method,
          bookingStatus: 'approved',
          message: `Payment confirmed via ${paymentResult.method} and booking approved`
        };
      } else if (paymentResult.success && !paymentResult.isPaid) {
        // API call successful but payment not completed
        const statusMessage = this._getPaymentStatusMessage(paymentResult);
        
        return {
          success: true,
          isPaid: false,
          bookingStatus: booking.status,
          method: paymentResult.method,
          message: statusMessage,
          invoiceStatus: paymentResult.invoiceStatus,
          invoiceStatusNote: paymentResult.invoiceStatusNote
        };
      } else {
        // API call failed or payment not found
        return {
          success: true,
          isPaid: false,
          bookingStatus: booking.status,
          method: 'click',
          message: 'Payment status could not be determined',
          error: paymentResult.error || 'Unknown error'
        };
      }

    } catch (error) {
      console.error(`❌ Error checking Click payment for booking ${booking.id}:`, error);
      return {
        success: true,
        isPaid: false,
        bookingStatus: booking.status,
        method: 'click',
        message: 'Error checking Click payment'
      };
    }
  }

  /**
   * Update booking as paid via Payme (private method following encapsulation)
   * @param {Object} booking - Booking instance
   * @param {Object} paymeTransaction - Payme transaction from database
   * @private
   */
  async _updateBookingAsPaymePaid(booking, paymeTransaction) {
    const performDate = paymeTransaction.performDate || new Date();
    
    await booking.update({
      status: 'approved',
      paidAt: performDate,
      approvedAt: performDate,
      paymentResponse: {
        provider: 'payme',
        transaction_id: paymeTransaction.providerTransactionId,
        amount: paymeTransaction.amount,
        perform_time: performDate.getTime()
      }
    });

    console.log(`✅ Booking ${booking.id} marked as approved via Payme - Transaction ID: ${paymeTransaction.providerTransactionId}`);
  }

  /**
   * Update booking as paid via Click (private method following encapsulation)
   * @param {Object} booking - Booking instance
   * @param {Object} paymentResult - Payment result from Click API
   * @private
   */
  async _updateBookingAsClickPaid(booking, paymentResult) {
    await booking.update({
      status: 'approved',
      clickPaymentId: paymentResult.paymentId,
      paidAt: new Date(),
      approvedAt: new Date(),
      paymentResponse: paymentResult.data
    });

    console.log(`✅ Booking ${booking.id} marked as approved via Click - Payment ID: ${paymentResult.paymentId}`);
  }

  /**
   * Get user-friendly payment status message
   * @param {Object} paymentResult - Payment result from API
   * @returns {string} Status message
   * @private
   */
  _getPaymentStatusMessage(paymentResult) {
    if (paymentResult.method === 'invoice_status' && paymentResult.invoiceStatus !== undefined) {
      const status = paymentResult.invoiceStatus;
      
      switch (status) {
        case 0:
          return 'Invoice created - waiting for payment';
        case 1:
          return 'Payment is being processed';
        case 2:
          return 'Payment completed successfully';
        case 3:
          return 'Payment was cancelled';
        case 4:
          return 'Payment failed';
        case 5:
          return 'Payment expired';
        case -99:
          return 'Invoice was deleted';
        default:
          return `Unknown payment status: ${status}`;
      }
    }
    
    return 'Payment not completed yet';
  }

  /**
   * Update booking as paid (private method following encapsulation)
   * @param {Object} booking - Booking instance
   * @param {Object} paymentResult - Payment result from Click API
   * @private
   * @deprecated Use _updateBookingAsClickPaid instead
   */
  async _updateBookingAsPaid(booking, paymentResult) {
    return this._updateBookingAsClickPaid(booking, paymentResult);
  }

  /**
   * Check multiple bookings for payment updates
   * @param {Array<string>} bookingIds - Array of booking IDs to check
   * @returns {Promise<Array>} Array of payment verification results
   */
  async batchVerifyPayments(bookingIds) {
    const results = [];
    
    for (const bookingId of bookingIds) {
      const result = await this.verifyAndUpdatePaymentStatus(bookingId);
      results.push({ bookingId, ...result });
      
      // Small delay to avoid API rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Get payment summary for a booking
   * @param {string} bookingId - The booking ID
   * @returns {Promise<Object>} Payment summary
   */
  async getPaymentSummary(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      return {
        success: true,
        bookingId: booking.id,
        uniqueRequestId: booking.uniqueRequestId,
        status: booking.status,
        amount: booking.finalTotal || booking.totalPrice,
        clickInvoiceId: booking.clickInvoiceId,
        clickPaymentId: booking.clickPaymentId,
        paidAt: booking.paidAt,
        invoiceCreatedAt: booking.clickInvoiceCreatedAt
      };

    } catch (error) {
      console.error(`❌ Error getting payment summary for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentStatusService;
