/**
 * Improved Invoice-Based Payment Polling Service
 * This service fixes the payment polling issue by using the correct Click.uz APIs
 */

const axios = require('axios');
const crypto = require('crypto');
const { Booking } = require('../models');
const logger = require('../utils/logger');

class ImprovedPaymentPollingService {
  constructor() {
    this.serviceId = process.env.CLICK_SERVICE_ID;
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
    this.secretKey = process.env.CLICK_SECRET_KEY;
    this.baseUrl = 'https://api.click.uz/v2/merchant';
  }

  /**
   * Generate authentication header for Click.uz API
   */
  generateAuthHeader() {
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = crypto
      .createHash('sha1')
      .update(timestamp + this.secretKey)
      .digest('hex');
    
    return {
      Auth: `${this.merchantUserId}:${digest}:${timestamp}`
    };
  }

  /**
   * Check invoice status using the correct Click.uz API
   * GET /v2/merchant/invoice/status/:service_id/:invoice_id
   */
  async checkInvoiceStatus(invoiceId) {
    try {
      const authHeader = this.generateAuthHeader();
      const url = `${this.baseUrl}/invoice/status/${this.serviceId}/${invoiceId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Auth': authHeader.Auth
        },
        timeout: 30000
      });
      
      const data = response.data;
      
      // Handle the actual response format from Click.uz
      const isPaid = data.status === 2 && data.payment_id;
      
      return {
        success: true,
        isPaid,
        paymentId: data.payment_id,
        invoiceStatus: data.status,
        statusNote: data.status_note,
        errorCode: data.error_code,
        errorNote: data.error_note,
        rawData: data
      };
      
    } catch (error) {
      logger.error('Invoice status check failed:', error.message);
      
      if (error.response && error.response.data) {
        return {
          success: false,
          isPaid: false,
          errorCode: error.response.data.error_code || -1,
          errorNote: error.response.data.error_note || error.message,
          rawData: error.response.data
        };
      }
      
      return {
        success: false,
        isPaid: false,
        errorCode: -1,
        errorNote: error.message
      };
    }
  }

  /**
   * Update booking with payment information
   */
  async updateBookingWithPayment(bookingId, paymentData) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }
      
      // Update booking with payment information
      await booking.update({
        click_payment_id: paymentData.paymentId,
        paid_at: new Date(),
        status: 'approved' // Move to approved status
      });
      
      logger.info(`Booking ${bookingId} updated with payment ID: ${paymentData.paymentId}`);
      
      return {
        success: true,
        booking,
        message: 'Booking updated successfully'
      };
      
    } catch (error) {
      logger.error(`Failed to update booking ${bookingId}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check and process payment for a single booking
   */
  async checkAndProcessPayment(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }
      
      // Skip if already paid
      if (booking.status === 'approved' && booking.paid_at) {
        return {
          success: true,
          isPaid: true,
          alreadyProcessed: true,
          message: 'Booking already paid and approved'
        };
      }
      
      // Skip if no invoice ID
      if (!booking.click_invoice_id) {
        return {
          success: false,
          error: 'No invoice ID found for booking'
        };
      }
      
      // Check invoice status
      const invoiceResult = await this.checkInvoiceStatus(booking.click_invoice_id);
      
      if (!invoiceResult.success) {
        return {
          success: false,
          error: `Invoice check failed: ${invoiceResult.errorNote}`,
          errorCode: invoiceResult.errorCode
        };
      }
      
      if (invoiceResult.isPaid) {
        // Payment found! Update the booking
        const updateResult = await this.updateBookingWithPayment(bookingId, invoiceResult);
        
        if (updateResult.success) {
          return {
            success: true,
            isPaid: true,
            paymentId: invoiceResult.paymentId,
            message: 'Payment found and booking updated',
            booking: updateResult.booking
          };
        } else {
          return {
            success: false,
            error: `Payment found but booking update failed: ${updateResult.error}`,
            paymentId: invoiceResult.paymentId
          };
        }
      } else {
        return {
          success: true,
          isPaid: false,
          message: `Invoice status: ${invoiceResult.statusNote || 'Not paid'}`,
          invoiceStatus: invoiceResult.invoiceStatus
        };
      }
      
    } catch (error) {
      logger.error(`Payment check failed for booking ${bookingId}:`, error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Poll payments for all pending bookings
   */
  async pollPendingPayments() {
    try {
      // Find all bookings that have invoice IDs but are not paid yet
      const pendingBookings = await Booking.findAll({
        where: {
          status: 'selected',
          click_invoice_id: { [require('sequelize').Op.ne]: null },
          paid_at: null
        }
      });
      
      logger.info(`Found ${pendingBookings.length} pending payment bookings`);
      
      const results = [];
      
      for (const booking of pendingBookings) {
        const result = await this.checkAndProcessPayment(booking.id);
        results.push({
          bookingId: booking.id,
          uniqueRequestId: booking.uniqueRequestId,
          ...result
        });
        
        // Small delay between checks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const paidCount = results.filter(r => r.success && r.isPaid).length;
      const errorCount = results.filter(r => !r.success).length;
      
      logger.info(`Payment polling completed: ${paidCount} payments processed, ${errorCount} errors`);
      
      return {
        success: true,
        totalChecked: results.length,
        paymentsFound: paidCount,
        errors: errorCount,
        results
      };
      
    } catch (error) {
      logger.error('Payment polling failed:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      // Test with a non-existent invoice ID to check API connectivity
      const testResult = await this.checkInvoiceStatus('999999999');
      
      // If we get error code -16 (not found), that means API is working
      const isHealthy = testResult.errorCode === -16 || testResult.success;
      
      return {
        success: isHealthy,
        message: isHealthy ? 'Service healthy' : 'Service unhealthy',
        apiConnectivity: isHealthy,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = ImprovedPaymentPollingService;
