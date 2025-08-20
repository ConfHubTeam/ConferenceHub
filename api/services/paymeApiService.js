/**
 * Payme API Service
 * Low-level service for direct Payme JSON-RPC API communication
 * Handles authentication, request formatting, and error handling
 * Follows the official Payme merchant API documentation
 */
class PaymeApiService {
  constructor(merchantId, secretKey, baseUrl = 'https://merchant.paycom.uz', isTestMode = false, options = {}) {
    this.merchantId = merchantId;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.isTestMode = isTestMode;
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.authHeader = this.generateAuthHeader();
  }

  /**
   * Generate Basic Auth header for Payme API
   * Uses test_key for sandbox, key for production
   * @returns {string} Authorization header
   */
  generateAuthHeader() {
    const credentials = `${this.merchantId}:${this.secretKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Generate unique request ID for RPC calls
   * @returns {number} Unique request ID
   */
  generateRequestId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Make JSON-RPC request to Payme API
   * @param {Object} requestData - RPC request data
   * @returns {Promise<Object>} API response
   */
  async makeRpcRequest(requestData) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Add JSON-RPC 2.0 specification field
    const rpcRequest = {
      jsonrpc: "2.0",
      ...requestData
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(rpcRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      // Handle HTML responses from sandbox (common in test environment)
      if (contentType && contentType.includes('text/html')) {
        return {
          error: {
            code: -32700,
            message: "Sandbox returned HTML response",
            data: responseText.substring(0, 500)
          }
        };
      }

      // Try to parse as JSON
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        return {
          error: {
            code: -32700,
            message: "Invalid JSON response",
            data: responseText.substring(0, 500)
          }
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Format phone number for Payme (remove country code and special characters)
   * @param {string} phone - Raw phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneForPayme(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Remove country code if present (998 for Uzbekistan)
    if (cleaned.startsWith('998') && cleaned.length === 12) {
      return cleaned.slice(3);
    }
    
    return cleaned;
  }

  /**
   * Convert UZS to tiyin (Payme's base unit)
   * @param {number} uzs - Amount in UZS
   * @returns {number} Amount in tiyin
   */
  convertToTiyin(uzs) {
    return Math.floor(uzs * 100);
  }

  /**
   * Create account object for Payme API
   * @param {Object} booking - Booking object
   * @param {Object} user - User object
   * @returns {Object} Account object for Payme
   */
  createAccountObject(booking, user) {
    return {
      booking_id: booking.id.toString(),
      phone: this.formatPhoneForPayme(user.phoneNumber || user.clickPhoneNumber || '998901234567')
    };
  }

  /**
   * Check if transaction can be performed
   * @param {number} amount - Amount in tiyin
   * @param {Object} account - Account object
   * @returns {Promise<Object>} Check result
   */
  async checkPerformTransaction(amount, account) {
    const request = {
      method: 'CheckPerformTransaction',
      params: { amount, account },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  /**
   * Create transaction in Payme
   * @param {string} transactionId - Unique transaction ID
   * @param {number} amount - Amount in tiyin
   * @param {Object} account - Account object
   * @returns {Promise<Object>} Create result
   */
  async createTransaction(transactionId, amount, account) {
    const request = {
      method: 'CreateTransaction',
      params: {
        id: transactionId,
        time: Date.now(),
        amount,
        account
      },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  /**
   * Check transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Status result
   */
  async checkTransaction(transactionId) {
    const request = {
      method: 'CheckTransaction',
      params: { id: transactionId },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  /**
   * Perform (confirm) transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Perform result
   */
  async performTransaction(transactionId) {
    const request = {
      method: 'PerformTransaction',
      params: { id: transactionId },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  /**
   * Cancel transaction
   * @param {string} transactionId - Transaction ID
   * @param {number} reason - Cancellation reason
   * @returns {Promise<Object>} Cancel result
   */
  async cancelTransaction(transactionId, reason = 1) {
    const request = {
      method: 'CancelTransaction',
      params: { id: transactionId, reason },
      id: this.generateRequestId()
    };
    return this.makeRpcRequest(request);
  }

  /**
   * Generate checkout URL for Payme
   * @param {string} transactionId - Transaction ID
   * @param {string} returnUrl - Return URL after payment
   * @returns {string} Checkout URL
   */
  generateCheckoutUrl(transactionId, returnUrl) {
    const paymentData = {
      merchant: this.merchantId,
      transaction: transactionId,
      return_url: returnUrl
    };
    
    const encoded = Buffer.from(JSON.stringify(paymentData)).toString('base64');
    return `https://checkout.paycom.uz/${encoded}`;
  }

  /**
   * Validate webhook request authentication
   * @param {string} authHeader - Authorization header from webhook
   * @returns {boolean} Is valid
   */
  validateWebhookAuth(authHeader) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }
    
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [merchantId, secretKey] = credentials.split(':');
      
      return merchantId === this.merchantId && secretKey === this.secretKey;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      merchantId: this.merchantId,
      baseUrl: this.baseUrl,
      isTestMode: this.isTestMode,
      timeout: this.timeout
    };
  }
}

module.exports = PaymeApiService;
