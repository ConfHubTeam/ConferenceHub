/**
 * Enhanced Payme Service Integration Test
 * Tests the unified TransactionService integration with EnhancedPaymeService
 */

require('dotenv').config();
const path = require('path');

// Add the api directory to the require path
process.chdir(path.join(__dirname, '..'));

const EnhancedPaymeService = require('./services/enhancedPaymeService');
const TransactionService = require('./services/transactionService');
const { Booking, User, Transaction } = require('./models');

class EnhancedPaymeServiceTest {
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

  async testUnifiedTransactionService() {
    this.log('🧪 Testing Unified TransactionService Integration...', 'info');

        // Test 1: Create Payme transaction using unified interface
    await this.test('Create Payme Transaction via TransactionService', async () => {
      const testData = {
        provider: 'payme',
        providerTransactionId: 'test-payme-' + Date.now(),
        amount: 100000,
        currency: 'UZS',
        bookingId: 124, // Use actual booking ID
        userId: 2, // Use actual user ID from booking
        state: 1,
        providerData: {
          test: true,
          createdAt: new Date()
        }
      };

      const transaction = await TransactionService.createTransaction(testData);
      
      if (!transaction || transaction.provider !== 'payme') {
        throw new Error('Failed to create Payme transaction via unified interface');
      }
      
      // Clean up
      await TransactionService.deleteTransaction(transaction.id);
      
      this.log(`✅ Created Payme transaction ${transaction.id} successfully`, 'success');
    });

    // Test 2: Get Payme transaction by booking
    await this.test('Get Payme Transaction by Booking', async () => {
      // First create a transaction
      const testData = {
        provider: 'payme',
        providerTransactionId: 'test-booking-' + Date.now(),
        amount: 150000,
        currency: 'UZS',
        bookingId: 124, // Use actual booking ID
        userId: 2, // Use actual user ID
        state: 1,
        providerData: {
          test: true,
          createdAt: new Date()
        }
      };

      const transaction = await TransactionService.createTransaction(testData);
      
      // Now get it by booking
      const foundTransaction = await TransactionService.getPaymeTransactionByBooking(124);
      
      if (!foundTransaction || foundTransaction.bookingId !== 124) {
        throw new Error('Failed to retrieve Payme transaction by booking');
      }
      
      // Clean up
      await TransactionService.deleteTransaction(transaction.id);
      
      this.log(`✅ Retrieved Payme transaction for booking 124 successfully`, 'success');
    });

    // Test 3: Update transaction state
    await this.test('Update Transaction State', async () => {
      // First create a transaction
      const testData = {
        provider: 'payme',
        providerTransactionId: 'test-state-' + Date.now(),
        amount: 200000,
        currency: 'UZS',
        bookingId: 124, // Use actual booking ID
        userId: 2, // Use actual user ID
        state: 1,
        providerData: {
          test: true,
          createdAt: new Date()
        }
      };

      const transaction = await TransactionService.createTransaction(testData);
      
      // Update the state
      const updated = await TransactionService.updateTransactionState(transaction.id, 2);
      
      if (!updated || updated.state !== 2) {
        throw new Error('Failed to update transaction state');
      }
      
      // Clean up
      await TransactionService.deleteTransaction(transaction.id);
      
      this.log(`✅ Updated transaction state from 1 to 2 successfully`, 'success');
    });

    // Test 2: Get Payme transaction by booking
    await this.test('Get Payme Transaction by Booking', async () => {
      const testBookingId = 999999;
      
      // Create test transaction
      const testTransaction = await TransactionService.createTransaction({
        provider: 'payme',
        providerTransactionId: 'test-payme-booking-' + Date.now(),
        amount: 50000,
        currency: 'UZS',
        bookingId: testBookingId,
        userId: 999999,
        state: 1
      });

      // Retrieve it
      const retrievedTransaction = await TransactionService.getPaymeTransactionByBooking(testBookingId);
      
      if (!retrievedTransaction || retrievedTransaction.id !== testTransaction.id) {
        throw new Error('Failed to retrieve Payme transaction by booking ID');
      }

      // Clean up
      await Transaction.destroy({ where: { id: testTransaction.id } });
    });

    // Test 3: Update transaction state
    await this.test('Update Transaction State', async () => {
      const testTransaction = await TransactionService.createTransaction({
        provider: 'payme',
        providerTransactionId: 'test-payme-state-' + Date.now(),
        amount: 75000,
        currency: 'UZS',
        bookingId: 999999,
        userId: 999999,
        state: 1
      });

      // Update to paid state
      await TransactionService.updateTransactionState(
        testTransaction.providerTransactionId,
        2,
        { paymentCompletedAt: new Date() }
      );

      const updatedTransaction = await TransactionService.getByProviderTransactionId(
        testTransaction.providerTransactionId
      );

      if (!updatedTransaction || updatedTransaction.state !== 2 || !updatedTransaction.performDate) {
        throw new Error('Failed to update transaction state correctly');
      }

      // Clean up
      await Transaction.destroy({ where: { id: testTransaction.id } });
    });

    this.log('✅ Unified TransactionService integration tests completed', 'success');
  }

