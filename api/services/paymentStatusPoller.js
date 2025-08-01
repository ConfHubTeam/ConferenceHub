const { Booking } = require('../models');
const ClickMerchantApiService = require('./clickMerchantApiService');
const EnhancedClickService = require('./enhancedClickService');
const { Op } = require('sequelize');

/**
 * Payment Status Polling Service
 * Provides background payment verification using Click.uz Merchant API
 */
class PaymentStatusPoller {
  
  /**
   * Poll Click.uz for payment status updates using Merchant API
   * Call this from your frontend after payment redirect
   */
  static async checkPaymentStatus(bookingId) {
    try {
      console.log(`🔍 Polling payment status for booking ${bookingId}`);
      
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Use Enhanced Click Service for consistent payment checking
      const enhancedClickService = new EnhancedClickService();
      const result = await enhancedClickService.processPaymentVerification(bookingId);

      if (result.success && result.isPaid) {
        console.log(`💰 Payment confirmed via Click.uz API for booking ${bookingId}`);
        return { 
          success: true, 
          status: 'approved', 
          isPaid: true,
          paymentId: result.paymentId,
          bookingStatus: result.bookingStatus
        };
      }

      console.log(`❌ No payment found for booking ${bookingId}`);
      return { 
        success: true, 
        status: booking.status, 
        isPaid: false 
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
  static async checkPendingPayments() {
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
   * Health check for Click.uz Merchant API
   */
  static async healthCheck() {
    try {
      const clickApi = new ClickMerchantApiService();
      const auth = await clickApi.authenticate();
      
      return {
        success: true,
        clickApiStatus: auth.success ? 'healthy' : 'authentication_failed',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        clickApiStatus: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = PaymentStatusPoller;
