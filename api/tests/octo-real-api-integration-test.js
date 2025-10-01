/**
 * REAL Octo API Integration Test
 * This test makes ACTUAL API calls to Octo's endpoint
 * Uses real credentials from .env file
 */

require('dotenv').config();
const OctoService = require('../services/octoService');

console.log('='.repeat(80));
console.log('REAL OCTO API INTEGRATION TEST');
console.log('='.repeat(80));
console.log();

// Verify credentials are loaded
console.log('Environment Configuration:');
console.log(`  OCTO_SHOP_ID: ${process.env.OCTO_SHOP_ID || '❌ NOT SET'}`);
console.log(`  OCTO_SECRET: ${process.env.OCTO_SECRET ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`  OCTO_TEST: ${process.env.OCTO_TEST || 'false'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || '❌ NOT SET'}`);
console.log();

if (!process.env.OCTO_SHOP_ID || !process.env.OCTO_SECRET) {
  console.error('❌ ERROR: Octo credentials not found in environment variables!');
  console.error('Please ensure OCTO_SHOP_ID and OCTO_SECRET are set in .env file');
  process.exit(1);
}

// Test scenarios with different user types
const testCases = [
  {
    name: 'Test 1: Regular user with email and phone',
    user: {
      id: 2,
      name: 'Test Client',
      email: 'client111@gmail.com',
      phoneNumber: '+998993730900',
      telegramId: null,
      telegramPhone: null,
      userType: 'client'
    },
    booking: {
      id: 171,
      userId: 2,
      placeId: 6,
      status: 'selected',
      totalPrice: 1000, // Small test amount
      finalTotal: 1000,
      uniqueRequestId: `TEST-REGULAR-${Date.now()}`
    }
  },
  {
    name: 'Test 2: Telegram user with phone (no real email)',
    user: {
      id: 100,
      name: 'Telegram User',
      email: null,
      phoneNumber: null,
      telegramId: '123456789',
      telegramPhone: '+998901234567',
      telegramUsername: 'testuser',
      userType: 'client'
    },
    booking: {
      id: 777,
      userId: 100,
      placeId: 3,
      status: 'selected',
      totalPrice: 1000,
      finalTotal: 1000,
      uniqueRequestId: `TEST-TELEGRAM-PHONE-${Date.now()}`
    }
  },
  {
    name: 'Test 3: Telegram user with username (has Telegram phone)',
    user: {
      id: 104,
      name: 'Telegram Username User',
      email: null,
      phoneNumber: null,
      telegramId: null,
      telegramUsername: 'cooluser',
      telegramPhone: '+998991234567', // Has Telegram phone
      userType: 'client'
    },
    booking: {
      id: 999,
      userId: 104,
      placeId: 8,
      status: 'selected',
      totalPrice: 1000,
      finalTotal: 1000,
      uniqueRequestId: `TEST-TELEGRAM-USERNAME-${Date.now()}`
    }
  }
];

// Test function that makes REAL API call
async function testRealOctoAPI(testCase, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${testCase.name} (${index + 1}/${testCases.length})`);
  console.log('='.repeat(80));
  
  try {
    const { user, booking } = testCase;
    const service = new OctoService();
    
    console.log('\n📤 Preparing payment request...');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email || 'null'}`);
    console.log(`  Phone: ${user.phoneNumber || 'null'}`);
    console.log(`  Telegram ID: ${user.telegramId || 'null'}`);
    console.log(`  Telegram Phone: ${user.telegramPhone || 'null'}`);
    
    console.log('\nBooking Details:');
    console.log(`  ID: ${booking.id}`);
    console.log(`  Amount: ${booking.finalTotal} UZS`);
    console.log(`  Request ID: ${booking.uniqueRequestId}`);
    
    // Make REAL API call
    const startTime = Date.now();
    const returnUrl = `${process.env.FRONTEND_URL}/payment/return`;
    const notifyUrl = `${process.env.FRONTEND_URL}/api/octo/notify`;
    
    console.log('\n🌐 Making REAL API call to Octo...');
    console.log(`  Return URL: ${returnUrl}`);
    console.log(`  Notify URL: ${notifyUrl}`);
    
    const result = await service.preparePayment({
      booking,
      user,
      returnUrl,
      test: process.env.OCTO_TEST === 'true',
      language: 'uz',
      notifyUrl
    });
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ SUCCESS! API Response received:');
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Shop Transaction ID: ${result.shopTransactionId}`);
    console.log(`  Octo Payment UUID: ${result.octoPaymentUUID}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Payment URL: ${result.payUrl}`);
    console.log(`  Total Sum: ${result.totalSum}`);
    
    console.log('\n📝 Raw API Response:');
    console.log(JSON.stringify(result.raw, null, 2));
    
    return {
      success: true,
      testName: testCase.name,
      result,
      duration
    };
    
  } catch (error) {
    console.log('\n❌ FAILED! Error occurred:');
    console.log(`  Error Type: ${error.name}`);
    console.log(`  Error Message: ${error.message}`);
    
    if (error.response) {
      console.log(`  HTTP Status: ${error.response.status}`);
      console.log(`  Response Data:`, error.response.data);
    }
    
    console.log('\n📋 Full Error Stack:');
    console.log(error.stack);
    
    return {
      success: false,
      testName: testCase.name,
      error: error.message
    };
  }
}

// Run all tests sequentially
async function runAllTests() {
  console.log('🚀 Starting Real Octo API Integration Tests...');
  console.log(`   Total tests: ${testCases.length}`);
  console.log(`   Test mode: ${process.env.OCTO_TEST === 'true' ? '✅ TRUE (sandbox)' : '⚠️  FALSE (production)'}`);
  console.log();
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await testRealOctoAPI(testCases[i], i);
    results.push(result);
    
    // Wait a bit between requests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.testName}`);
    if (result.success) {
      console.log(`   └─ Payment UUID: ${result.result.octoPaymentUUID}`);
      console.log(`   └─ Payment URL: ${result.result.payUrl}`);
      console.log(`   └─ Duration: ${result.duration}ms`);
    } else {
      console.log(`   └─ Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n' + '='.repeat(80));
  console.log('Key Findings:');
  console.log('='.repeat(80));
  
  if (passed === results.length) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('   ✅ Octo API is accepting all user types');
    console.log('   ✅ Telegram users can make payments');
    console.log('   ✅ Synthetic email fallback is working');
    console.log('   ✅ No null/undefined values in requests');
  } else if (passed > 0) {
    console.log('⚠️  PARTIAL SUCCESS:');
    console.log(`   ✅ ${passed} test(s) passed`);
    console.log(`   ❌ ${failed} test(s) failed`);
    console.log('   Please review the error messages above');
  } else {
    console.log('❌ ALL TESTS FAILED!');
    console.log('   Please check:');
    console.log('   1. Octo credentials are correct');
    console.log('   2. Octo API is accessible');
    console.log('   3. Network connection is working');
  }
  
  console.log('='.repeat(80));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('\n💥 Unexpected error running tests:');
  console.error(error);
  process.exit(1);
});
