const ClickMerchantApiService = require('./clickMerchantApiService');
const { Booking } = require('../models');

/**
 * Optimized Payment Polling Service
 * Based on actual Click.uz API behavior analysis
 */
class OptimizedPaymentPoller {
  constructor() {
    this.clickApi = new ClickMerchantApiService();
    
    // Smart polling intervals based on payment window timing
    this.POLLING_STRATEGY = {
      IMMEDIATE: 10000,     // 10 seconds - first few checks
      NORMAL: 30000,        // 30 seconds - normal frequency  
      SLOW: 60000,          // 1 minute - after several failures
      FINAL: 120000         // 2 minutes - near timeout
    };
    
    // Maximum polling attempts before giving up
    this.MAX_ATTEMPTS = 15; // Total ~12 minutes with backoff
    
    // Click.uz specific error codes
    this.CLICK_ERROR_CODES = {
      NOT_FOUND: -16,       // "Платёж с указанными параметрами не найден"
      AUTH_FAILED: -15,     // Authentication failed
      INVALID_PARAMS: -1    // Invalid parameters
    };
  }

  /**
   * Smart payment status checking with adaptive intervals
   * @param {string} bookingId - Booking ID to check
   * @param {Object} options - Polling options
   * @returns {Promise<Object>} Payment verification result
   */
  async smartCheckPaymentStatus(bookingId, options = {}) {
    const {
      maxAttempts = this.MAX_ATTEMPTS,
      onProgress = null,
      immediate = false
    } = options;

    let attempts = 0;
    let consecutiveNotFound = 0;
    
    console.log(`🔍 Starting smart payment polling for booking ${bookingId}`);
    
    return new Promise((resolve) => {
      const checkPayment = async () => {
        attempts++;
        
        try {
          const booking = await Booking.findByPk(bookingId);
          if (!booking) {
            resolve({ success: false, error: 'Booking not found' });
            return;
          }

          // Check if already paid (early exit)
          if (booking.status === 'approved' && booking.paidAt) {
            console.log(`✅ Booking ${bookingId} already approved`);
            resolve({
              success: true,
              isPaid: true,
              alreadyProcessed: true,
              bookingStatus: 'approved'
            });
            return;
          }

          // Make API call with multiple date strategy
          const paymentResult = await this._checkPaymentWithMultipleDates(
            booking.uniqueRequestId,
            booking.clickInvoiceCreatedAt
          );

          // Handle successful payment
          if (paymentResult.success && paymentResult.isPaid) {
            console.log(`💰 Payment found for booking ${bookingId}!`);
            
            // Update booking status
            await booking.update({
              status: 'approved',
              clickPaymentId: paymentResult.paymentId,
              paidAt: new Date(),
              approvedAt: new Date(),
              paymentResponse: paymentResult.data
            });

            resolve({
              success: true,
              isPaid: true,
              paymentId: paymentResult.paymentId,
              bookingStatus: 'approved',
              attempts: attempts
            });
            return;
          }

          // Handle "not found" responses (expected for unpaid)
          if (paymentResult.errorCode === this.CLICK_ERROR_CODES.NOT_FOUND) {
            consecutiveNotFound++;
            console.log(`📝 Attempt ${attempts}: Payment not found (expected for unpaid)`);
          } else if (!paymentResult.success) {
            console.log(`❌ Attempt ${attempts}: API error:`, paymentResult.error);
          }

          // Report progress
          if (onProgress) {
            onProgress({ attempts, maxAttempts, consecutiveNotFound });
          }

          // Check if we should continue polling
          if (attempts >= maxAttempts) {
            console.log(`⏰ Polling timeout after ${attempts} attempts`);
            resolve({
              success: true,
              isPaid: false,
              bookingStatus: booking.status,
              attempts: attempts,
              message: 'Polling timeout - payment not detected'
            });
            return;
          }

          // Schedule next check with smart interval
          const nextInterval = this._getNextInterval(attempts, consecutiveNotFound);
          console.log(`⏳ Next check in ${nextInterval/1000}s (attempt ${attempts + 1}/${maxAttempts})`);
          
          setTimeout(checkPayment, nextInterval);

        } catch (error) {
          console.error(`💥 Polling error attempt ${attempts}:`, error);
          
          // Don't give up on single errors, just wait longer
          if (attempts < maxAttempts) {
            setTimeout(checkPayment, this.POLLING_STRATEGY.SLOW);
          } else {
            resolve({
              success: false,
              error: error.message,
              attempts: attempts
            });
          }
        }
      };

      // Start immediately or after short delay
      if (immediate) {
        checkPayment();
      } else {
        setTimeout(checkPayment, this.POLLING_STRATEGY.IMMEDIATE);
      }
    });
  }

