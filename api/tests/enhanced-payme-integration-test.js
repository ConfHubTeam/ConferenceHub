/**
 * Test Enhanced Payme Service Integration
 * Tests the new EnhancedPaymeService with unified TransactionService
 */

require('dotenv').config();
const path = require('path');

// Add the api directory to the require path
process.chdir(path.join(__dirname, '..'));

const EnhancedPaymeService = require('../services/enhancedPaymeService');
const { Booking, User } = require('../models');

class PaymeIntegrationTest {
  constructor() {
    this.enhancedPaymeService = new EnhancedPaymeService();
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Starting test: ${name}`, 'info');
      await testFn();
      this.testResults.passed++;
      this.testResults.tests.push({ name, status: 'PASSED' });
      this.log(`Test passed: ${name}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`Test failed: ${name} - ${error.message}`, 'error');
    }
  }

  async getTestBooking() {
    this.log('📋 Getting test booking...', 'info');
    
    const booking = await Booking.findOne({
      where: { status: 'selected' },
      include: [{ model: User, as: 'user' }],
      order: [['id', 'DESC']]
    });

    if (!booking) {
      throw new Error('No booking with "selected" status found for testing');
    }

    this.log(`✅ Using booking ${booking.id} with status "${booking.status}"`, 'success');
    this.log(`💰 Amount: ${booking.finalTotal || booking.totalPrice} UZS`, 'info');
    
    return booking;
  }

  async runTests() {
    this.log('🚀 Starting Enhanced Payme Service Integration Test', 'info');
    this.log('📋 Testing unified EnhancedPaymeService functionality', 'info');
    this.log('============================================================', 'info');

    let testBooking;

    // Get test booking
    await this.test('Get Test Booking', async () => {
      testBooking = await this.getTestBooking();
      if (!testBooking || !testBooking.id) {
        throw new Error('Failed to get valid test booking');
      }
    });

    if (!testBooking) {
      this.log('❌ Cannot continue tests without valid booking', 'error');
      return;
    }

    // Test 1: Check payment availability
    await this.test('Check Payment Availability', async () => {
      const availability = await this.enhancedPaymeService.checkPaymentAvailability(testBooking.id);
      
      if (!availability || typeof availability.available !== 'boolean') {
        throw new Error('Invalid availability response structure');
      }

      if (availability.available) {
        this.log(`✅ Payment available: ${availability.amount} UZS (${availability.amountInTiyin} tiyin)`, 'success');
      } else {
        this.log(`⚠️ Payment not available: ${availability.reason}`, 'warn');
      }
    });

    // Test 2: Get payment info
    await this.test('Get Payment Info', async () => {
      const paymentInfo = await this.enhancedPaymeService.getPaymentInfo(testBooking.id);
      
      if (!paymentInfo || !paymentInfo.bookingId) {
        throw new Error('Invalid payment info response');
      }

      this.log(`✅ Payment info: ${paymentInfo.amount} ${paymentInfo.currency}, can pay: ${paymentInfo.canPay}`, 'success');
    });

    // Test 3: Get transaction history
    await this.test('Get Transaction History', async () => {
      const history = await this.enhancedPaymeService.getTransactionHistory(testBooking.id);
      
      if (!Array.isArray(history)) {
        throw new Error('Transaction history should be an array');
      }

      this.log(`✅ Transaction history: ${history.length} Payme transactions found`, 'success');
    });

    // Test 4: Get detailed payment status
    await this.test('Get Detailed Payment Status', async () => {
      const status = await this.enhancedPaymeService.getDetailedPaymentStatus(testBooking.id);
      
      if (!status || !status.bookingId) {
        throw new Error('Invalid payment status response');
      }

      this.log(`✅ Payment status: ${status.status} for booking ${status.bookingId}`, 'success');
    });

    // Test 5: Test utility methods
    await this.test('Test Utility Methods', async () => {
      const states = this.enhancedPaymeService.STATES;
      
      // Test state checking methods
      if (!this.enhancedPaymeService.isPending(states.PENDING)) {
        throw new Error('isPending method failed');
      }
      
      if (!this.enhancedPaymeService.isPaid(states.PAID)) {
        throw new Error('isPaid method failed');
      }
      
      if (!this.enhancedPaymeService.isCanceled(states.PENDING_CANCELED)) {
        throw new Error('isCanceled method failed');
      }

      this.log(`✅ Utility methods working: PENDING=${states.PENDING}, PAID=${states.PAID}`, 'success');
    });

    // Test 6: Health check
    await this.test('Health Check', async () => {
      const health = await this.enhancedPaymeService.healthCheck();
      
      if (!health || !health.service) {
        throw new Error('Invalid health check response');
      }

      this.log(`✅ Health check: ${health.status} at ${health.timestamp}`, 'success');
    });

    // Test 7: Error handling
    await this.test('Error Handling', async () => {
      try {
        await this.enhancedPaymeService.getPaymentInfo('999999'); // Non-existent booking
        throw new Error('Should have thrown an error for non-existent booking');
      } catch (error) {
        if (error.message.includes('not found')) {
          this.log(`✅ Error handling working: ${error.message}`, 'success');
        } else {
          throw error;
        }
      }
    });

    this.printSummary();
  }

  printSummary() {
    this.log('============================================================', 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('============================================================', 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`, 'info');
    
    this.log('', 'info');
    this.log('📋 Individual Test Results:', 'info');
    this.testResults.tests.forEach(test => {
      const emoji = test.status === 'PASSED' ? '✅' : '❌';
      const message = test.error ? ` - ${test.error}` : '';
      this.log(`${emoji} ${test.name}${message}`, test.status === 'PASSED' ? 'success' : 'error');
    });

    this.log('', 'info');
    this.log('🎉 Enhanced Payme Service Integration Test Complete!', 'info');
  }
}

// Run the test
const test = new PaymeIntegrationTest();
test.runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
