const crypto = require('crypto');
const { PaymeTransactionError } = require('../middleware/errorHandler');
const { PaymeError } = require('../enum/transaction.enum');

/**
 * Payme Merchant API Service
 * Creates Payme payment forms and handles payment initialization
 * Note: CreateTransaction, PerformTransaction etc. are WEBHOOK methods that Payme calls to OUR server
 */
class PaymeMerchantApiService {
  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID;
    this.testKey = process.env.PAYME_TEST_KEY;
    this.prodKey = process.env.PAYME_KEY;
    this.isTestMode = process.env.NODE_ENV !== 'production';
    
    // Correct endpoints for payment initialization
    this.checkoutUrl = this.isTestMode 
      ? 'https://test.paycom.uz' 
      : 'https://checkout.paycom.uz';
    
    if (!this.merchantId) {
      throw new Error('PAYME_MERCHANT_ID is required');
    }
    
    if (!this.testKey && !this.prodKey) {
      throw new Error('PAYME_TEST_KEY or PAYME_KEY is required');
    }
  }

  /**
   * Get the appropriate API key based on environment
   */
  getApiKey() {
    return this.isTestMode ? this.testKey : this.prodKey;
  }

  /**
   * Create payment checkout URL for Payme
   * This creates a URL that redirects users to Payme's payment form
   */
  async createTransaction(params) {
    const { bookingId, amount, phoneNumber, returnUrl } = params;
    
    if (!bookingId || !amount || !phoneNumber) {
      throw new Error('Missing required parameters: bookingId, amount, phoneNumber');
    }

    try {
      // Generate checkout form data
      const formData = {
        merchant: this.merchantId,
        amount: Math.floor(amount * 100), // Convert UZS to tiyin
        account: {
          phone: phoneNumber.replace(/[^\d]/g, ''), // Clean phone number
          booking_id: bookingId.toString()
        },
        lang: 'ru', // Default language
        callback: returnUrl || `${process.env.CLIENT_URL}/booking/${bookingId}/payment-result`,
        callback_timeout: 15000, // 15 seconds
        description: `Payment for booking #${bookingId}`
      };

      // For testing, log the form data
      console.log('� Payme Payment Form Data:', {
        merchant: this.merchantId,
        amount: formData.amount,
        account: formData.account,
        checkoutUrl: this.checkoutUrl
      });

      return {
        success: true,
        checkoutUrl: this.checkoutUrl,
        formData: formData,
        transactionId: `booking-${bookingId}-${Date.now()}`, // Generate a reference ID
        amount: amount
      };

    } catch (error) {
      console.error('❌ Payme payment form creation error:', error);
      throw new Error(`Failed to create Payme payment form: ${error.message}`);
    }
  }

  /**
   * Generate transaction ID for Payme
   */
  generateTransactionId(bookingId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `booking-${bookingId}-${timestamp}-${random}`;
  }

  /**
   * Create transaction using Payme Merchant API
   */
  async createTransaction(params) {
    const { bookingId, amount, phoneNumber, transactionId } = params;
    
    if (!bookingId || !amount || !phoneNumber) {
      throw new Error('Missing required parameters: bookingId, amount, phoneNumber');
    }

    // For creating transactions, we use the JSON-RPC merchant API
    const payload = {
      jsonrpc: "2.0",
      method: 'CreateTransaction',
      params: {
        id: transactionId || this.generateTransactionId(bookingId),
        time: Date.now(),
        amount: Math.floor(amount * 100), // Convert UZS to tiyin
        account: {
          phone: phoneNumber.replace(/[^\d]/g, ''), // Remove all non-digit characters
          booking_id: bookingId.toString()
        }
      },
      id: Math.floor(Math.random() * 1000000)
    };

    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('🔍 Payme API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 500) // Log first 500 chars
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse Payme API response:', parseError);
        throw new Error(`Invalid JSON response from Payme API: ${responseText.substring(0, 200)}`);
      }
      
      if (data.error) {
        throw new PaymeTransactionError(
          data.error.code || PaymeError.TransactionNotFound,
          payload.params.id,
          data.error.message || 'Transaction creation failed'
        );
      }

      return {
        success: true,
        transactionId: payload.params.id,
        result: data.result,
        createTime: data.result?.create_time || Date.now()
      };

    } catch (error) {
      console.error('Payme API Error:', error);
      
      if (error.isTransactionError) {
        throw error;
      }
      
      throw new Error(`Failed to create Payme transaction: ${error.message}`);
    }
  }

  /**
   * Check transaction status using Payme Merchant API
   */
  async checkTransaction(transactionId) {
    const payload = {
      jsonrpc: "2.0",
      method: 'CheckTransaction',
      params: {
        id: transactionId
      },
      id: Math.floor(Math.random() * 1000000)
    };

    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('🔍 Payme CheckTransaction Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500)
      });

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse CheckTransaction response:', parseError);
        throw new Error(`Invalid JSON response from Payme API: ${responseText.substring(0, 200)}`);
      }
      
      if (data.error) {
        console.log('❌ Payme CheckTransaction error:', data.error);
        throw new PaymeTransactionError(
          data.error.code || PaymeError.TransactionNotFound,
          transactionId,
          data.error.message || 'Transaction check failed'
        );
      }

      return {
        success: true,
        result: data.result,
        state: data.result?.state || 0,
        createTime: data.result?.create_time,
        performTime: data.result?.perform_time,
        cancelTime: data.result?.cancel_time
      };

    } catch (error) {
      console.error('Payme Check Transaction Error:', error);
      
      if (error.isTransactionError) {
        throw error;
      }
      
      throw new Error(`Failed to check Payme transaction: ${error.message}`);
    }
  }

  /**
   * Validate phone number for Payme (Uzbekistan format)
   */
  validatePaymePhone(phoneNumber) {
    if (!phoneNumber) {
      return { valid: false, message: 'Phone number is required' };
    }

    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    // Check for Uzbekistan mobile number patterns
    // 998 country code + 9X (operator codes: 90, 91, 93, 94, 95, 97, 98, 99)
    const uzMobilePattern = /^998(90|91|93|94|95|97|98|99)\d{7}$/;
    
    if (!uzMobilePattern.test(cleanPhone)) {
      return { 
        valid: false, 
        message: 'Please enter a valid Uzbekistan mobile number (e.g., +998 90 123 45 67)' 
      };
    }

    return { valid: true, cleanPhone };
  }

  /**
   * Format phone number for Payme API
   */
  formatPhoneForPayme(phoneNumber) {
    const validation = this.validatePaymePhone(phoneNumber);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    // Return phone without country code (just 9 digits)
    return validation.cleanPhone.substring(3); // Remove '998' prefix
  }

  /**
   * Convert UZS amount to tiyin (Payme's base unit)
   */
  convertToTiyin(amountUzs) {
    return Math.floor(amountUzs * 100);
  }

  /**
   * Convert tiyin to UZS
   */
  convertToUzs(amountTiyin) {
    return Math.floor(amountTiyin / 100);
  }

  /**
   * Get human-readable transaction state
   */
  getTransactionStateText(state) {
    switch (state) {
      case 1:
        return 'Pending';
      case 2:
        return 'Paid';
      case -1:
        return 'Cancelled (Pending)';
      case -2:
        return 'Cancelled (Paid)';
      default:
        return 'Unknown';
    }
  }
}

module.exports = PaymeMerchantApiService;
