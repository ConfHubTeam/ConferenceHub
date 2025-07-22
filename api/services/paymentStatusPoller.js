const axios = require('axios');
const { Booking, Transaction } = require('../models');
const { TransactionState } = require('../enum/transaction.enum');
const ClickMerchantApiService = require('./clickMerchantApiService');
const { Op } = require('sequelize'); // Fix: import Op from sequelize directly

/**
 * Payment Status Polling Service
 * Fallback mechanism when webhooks fail due to geographic restrictions
 */
class PaymentStatusPoller {
  
  /**
   * Poll Click.uz for payment status updates using Merchant API
   * Call this from your frontend after payment redirect
   */
  static async checkPaymentStatus(bookingId, clickTransId = null) {
    try {
      console.log(`🔍 Polling payment status for booking ${bookingId}`);
      
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Use the new Click.uz Merchant API to check payment status
      const clickApi = new ClickMerchantApiService();
      
      // Check by merchant transaction ID (booking reference) - most reliable method
      const paymentStatus = await clickApi.checkPaymentStatusMultipleDates(
        booking.uniqueRequestId, // This is your merchant_trans_id
        3 // Check last 3 days
      );

      if (paymentStatus.success && paymentStatus.isPaid) {
        console.log(`💰 Payment confirmed via Click.uz API for booking ${bookingId}`);
        
        // Manually trigger the success flow
        await this._processSuccessfulPayment(booking, paymentStatus.data);
        return { success: true, status: 'approved', source: 'click_api' };
      }

      // If Click API didn't find payment, check our own transaction records
      const transaction = await Transaction.findOne({
        where: { 
          bookingId: bookingId,
          state: TransactionState.Paid 
        }
      });

      if (transaction) {
        // Payment was processed, ensure booking status is updated
        if (booking.status !== 'approved') {
          await booking.update({
            status: 'approved',
            paymentStatus: 'paid',
            approvedAt: new Date()
          });
          console.log(`✅ Updated booking ${bookingId} to approved status`);
        }
        return { success: true, status: 'approved', source: 'local_db' };
      }

      console.log(`❌ No payment found for booking ${bookingId}`);
      return { success: false, status: booking.status };

    } catch (error) {
      console.error('Payment status polling error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manually process successful payment when webhooks fail
   */
  static async _processSuccessfulPayment(booking, paymentData) {
    try {
      // Create or update transaction record using Click.uz payment data
      const [transaction] = await Transaction.findOrCreate({
        where: { 
          [Op.or]: [
            { clickTransId: paymentData.payment_id },
            { 
              bookingId: booking.id, 
              state: TransactionState.Paid 
            }
          ]
        },
        defaults: {
          bookingId: booking.id,
          userId: booking.userId,
          clickTransId: paymentData.payment_id,
          state: TransactionState.Paid,
          amount: booking.finalTotal || booking.totalPrice,
          performDate: new Date(),
          createDate: new Date()
        }
      });

      // Update transaction if it exists but not marked as paid
      if (transaction.state !== TransactionState.Paid) {
        await transaction.update({
          state: TransactionState.Paid,
          performDate: new Date(),
          clickTransId: paymentData.payment_id
        });
      }

      // Update booking status
      await booking.update({
        status: 'approved',
        paymentStatus: 'paid',
        approvedAt: new Date(),
        paymentResponse: {
          timestamp: new Date(),
          action: 'api_verification',
          click_response: paymentData,
          status: 'success',
          source: 'click_merchant_api'
        }
      });

      console.log(`💰 Manual payment verification successful for booking ${booking.id} via Click.uz API`);
      return true;

    } catch (error) {
      console.error('Error processing manual payment:', error);
      return false;
    }
  }

  /**
   * Check for pending payments that might have been missed
   * Run this periodically as a cron job
   */
  static async checkPendingPayments() {
    try {
      console.log('🔄 Checking for pending payments...');
      
      // Find bookings that are still 'selected' but might have been paid
      const pendingBookings = await Booking.findAll({
        where: {
          status: 'selected',
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      for (const booking of pendingBookings) {
        await this.checkPaymentStatus(booking.id);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Checked ${pendingBookings.length} pending bookings`);

    } catch (error) {
      console.error('Error checking pending payments:', error);
    }
  }
}

module.exports = PaymentStatusPoller;