  /**
   * Check payment status across multiple dates
   * Click.uz sometimes requires exact payment date
   */
  async _checkPaymentWithMultipleDates(merchantTransId, invoiceCreatedAt) {
    const datesToCheck = this._getPaymentDates(invoiceCreatedAt);
    
    for (const date of datesToCheck) {
      const result = await this.clickApi.checkPaymentStatusByMerchantTransId(
        merchantTransId, 
        date
      );
      
      if (result.success && result.isPaid) {
        console.log(`✅ Payment found on date: ${date}`);
        return result;
      }
      
      // If we get a different error than "not found", stop checking other dates
      if (!result.success && result.errorCode !== this.CLICK_ERROR_CODES.NOT_FOUND) {
        return result;
      }
      
      // Small delay between date checks
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Return the last result (usually "not found")
    return {
      success: false,
      isPaid: false,
      errorCode: this.CLICK_ERROR_CODES.NOT_FOUND,
      errorNote: 'Payment not found on any date'
    };
  }

  /**
   * Get adaptive polling interval based on attempt count and response pattern
   */
  _getNextInterval(attempts, consecutiveNotFound) {
    // First 3 attempts: check quickly (user just paid)
    if (attempts <= 3) {
      return this.POLLING_STRATEGY.IMMEDIATE;
    }
    
    // Next 5 attempts: normal frequency
    if (attempts <= 8) {
      return this.POLLING_STRATEGY.NORMAL;
    }
    
    // If many consecutive "not found" responses, slow down
    if (consecutiveNotFound >= 5) {
      return this.POLLING_STRATEGY.SLOW;
    }
    
    // Final attempts: slowest frequency
    return this.POLLING_STRATEGY.FINAL;
  }

  /**
   * Generate list of dates to check for payment
   * Click.uz requires exact payment date, so check invoice date ± 1 day
   */
  _getPaymentDates(invoiceCreatedAt) {
    const dates = [];
    const baseDate = invoiceCreatedAt ? new Date(invoiceCreatedAt) : new Date();
    
    // Today (most likely)
    dates.push(new Date().toISOString().split('T')[0]);
    
    // Invoice creation date (if different from today)
    const invoiceDate = baseDate.toISOString().split('T')[0];
    if (!dates.includes(invoiceDate)) {
      dates.push(invoiceDate);
    }
    
    // Yesterday (in case payment was made near midnight)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!dates.includes(yesterdayStr)) {
      dates.push(yesterdayStr);
    }
    
    return dates;
  }

  /**
   * Batch check multiple bookings with smart polling
   * @param {Array<string>} bookingIds - Array of booking IDs
   * @returns {Promise<Array>} Results for each booking
   */
  async batchSmartCheck(bookingIds) {
    console.log(`🔄 Starting batch payment check for ${bookingIds.length} bookings`);
    
    const results = [];
    
    for (const bookingId of bookingIds) {
      const result = await this.smartCheckPaymentStatus(bookingId, {
        maxAttempts: 3, // Fewer attempts for batch processing
        immediate: true
      });
      
      results.push({ bookingId, ...result });
      
      // Delay between bookings to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Health check for Click.uz API with smart error detection
   */
  async healthCheck() {
    try {
      // Test with a dummy transaction to check authentication
      const testResult = await this.clickApi.checkPaymentStatusByMerchantTransId(
        'HEALTH-CHECK-123',
        new Date().toISOString().split('T')[0]
      );
      
      if (testResult.errorCode === this.CLICK_ERROR_CODES.AUTH_FAILED) {
        return {
          success: false,
          status: 'authentication_failed',
          message: 'Click.uz API authentication failed'
        };
      }
      
      if (testResult.errorCode === this.CLICK_ERROR_CODES.NOT_FOUND) {
        return {
          success: true,
          status: 'healthy',
          message: 'Click.uz API is responding correctly'
        };
      }
      
      return {
        success: true,
        status: 'healthy',
        message: 'Click.uz API health check passed'
      };
      
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = OptimizedPaymentPoller;
