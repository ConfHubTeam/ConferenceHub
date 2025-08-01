const ClickMerchantApiService = require('./clickMerchantApiService');
const PaymentStatusService = require('./paymentStatusService');
const { Booking } = require('../models');

/**
 * Enhanced Click Service
 * High-level service that orchestrates Click.uz payment operations
 * Follows Interface Segregation and Dependency Inversion principles
 */
class EnhancedClickService {
  constructor() {
    this.merchantApi = new ClickMerchantApiService();
    this.paymentStatusService = new PaymentStatusService();
  }

  /**
   * Create payment invoice for a booking
   * @param {Object} params - Payment parameters
   * @param {string} params.bookingId - Booking ID
   * @param {string} params.userPhone - User's phone number
   * @returns {Promise<Object>} Invoice creation result
   */
  async createPaymentInvoice({ bookingId, userPhone }) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Validate booking state
      if (booking.status !== 'selected') {
        throw new Error(`Booking must be in 'selected' status to create payment. Current status: ${booking.status}`);
      }

      // Check if invoice already exists
      if (booking.clickInvoiceId) {
        const amount = booking.finalTotal || booking.totalPrice;
        return {
          success: true,
          alreadyExists: true,
          invoiceId: booking.clickInvoiceId,
          amount: amount,
          paymentUrl: this._generatePaymentUrl(amount, booking.uniqueRequestId),
          merchantTransId: booking.uniqueRequestId,
          message: 'Invoice already exists for this booking'
        };
      }

      const amount = booking.finalTotal || booking.totalPrice;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid booking amount');
      }

      // Create invoice via Merchant API
      const invoiceResult = await this.merchantApi.createInvoice({
        amount: amount,
        phoneNumber: userPhone || '998000000000',
        merchantTransId: booking.uniqueRequestId
      });

      if (!invoiceResult.success) {
        throw new Error(`Failed to create invoice: ${invoiceResult.errorNote}`);
      }

      // Update booking with invoice information
      await booking.update({
        clickInvoiceId: invoiceResult.invoiceId,
        clickInvoiceCreatedAt: new Date()
      });

      return {
        success: true,
        invoiceId: invoiceResult.invoiceId,
        amount: amount,
        paymentUrl: this._generatePaymentUrl(amount, booking.uniqueRequestId),
        merchantTransId: booking.uniqueRequestId
      };

    } catch (error) {
      console.error(`❌ Error creating payment invoice for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process payment verification for a booking
   * @param {string} bookingId - Booking ID to verify payment for
   * @returns {Promise<Object>} Payment verification result
   */
  async processPaymentVerification(bookingId) {
    try {
      return await this.paymentStatusService.verifyAndUpdatePaymentStatus(bookingId);
    } catch (error) {
      console.error(`❌ Error processing payment verification for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive payment information for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Comprehensive payment information
   */
  async getPaymentInfo(bookingId) {
    try {
      const paymentSummary = await this.paymentStatusService.getPaymentSummary(bookingId);
      
      if (!paymentSummary.success) {
        return paymentSummary;
      }

      // If invoice exists, get its status
      let invoiceStatus = null;
      if (paymentSummary.clickInvoiceId) {
        const invoiceResult = await this.merchantApi.checkInvoiceStatus(paymentSummary.clickInvoiceId);
        if (invoiceResult.success) {
          invoiceStatus = {
            status: invoiceResult.invoiceStatus,
            statusNote: invoiceResult.invoiceStatusNote
          };
        }
      }

      return {
        success: true,
        paymentSummary,
        invoiceStatus,
        paymentUrl: paymentSummary.amount ? 
          this._generatePaymentUrl(paymentSummary.amount, paymentSummary.uniqueRequestId) : null
      };

    } catch (error) {
      console.error(`❌ Error getting payment info for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel payment invoice for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelPaymentInvoice(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Check if payment was already made
      if (booking.status === 'approved' && booking.paidAt) {
        throw new Error('Cannot cancel invoice - payment already completed');
      }

      // Clear invoice information
      await booking.update({
        clickInvoiceId: null,
        clickInvoiceCreatedAt: null
      });

      return {
        success: true,
        message: 'Payment invoice cancelled successfully'
      };

    } catch (error) {
      console.error(`❌ Error cancelling payment invoice for booking ${bookingId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate Click.uz payment URL
   * @param {number} amount - Payment amount
   * @param {string} merchantTransId - Merchant transaction ID
   * @returns {string} Payment URL
   * @private
   */
  _generatePaymentUrl(amount, merchantTransId) {
    const serviceId = process.env.CLICK_SERVICE_ID;
    const merchantId = process.env.CLICK_MERCHANT_ID;
    
    return `https://merchant.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${merchantTransId}`;
  }

  /**
   * Get detailed payment status with Click.uz status codes
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Detailed payment status with Click.uz codes
   */
  async getDetailedPaymentStatus(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        return {
          success: false,
          isPaid: false,
          errorCode: -1,
          errorNote: "Booking not found",
          message: "Booking not found"
        };
      }

      // If already paid, return success immediately
      if (booking.paidAt) {
        return {
          success: true,
          isPaid: true,
          paymentStatus: 2, // Click.uz successful status
          errorCode: 0,
          paymentId: booking.clickPaymentId,
          message: "Payment already confirmed"
        };
      }

      // If no invoice created, can't check
      if (!booking.clickInvoiceId) {
        return {
          success: false,
          isPaid: false,
          paymentStatus: null,
          errorCode: -1,
          errorNote: "No payment invoice found",
          message: "No payment invoice created"
        };
      }

      // Check payment status using merchant API
      const merchantTransId = booking.uniqueRequestId;
      const apiResult = await this.merchantApi.checkPaymentStatusByMerchantTransId(merchantTransId);

      if (apiResult.success && apiResult.data?.payment_id) {
        // Payment found and successful
        const paymentStatusResult = await this.paymentStatusService.verifyAndUpdatePaymentStatus(bookingId, apiResult.data);
        
        return {
          success: true,
          isPaid: paymentStatusResult.success,
          paymentStatus: 2, // Click.uz successful
          errorCode: 0,
          paymentId: apiResult.data.payment_id,
          message: paymentStatusResult.success ? "Payment confirmed" : "Payment verification failed"
        };
      } else {
        // Payment not found or failed
        const errorCode = apiResult.errorCode || -16;
        const errorNote = apiResult.errorNote || "Payment not found";
        
        return {
          success: true, // API call was successful
          isPaid: false,
          paymentStatus: errorCode === -16 ? null : 0, // null = not found, 0 = created but not paid
          errorCode: errorCode,
          errorNote: errorNote,
          message: errorNote
        };
      }

    } catch (error) {
      console.error("❌ Error getting detailed payment status:", error);
      
      return {
        success: false,
        isPaid: false,
        paymentStatus: null,
        errorCode: -1,
        errorNote: error.message,
        message: "Error checking payment status"
      };
    }
  }

  /**
   * Health check for Click services
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test merchant API connection
      const testResult = await this.merchantApi.checkPaymentStatusByPaymentId('999999999');
      
      return {
        success: true,
        merchantApiConnected: true,
        timestamp: new Date(),
        testResult: testResult.success !== undefined
      };

    } catch (error) {
      return {
        success: false,
        merchantApiConnected: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = EnhancedClickService;
