const axios = require('axios');
const crypto = require('crypto');

/**
 * Click.uz Merchant API Service for checking payment status
 * This allows us to pull payment status instead of relying on webhooks
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
   * Check payment status by merchant transaction ID
   * @param {string} merchantTransId - Your booking reference (e.g., REQ-MDEKEZCM-PL1R2)
   * @param {string} paymentDate - Payment date in YYYY-MM-DD format (optional, defaults to today)
   * @returns {Promise<Object>} Payment status response
   */
  async checkPaymentStatusByMerchantTransId(merchantTransId, paymentDate = null) {
    try {
      if (!paymentDate) {
        // Default to today's date
        paymentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      }

      const url = `${this.apiUrl}/payment/status_by_mti/${this.serviceId}/${merchantTransId}/${paymentDate}`;
      
      console.log(`🔍 Checking Click.uz payment status for: ${merchantTransId} on ${paymentDate}`);
      
      const response = await axios.get(url, {
        headers: this.generateAuthHeader(),
        timeout: 15000
      });

      console.log('✅ Click.uz API response:', response.data);

      return {
        success: response.data.error_code === 0,
        data: response.data,
        isPaid: response.data.payment_status === 1, // 1 = successful payment
        paymentId: response.data.payment_id,
        merchantTransId: response.data.merchant_trans_id,
        errorCode: response.data.error_code,
        errorNote: response.data.error_note
      };

    } catch (error) {
      console.error('❌ Click.uz API error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        isPaid: false
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
   * Check invoice status by invoice ID
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

      return {
        success: response.data.error_code === 0,
        data: response.data,
        invoiceStatus: response.data.invoice_status,
        invoiceStatusNote: response.data.invoice_status_note,
        errorCode: response.data.error_code,
        errorNote: response.data.error_note
      };

    } catch (error) {
      console.error('❌ Click.uz invoice status error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        invoiceStatus: null
      };
    }
  }

  /**
   * Check payment status by Click payment ID
   * @param {string} paymentId - Click payment ID
   * @returns {Promise<Object>} Payment status response
   */
  async checkPaymentStatusByPaymentId(paymentId) {
    try {
      const url = `${this.apiUrl}/payment/status/${this.serviceId}/${paymentId}`;
      
      console.log(`🔍 Checking Click.uz payment status for payment ID: ${paymentId}`);
      
      const response = await axios.get(url, {
        headers: this.generateAuthHeader(),
        timeout: 15000
      });

      console.log('✅ Click.uz API response:', response.data);

      return {
        success: response.data.error_code === 0,
        data: response.data,
        isPaid: response.data.payment_status === 1,
        paymentId: response.data.payment_id,
        paymentStatus: response.data.payment_status,
        errorCode: response.data.error_code,
        errorNote: response.data.error_note
      };

    } catch (error) {
      console.error('❌ Click.uz API error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        isPaid: false
      };
    }
  }

  /**
   * Check payment status for multiple dates (helpful if unsure of payment date)
   * @param {string} merchantTransId - Your booking reference
   * @param {number} daysBack - Number of days to check back (default: 3)
   * @returns {Promise<Object>} Payment status response
   */
  async checkPaymentStatusMultipleDates(merchantTransId, daysBack = 3) {
    console.log(`🔍 Checking payment status for ${merchantTransId} across ${daysBack} days`);
    
    for (let i = 0; i <= daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const paymentDate = date.toISOString().split('T')[0];
      
      const result = await this.checkPaymentStatusByMerchantTransId(merchantTransId, paymentDate);
      
      if (result.success && result.isPaid) {
        console.log(`✅ Found payment on ${paymentDate}:`, result.data);
        return result;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      success: false,
      isPaid: false,
      error: `No successful payment found for ${merchantTransId} in the last ${daysBack} days`
    };
  }
}

module.exports = ClickMerchantApiService;
