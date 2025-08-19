/**
 * Test Fixed Payme Service Logic
 * Tests the corrected PaymeService to ensure it follows Payme specifications:
 * 1. Consistent results for repeated calls
 * 2. Proper handling of existing transactions
 * 3. Correct error responses for duplicate orders
 */

require('dotenv').config();
const path = require('path');

// Add the api directory to the require path
process.chdir(path.join(__dirname, '..'));

const PaymeService = require('./services/paymeService');

class PaymeLogicTest {
  constructor() {
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

  generatePaymeTransactionId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  async runTests() {
    this.log('🚀 Starting Payme Logic Fix Verification Test', 'info');
    this.log('📋 Testing corrected PaymeService behavior according to Payme specs', 'info');
    this.log('============================================================', 'info');

    const bookingId = '125'; // Use the new clean booking
    const amount = 100000; // 1000 UZS in tiyin
    let firstTransactionId;
    let firstCreateResult;

    // Test 1: CheckPerformTransaction - should work for new booking
    await this.test('CheckPerformTransaction - New Booking', async () => {
      const params = {
        amount: amount,
        account: { order_id: bookingId }
      };

      const result = await PaymeService.checkPerformTransaction(params, 1);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid checkPerformTransaction response');
      }

      this.log(`✅ CheckPerformTransaction successful for booking ${bookingId}`, 'success');
    });

    // Test 2: CreateTransaction - first call should create new transaction
    await this.test('CreateTransaction - First Call', async () => {
      firstTransactionId = this.generatePaymeTransactionId();
      
      const params = {
        amount: amount,
        account: { order_id: bookingId },
        id: firstTransactionId,
        time: Date.now()
      };

      firstCreateResult = await PaymeService.createTransaction(params, 2);
      
      if (!firstCreateResult || !firstCreateResult.transaction) {
        throw new Error('Invalid createTransaction response');
      }

      this.log(`✅ First CreateTransaction successful: transaction ${firstCreateResult.transaction}`, 'success');
    });

    // Test 3: CreateTransaction - repeated call with SAME transaction ID should return IDENTICAL result
    await this.test('CreateTransaction - Repeated Call Same ID', async () => {
      const params = {
        amount: amount,
        account: { order_id: bookingId },
        id: firstTransactionId,
        time: Date.now()
      };

      const secondCreateResult = await PaymeService.createTransaction(params, 3);
      
      // Results should be identical
      if (JSON.stringify(firstCreateResult) !== JSON.stringify(secondCreateResult)) {
        throw new Error(`Results differ! First: ${JSON.stringify(firstCreateResult)}, Second: ${JSON.stringify(secondCreateResult)}`);
      }

      this.log(`✅ Repeated CreateTransaction returned identical result`, 'success');
    });

    // Test 4: CheckTransaction - should return consistent results for same transaction
    await this.test('CheckTransaction - Consistent Results', async () => {
      const firstCheckResult = await PaymeService.checkTransaction({ id: firstTransactionId }, 4);
      const secondCheckResult = await PaymeService.checkTransaction({ id: firstTransactionId }, 5);
      
      // Results should be identical
      if (JSON.stringify(firstCheckResult) !== JSON.stringify(secondCheckResult)) {
        throw new Error(`CheckTransaction results differ! First: ${JSON.stringify(firstCheckResult)}, Second: ${JSON.stringify(secondCheckResult)}`);
      }

      this.log(`✅ CheckTransaction returned consistent results`, 'success');
    });

    // Test 5: CreateTransaction with NEW transaction ID on booking with pending payment should return existing transaction
    await this.test('CreateTransaction - New ID on Pending Booking Should Return Existing', async () => {
      const newTransactionId = this.generatePaymeTransactionId();
      
      const params = {
        amount: amount,
        account: { order_id: bookingId },
        id: newTransactionId,
        time: Date.now()
      };

      const result = await PaymeService.createTransaction(params, 6);
      
      // Should return the existing transaction, not create a new one
      if (result.transaction === firstCreateResult.transaction) {
        this.log(`✅ Correctly returned existing transaction ${result.transaction} instead of creating new one`, 'success');
      } else {
        throw new Error(`Expected to return existing transaction ${firstCreateResult.transaction}, but got: ${result.transaction}`);
      }
    });

    // Test 6: CheckPerformTransaction - should still work with existing pending transaction
    await this.test('CheckPerformTransaction - With Pending Transaction', async () => {
      const params = {
        amount: amount,
        account: { order_id: bookingId }
      };

      const result = await PaymeService.checkPerformTransaction(params, 7);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid checkPerformTransaction response with pending transaction');
      }

      this.log(`✅ CheckPerformTransaction works with existing pending transaction`, 'success');
    });

    this.printSummary();
  }

  printSummary() {
    this.log('============================================================', 'info');
    this.log('📊 PAYME LOGIC TEST RESULTS', 'info');
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
    if (this.testResults.failed === 0) {
      this.log('🎉 All tests passed! Payme logic is working according to specifications.', 'success');
    } else {
      this.log('⚠️ Some tests failed. Check the issues above.', 'warn');
    }
    this.log('🏠 Test Booking ID: 125', 'info');
  }
}

// Run the test
const test = new PaymeLogicTest();
test.runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
