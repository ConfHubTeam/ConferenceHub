const ClickMerchantApiService = require('./clickMerchantApiService');
const { Booking } = require('../models');

/**
 * Payment Status Service
 * Handles payment verification and booking status updates
 * Follows Single Responsibility Principle - only handles payment status logic
 */
class PaymentStatusService {
  constructor() {
    this.clickMerchantApi = new ClickMerchantApiService();
  }

  /**
   * Verify payment for a booking and update status if paid
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
          bookingStatus: booking.status
        };
      }

      // Use simplified payment check (invoice status only)
      const paymentResult = await this.clickMerchantApi.checkPaymentStatus(booking);

      if (paymentResult.success && paymentResult.isPaid) {
        // Payment confirmed - update booking
        await this._updateBookingAsPaid(booking, paymentResult);
        
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
          message: 'Payment status could not be determined',
          error: paymentResult.error || 'Unknown error'
        };
      }

    } catch (error) {
      console.error(`❌ Error verifying payment for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
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
   */
  async _updateBookingAsPaid(booking, paymentResult) {
    await booking.update({
      status: 'approved',
      clickPaymentId: paymentResult.paymentId,
      paidAt: new Date(),
      approvedAt: new Date(),
      paymentResponse: paymentResult.data
    });

    console.log(`✅ Booking ${booking.id} marked as approved - Payment ID: ${paymentResult.paymentId}`);
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
