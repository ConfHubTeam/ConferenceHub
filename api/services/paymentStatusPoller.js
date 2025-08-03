const { Booking } = require('../models');
const PaymentStatusService = require('./paymentStatusService');
const { Op } = require('sequelize');

/**
 * Payment Status Polling Service
 * Provides background payment verification using the improved PaymentStatusService
 */
class PaymentStatusPoller {
  constructor() {
    this.paymentStatusService = new PaymentStatusService();
  }
  
  /**
   * Poll Click.uz for payment status updates using improved invoice status API
   * Call this from your frontend after payment redirect
   */
  async checkPaymentStatus(bookingId) {
    try {
      console.log(`🔍 Polling payment status for booking ${bookingId}`);
      
      const result = await this.paymentStatusService.verifyAndUpdatePaymentStatus(bookingId);

      if (result.success && result.isPaid) {
        console.log(`💰 Payment confirmed for booking ${bookingId}`);
        return { 
          success: true, 
          status: result.bookingStatus, 
          isPaid: true,
          paymentId: result.paymentId,
          method: result.method,
          message: result.message
        };
      }

      console.log(`📝 Payment check completed for booking ${bookingId}: ${result.message}`);
      return { 
        success: true, 
        status: result.bookingStatus, 
        isPaid: false,
        message: result.message
      };

    } catch (error) {
      console.error('Payment status polling error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for pending payments that might have been missed
   * Run this periodically as a cron job to catch missed payments
   */
  async checkPendingPayments() {
    try {
      console.log('🔄 Checking for pending payments...');
      
      // Find bookings that are still 'selected' but might have been paid
      const pendingBookings = await Booking.findAll({
        where: {
          status: 'selected',
          click_invoice_id: { [Op.not]: null }, // Only check bookings with invoices
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      let checkedCount = 0;
      let updatedCount = 0;

      for (const booking of pendingBookings) {
        const result = await this.checkPaymentStatus(booking.id);
        checkedCount++;
        
        if (result.success && result.isPaid) {
          updatedCount++;
          console.log(`✅ Updated booking ${booking.id} payment status`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Checked ${checkedCount} pending bookings, updated ${updatedCount} payments`);
      return { checkedCount, updatedCount };

    } catch (error) {
      console.error('Error checking pending payments:', error);
      return { error: error.message };
    }
  }

  /**
   * Health check for payment service
   */
  async healthCheck() {
    try {
      const summary = await this.paymentStatusService.getPaymentSummary('test');
      
      return {
        success: false, // Expected since 'test' booking doesn't exist
        paymentServiceStatus: 'healthy',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        paymentServiceStatus: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = PaymentStatusPoller;
