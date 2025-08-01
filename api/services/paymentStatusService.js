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

      // Check payment status via Click Merchant API
      const paymentResult = await this.clickMerchantApi.checkPaymentStatusByMerchantTransId(
        booking.uniqueRequestId
      );

      if (paymentResult.success && paymentResult.isPaid) {
        // Payment confirmed - update booking
        await this._updateBookingAsPaid(booking, paymentResult);
        
        return {
          success: true,
          isPaid: true,
          paymentId: paymentResult.paymentId,
          bookingStatus: 'approved',
          message: 'Payment confirmed and booking approved'
        };
      } else {
        // Payment not found or not completed
        return {
          success: true,
          isPaid: false,
          bookingStatus: booking.status,
          message: 'Payment not completed yet',
          error: paymentResult.error
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