  async testEnhancedPaymeService(booking) {
    this.log('🚀 Testing EnhancedPaymeService...', 'info');

    // Test 1: Check payment availability
    await this.test('Check Payment Availability', async () => {
      const result = await this.enhancedPaymeService.checkPaymentAvailability(booking.id);
      
      if (!result.success) {
        throw new Error(`Payment availability check failed: ${result.error}`);
      }
    });

    // Test 2: Get payment info
    await this.test('Get Payment Info', async () => {
      const result = await this.enhancedPaymeService.getPaymentInfo(booking.id);
      
      if (!result.success) {
        throw new Error(`Get payment info failed: ${result.error}`);
      }

      if (!result.paymentInfo.booking || result.paymentInfo.booking.id !== booking.id) {
        throw new Error('Payment info does not match expected booking');
      }
    });

    // Test 3: Create payment URL
    await this.test('Create Payment URL', async () => {
      const result = await this.enhancedPaymeService.createPaymentUrl({
        bookingId: booking.id,
        returnUrl: 'https://example.com/return'
      });
      
      if (!result.success) {
        throw new Error(`Create payment URL failed: ${result.error}`);
      }

      if (!result.paymentUrl || !result.transactionId) {
        throw new Error('Payment URL or transaction ID missing from result');
      }

      // Verify transaction was created in database
      const transaction = await TransactionService.getPaymeTransactionByBooking(booking.id);
      if (!transaction || transaction.providerTransactionId !== result.transactionId) {
        throw new Error('Transaction not properly created in database');
      }
    });

    // Test 4: Get transaction history
    await this.test('Get Transaction History', async () => {
      const result = await this.enhancedPaymeService.getTransactionHistory(booking.id);
      
      if (!result.success) {
        throw new Error(`Get transaction history failed: ${result.error}`);
      }

      if (result.count === 0) {
        throw new Error('Expected at least one transaction in history');
      }
    });

    // Test 5: Get detailed payment status
    await this.test('Get Detailed Payment Status', async () => {
      const result = await this.enhancedPaymeService.getDetailedPaymentStatus(booking.id);
      
      if (!result.success) {
        throw new Error(`Get detailed payment status failed: ${result.message}`);
      }

      if (!result.transaction) {
        throw new Error('Expected transaction information in payment status');
      }
    });

    // Test 6: Cancel payment transaction
    await this.test('Cancel Payment Transaction', async () => {
      const result = await this.enhancedPaymeService.cancelPaymentTransaction(booking.id);
      
      if (!result.success) {
        throw new Error(`Cancel payment transaction failed: ${result.error}`);
      }

      // Verify transaction was cancelled
      const transaction = await TransactionService.getPaymeTransactionByBooking(booking.id);
      if (transaction && transaction.state !== -1) {
        throw new Error('Transaction was not properly cancelled');
      }
    });

    this.log('✅ EnhancedPaymeService tests completed', 'success');
  }

  async testServiceUtilities() {
    this.log('🔧 Testing Service Utilities...', 'info');

    // Test 1: Payment states
    await this.test('Payment States', async () => {
      const states = this.enhancedPaymeService.getPaymentStates();
      
      if (!states.PENDING || !states.PAID || !states.PENDING_CANCELLED || !states.PAID_CANCELLED) {
        throw new Error('Missing required payment states');
      }
    });

    // Test 2: State checking utilities
    await this.test('State Checking Utilities', async () => {
      const states = this.enhancedPaymeService.getPaymentStates();
      
      if (!this.enhancedPaymeService.isFinalState(states.PAID)) {
        throw new Error('PAID should be considered a final state');
      }

      if (!this.enhancedPaymeService.isSuccessfulState(states.PAID)) {
        throw new Error('PAID should be considered a successful state');
      }

      if (this.enhancedPaymeService.isSuccessfulState(states.PENDING_CANCELLED)) {
        throw new Error('PENDING_CANCELLED should not be considered a successful state');
      }
    });

    // Test 3: Health check
    await this.test('Health Check', async () => {
      const result = await this.enhancedPaymeService.healthCheck();
      
      if (!result.success) {
        throw new Error(`Health check failed: ${result.error}`);
      }
    });

    this.log('✅ Service utilities tests completed', 'success');
  }

  async cleanupTestData(booking) {
    this.log('🧹 Cleaning up test data...', 'info');
    
    try {
      // Remove any test transactions for the booking
      await Transaction.destroy({
        where: {
          bookingId: booking.id,
          provider: 'payme'
        }
      });

      // Reset booking fields
      await booking.update({
        paymeTransactionId: null,
        paymeInvoiceCreatedAt: null
      });

      this.log('✅ Test data cleaned up', 'success');
    } catch (error) {
      this.log(`⚠️ Error during cleanup: ${error.message}`, 'warn');
    }
  }

  async runFullTest() {
    this.log('🚀 Starting Enhanced Payme Service Integration Test', 'info');
    this.log('📋 Testing unified TransactionService integration', 'info');
    this.log('='.repeat(60), 'info');

    let booking;

    try {
      // Step 1: Test unified TransactionService
      await this.testUnifiedTransactionService();

      // Step 2: Get test booking
      await this.test('Get Test Booking', async () => {
        booking = await this.getTestBooking();
      });

      // Step 3: Test EnhancedPaymeService
      await this.testEnhancedPaymeService(booking);

      // Step 4: Test service utilities
      await this.testServiceUtilities();

    } catch (error) {
      this.log(`Critical error in test flow: ${error.message}`, 'error');
    } finally {
      // Step 5: Clean up
      if (booking) {
        await this.cleanupTestData(booking);
      }
    }

    // Print results
    this.log('='.repeat(60), 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`, 'info');
    
    this.log('\n📋 Individual Test Results:', 'info');
    this.testResults.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      this.log(`${status} ${test.name}${test.error ? ` - ${test.error}` : ''}`, test.status === 'PASSED' ? 'success' : 'error');
    });

    if (booking) {
      this.log(`\n🏠 Test Booking ID: ${booking.id}`, 'info');
    }

    this.log('\n🎉 Enhanced Payme Service Integration Test Complete!', 'info');
    
    return this.testResults;
  }
}

// Run the test
const tester = new EnhancedPaymeServiceTest();
tester.runFullTest().catch(console.error);
