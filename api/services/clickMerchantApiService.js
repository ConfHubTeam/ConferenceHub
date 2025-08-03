const axios = require('axios');
const crypto = require('crypto');

/**
 * Click.uz Merchant API Service for Invoice Flow
 * Handles invoice creation and status checking using Click.uz Invoice API
 */

class ClickMerchantApiService {
  constructor() {
    this.apiUrl = 'https://api.click.uz/v2/merchant';
    this.serviceId = process.env.CLICK_SERVICE_ID;
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
    this.secretKey = process.env.CLICK_SECRET_KEY;
  }

  /**
   * Generate authentication header for Click.uz Merchant API
   * Format: "Auth: merchant_user_id:digest:timestamp"
   * digest = sha1(timestamp + secret_key)
   */
  generateAuthHeader() {
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
    const digest = crypto.createHash('sha1')
      .update(timestamp + this.secretKey)
      .digest('hex');
    
    return {
      'Auth': `${this.merchantUserId}:${digest}:${timestamp}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Main payment status check method for polling
   * Uses invoice status API to check if payment has been completed
   * @param {Object} booking - Booking object with invoice data
   * @param {string} booking.clickInvoiceId - Invoice ID from Click.uz
   * @returns {Promise<Object>} Payment status result
   */
  async checkPaymentStatus(booking) {
    console.log(`🔍 Checking payment status for booking: ${booking.id}`);
    
    if (!booking.clickInvoiceId) {
      return {
        success: false,
        isPaid: false,
        error: 'No invoice ID found for booking'
      };
    }

    // Check invoice status using the invoice ID
    console.log(`📄 Checking invoice status for ID: ${booking.clickInvoiceId}`);
    const invoiceResult = await this.checkInvoiceStatus(booking.clickInvoiceId);
    
    if (invoiceResult.success && invoiceResult.isPaid) {
      return {
        success: true,
        isPaid: true,
        paymentId: invoiceResult.paymentId,
        method: 'invoice_status',
        data: invoiceResult.data,
        invoiceStatus: invoiceResult.invoiceStatus,
        invoiceStatusNote: invoiceResult.invoiceStatusNote
      };
    } else if (invoiceResult.success) {
      // Invoice exists but not paid yet
      return {
        success: true,
        isPaid: false,
        method: 'invoice_status',
        data: invoiceResult.data,
        invoiceStatus: invoiceResult.invoiceStatus,
        invoiceStatusNote: invoiceResult.invoiceStatusNote,
        details: invoiceResult
      };
    } else {
      // Error checking invoice
      return {
        success: false,
        isPaid: false,
        error: invoiceResult.error,
        errorCode: invoiceResult.errorCode
      };
    }
  }

  /**
   * Create an invoice in Click.uz system
   * @param {Object} invoiceData - Invoice creation data
   * @param {number} invoiceData.amount - Amount in UZS
   * @param {string} invoiceData.phoneNumber - Customer phone number
   * @param {string} invoiceData.merchantTransId - Your transaction reference
   * @returns {Promise<Object>} Invoice creation response
   */
  async createInvoice({ amount, phoneNumber, merchantTransId }) {
    try {
      const url = `${this.apiUrl}/invoice/create`;
      
      const requestData = {
        service_id: parseInt(this.serviceId),
        amount: parseFloat(amount),
        phone_number: phoneNumber,
        merchant_trans_id: merchantTransId
      };

      console.log(`📄 Creating Click.uz invoice:`, {
        service_id: requestData.service_id,
        amount: requestData.amount,
        phone_number: requestData.phone_number,
        merchant_trans_id: requestData.merchant_trans_id
      });
      
      const response = await axios.post(url, requestData, {
        headers: this.generateAuthHeader(),
        timeout: 15000
      });

      console.log('✅ Click.uz invoice creation response:', response.data);

      return {
        success: response.data.error_code === 0,
        data: response.data,
        invoiceId: response.data.invoice_id,
        errorCode: response.data.error_code,
        errorNote: response.data.error_note
      };

    } catch (error) {
      console.error('❌ Click.uz invoice creation error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        invoiceId: null
      };
    }
  }

  /**
   * Check invoice status by invoice ID (Primary payment checking method)
   * @param {string} invoiceId - Click invoice ID
   * @returns {Promise<Object>} Invoice status response
   */
  async checkInvoiceStatus(invoiceId) {
    try {
      const url = `${this.apiUrl}/invoice/status/${this.serviceId}/${invoiceId}`;
      
      console.log(`📊 Checking Click.uz invoice status for ID: ${invoiceId}`);
      
      const response = await axios.get(url, {
        headers: this.generateAuthHeader(),
        timeout: 15000
      });

      console.log('✅ Click.uz invoice status response:', response.data);

      // Handle response format based on documentation
      const errorCode = response.data.error_code;
      const errorNote = response.data.error_note;
      
      // Status can be either 'invoice_status' or 'status' field
      const status = response.data.invoice_status ?? response.data.status;
      const statusNote = response.data.invoice_status_note ?? response.data.status_note ?? '';
      const paymentId = response.data.payment_id;

      // Determine if payment is successful based on documentation
      // Status codes: 0=Created, 1=Processing, 2=Payment successful, 3=Cancelled, 4=Failed, 5=Expired, -99=Deleted
      const isPaid = status === 2 && paymentId;
      const isSuccess = errorCode >= 0; // Negative error codes indicate API errors

      return {
        success: isSuccess,
        data: response.data,
        isPaid: isPaid,
        paymentId: paymentId,
        invoiceStatus: status,
        invoiceStatusNote: statusNote,
        errorCode: errorCode,
        errorNote: errorNote,
        // Additional helper properties for easier status checking
        isCreated: status === 0,
        isProcessing: status === 1,
        isSuccessful: status === 2,
        isCancelled: status === 3,
        isFailed: status === 4,
        isExpired: status === 5,
        isDeleted: status === -99
      };

    } catch (error) {
      console.error('❌ Click.uz invoice status error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        isPaid: false,
        invoiceStatus: null,
        paymentId: null,
        errorCode: error.response?.data?.error_code || null
      };
    }
  }
}

module.exports = ClickMerchantApiService;
