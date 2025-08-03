const PaymentStatusService = require('./paymentStatusService');
const { Booking } = require('../models');

/**
 * Optimized Payment Polling Service
 * Uses the improved PaymentStatusService with smart polling intervals
 */
class OptimizedPaymentPoller {
  constructor() {
    this.paymentStatusService = new PaymentStatusService();
    
    // Smart polling intervals based on payment window timing
    this.POLLING_STRATEGY = {
      IMMEDIATE: 10000,     // 10 seconds - first few checks
      NORMAL: 30000,        // 30 seconds - normal frequency  
      SLOW: 60000,          // 1 minute - after several failures
      FINAL: 120000         // 2 minutes - near timeout
    };
    
    // Maximum polling attempts before giving up
    this.MAX_ATTEMPTS = 15; // Total ~12 minutes with backoff
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
          // Use the improved PaymentStatusService
          const result = await this.paymentStatusService.verifyAndUpdatePaymentStatus(bookingId);

          // Handle successful payment
          if (result.success && result.isPaid) {
            console.log(`💰 Payment found for booking ${bookingId} via ${result.method}!`);
            
            resolve({
              success: true,
              isPaid: true,
              paymentId: result.paymentId,
              bookingStatus: result.bookingStatus,
              method: result.method,
              attempts: attempts,
              message: result.message
            });
            return;
          }

          // Handle payment not found (expected for unpaid)
          if (result.success && !result.isPaid) {
            consecutiveNotFound++;
            console.log(`📝 Attempt ${attempts}: ${result.message}`);
          } else if (!result.success) {
            console.log(`❌ Attempt ${attempts}: Service error:`, result.error);
          }

          // Report progress
          if (onProgress) {
            onProgress({ attempts, maxAttempts, consecutiveNotFound, message: result.message });
          }

          // Check if we should continue polling
          if (attempts >= maxAttempts) {
            console.log(`⏰ Polling timeout after ${attempts} attempts`);
            resolve({
              success: true,
              isPaid: false,
              bookingStatus: result.bookingStatus,
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
   * Health check for payment service
   */
  async healthCheck() {
    try {
      // Test the payment status service
      const summary = await this.paymentStatusService.getPaymentSummary('test');
      
      return {
        success: false, // Expected since 'test' booking doesn't exist
        status: 'healthy',
        message: 'Payment service is responding correctly'
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
