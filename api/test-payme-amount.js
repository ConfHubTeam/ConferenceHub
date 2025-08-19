/**
 * Test Payme Amount Validation Fix
 */

require('dotenv').config();
const paymeService = require('./services/paymeService');

async function testAmountValidation() {
  console.log('🧪 Testing Payme Amount Validation Fix');
  console.log('=====================================');
  
  // Test 1: Correct amount (1000 UZS = 100,000 tiyin)
  console.log('\n📋 Test 1: Correct Amount (1000 UZS = 100,000 tiyin)');
  try {
    const result1 = await paymeService.checkPerformTransaction({
      amount: 100000, // 1000 UZS in tiyin
      account: {
        order_id: "124"
      }
    }, 12345);
    
    console.log('✅ Result:', result1);
  } catch (error) {
    console.log('❌ Error:', error.error || error.message);
  }
  
  // Test 2: Incorrect amount (1000 tiyin instead of 100,000 tiyin)
  console.log('\n📋 Test 2: Incorrect Amount (1000 tiyin instead of 100,000 tiyin)');
  try {
    const result2 = await paymeService.checkPerformTransaction({
      amount: 1000, // Wrong amount - should be 100,000 tiyin
      account: {
        order_id: "124"
      }
    }, 12346);
    
    console.log('✅ Result:', result2);
  } catch (error) {
    console.log('❌ Expected Error:', error.error || error.message);
  }
  
  console.log('\n🎉 Amount validation test complete!');
}

testAmountValidation().catch(console.error);
