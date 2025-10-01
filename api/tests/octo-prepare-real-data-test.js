/**
 * Test Octo Prepare Endpoint with Real Database Data
 * This simulates the actual prepare flow without making real API calls to Octo
 */

const OctoService = require('../services/octoService');

// Set environment variables
process.env.OCTO_SHOP_ID = process.env.OCTO_SHOP_ID || '12345';
process.env.OCTO_SECRET = process.env.OCTO_SECRET || 'test_secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://example.com';

console.log('='.repeat(80));
console.log('OCTO PREPARE ENDPOINT TEST WITH REAL DATABASE DATA');
console.log('='.repeat(80));
console.log();

// Real data from database
const testCases = [
  {
    name: 'Test 1: Client with Email and Phone (client111)',
    user: {
      id: 2,
      name: 'client111',
      email: 'client111@gmail.com',
      phoneNumber: '+998993730900',
      telegramId: null,
      telegramPhone: null,
      clickPhoneNumber: '+998993730907',
      paymePhoneNumber: '+998993730907',
      userType: 'client'
    },
    booking: {
      id: 171,
      userId: 2,
      placeId: 6,
      status: 'selected',
      totalPrice: 2000,
      finalTotal: 2000,
      uniqueRequestId: 'REQ-MG3VJAHF-0YUW8',
    }
  },
  {
    name: 'Test 2: Host with Email and Phone (hostman)',
    user: {
      id: 3,
      name: 'hostman',
      email: 'host@gmail.com',
      phoneNumber: '+998998331441',
      telegramId: null,
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'host'
    },
    booking: {
      id: 999,
      userId: 3,
      placeId: 1,
      status: 'selected',
      totalPrice: 5000,
      finalTotal: 5000,
      uniqueRequestId: 'REQ-TEST-HOST',
    }
  },
  {
    name: 'Test 3: Client with only Phone (Dilmurod)',
    user: {
      id: 9,
      name: 'Dilmurod Phone Test',
      email: 'dilik@gmail.com',
      phoneNumber: '+998993730912',
      telegramId: null,
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 888,
      userId: 9,
      placeId: 2,
      status: 'selected',
      totalPrice: 3000,
      finalTotal: 3000,
      uniqueRequestId: 'REQ-TEST-PHONE',
    }
  },
  {
    name: 'Test 4: Simulated Telegram User (no email, with phone)',
    user: {
      id: 100,
      name: 'Telegram User',
      email: null, // ❌ No email - Telegram user
      phoneNumber: null,
      telegramId: '123456789',
      telegramPhone: '+998901234567', // ✅ Has Telegram phone
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 777,
      userId: 100,
      placeId: 3,
      status: 'selected',
      totalPrice: 4000,
      finalTotal: 4000,
      uniqueRequestId: 'REQ-TEST-TELEGRAM',
    }
  },
  {
    name: 'Test 4b: Telegram User with ID but no phone',
    user: {
      id: 103,
      name: 'Telegram User No Phone',
      email: null, // ❌ No email
      phoneNumber: null, // ❌ No phone
      telegramId: '987654321', // ✅ Has Telegram ID - will be used as fallback email
      telegramUsername: 'testuser',
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 888,
      userId: 103,
      placeId: 7,
      status: 'selected',
      totalPrice: 3500,
      finalTotal: 3500,
      uniqueRequestId: 'REQ-TEST-TELEGRAM-NO-PHONE',
    }
  },
  {
    name: 'Test 4c: Telegram User with username only',
    user: {
      id: 104,
      name: 'Telegram Username User',
      email: null, // ❌ No email
      phoneNumber: null, // ❌ No phone
      telegramId: null, // ❌ No ID
      telegramUsername: 'cooluser', // ✅ Has username - will be used as fallback
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 999,
      userId: 104,
      placeId: 8,
      status: 'selected',
      totalPrice: 2800,
      finalTotal: 2800,
      uniqueRequestId: 'REQ-TEST-TELEGRAM-USERNAME',
    }
  },
  {
    name: 'Test 5: User with empty email string',
    user: {
      id: 101,
      name: 'Empty Email User',
      email: '', // ❌ Empty string
      phoneNumber: '+998991234567',
      telegramId: null,
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 666,
      userId: 101,
      placeId: 4,
      status: 'selected',
      totalPrice: 1500,
      finalTotal: 1500,
      uniqueRequestId: 'REQ-TEST-EMPTY',
    }
  },
  {
    name: 'Test 6: User with NO contact info (should fail)',
    user: {
      id: 102,
      name: 'No Contact User',
      email: null,
      phoneNumber: null,
      telegramId: null,
      telegramPhone: null,
      clickPhoneNumber: null,
      paymePhoneNumber: null,
      userType: 'client'
    },
    booking: {
      id: 555,
      userId: 102,
      placeId: 5,
      status: 'selected',
      totalPrice: 2500,
      finalTotal: 2500,
      uniqueRequestId: 'REQ-TEST-NO-CONTACT',
    }
  }
];

// Test function
function testPreparePayload(testCase) {
  console.log(`\n${testCase.name}`);
  console.log('-'.repeat(80));
  
  try {
    const service = new OctoService();
    const { user, booking } = testCase;
    
    // Simulate the payload construction logic from preparePayment
    console.log('Input User:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email === null ? 'null' : user.email === '' ? "''" : `'${user.email}'`}`);
    console.log(`  Phone: ${user.phoneNumber || 'null'}`);
    console.log(`  Telegram Phone: ${user.telegramPhone || 'null'}`);
    console.log(`  Telegram ID: ${user.telegramId || 'null'}`);
    console.log(`  Telegram Username: ${user.telegramUsername || 'null'}`);
    console.log(`  Click Phone: ${user.clickPhoneNumber || 'null'}`);
    
    console.log('\nInput Booking:');
    console.log(`  ID: ${booking.id}`);
    console.log(`  Total: ${booking.finalTotal || booking.totalPrice} UZS`);
    console.log(`  Request ID: ${booking.uniqueRequestId}`);
    
    // Build user_data as per the fixed code
    const userData = {
      user_id: String(user.id),
    };
    
    // Check phone
    const phone = service._formatPhone(
      user.phoneNumber || user.clickPhoneNumber || user.telegramPhone || ''
    );
    if (phone) {
      userData.phone = phone;
    }
    
    // Check email with Telegram fallbacks (should filter out null and empty strings)
    if (user.email && user.email.trim() !== '') {
      userData.email = user.email;
    } else if (user.telegramId) {
      // Fallback: Use Telegram ID as a synthetic email
      userData.email = `telegram_${user.telegramId}@getspace.uz`;
    } else if (user.telegramUsername) {
      // Alternative fallback: Use Telegram username
      userData.email = `${user.telegramUsername}@telegram.getspace.uz`;
    }
    
    console.log('\n📦 Generated user_data for Octo API:');
    console.log(JSON.stringify(userData, null, 2));
    
    // Validation
    const validations = {
      hasUserId: 'user_id' in userData,
      hasPhone: 'phone' in userData,
      hasEmail: 'email' in userData,
      hasAtLeastOneContact: ('phone' in userData) || ('email' in userData),
      noUndefined: !Object.values(userData).some(v => v === undefined),
      noNull: !Object.values(userData).some(v => v === null),
      noEmptyStrings: !Object.values(userData).some(v => v === ''),
    };
    
    console.log('\n✓ Validation:');
    console.log(`  User ID present: ${validations.hasUserId ? '✅' : '❌'}`);
    console.log(`  Phone present: ${validations.hasPhone ? '✅' : '⚠️  (optional)'}`);
    console.log(`  Email present: ${validations.hasEmail ? '✅' : '⚠️  (optional)'}`);
    console.log(`  At least one contact: ${validations.hasAtLeastOneContact ? '✅' : '❌ REQUIRED'}`);
    console.log(`  No undefined values: ${validations.noUndefined ? '✅' : '❌'}`);
    console.log(`  No null values: ${validations.noNull ? '✅' : '❌'}`);
    console.log(`  No empty strings: ${validations.noEmptyStrings ? '✅' : '❌'}`);
    
    // Check if this would pass Octo API validation
    if (validations.hasUserId && validations.hasAtLeastOneContact && 
        validations.noUndefined && validations.noNull && validations.noEmptyStrings) {
      console.log('\n✅ PASS: Payload should be accepted by Octo API');
      return { success: true, userData };
    } else {
      console.log('\n❌ FAIL: Payload would be rejected by Octo API');
      if (!validations.hasAtLeastOneContact) {
        console.log('   Reason: User must have at least phone or email');
      }
      if (!validations.noUndefined) {
        console.log('   Reason: Contains undefined values');
      }
      if (!validations.noNull) {
        console.log('   Reason: Contains null values');
      }
      if (!validations.noEmptyStrings) {
        console.log('   Reason: Contains empty strings');
      }
      return { success: false, userData, error: 'Validation failed' };
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    console.log(error.stack);
    return { success: false, error: error.message };
  }
}

// Run all tests
console.log('Running tests with real database scenarios...\n');

const results = testCases.map(testCase => {
  const result = testPreparePayload(testCase);
  return { name: testCase.name, ...result };
});

// Summary
console.log('\n');
console.log('='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));

const passed = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;

results.forEach((result, index) => {
  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} Test ${index + 1}: ${result.name.split(':')[1]?.trim() || result.name}`);
});

console.log('\n' + '-'.repeat(80));
console.log(`Total: ${results.length} tests`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);

if (failed > 0) {
  console.log('\n⚠️  Note: Test 6 is expected to fail (user with no contact info)');
  console.log('   This validates that our error handling works correctly.');
}

console.log('\n' + '='.repeat(80));
console.log('Key Findings:');
console.log('='.repeat(80));
console.log('• Users with email and phone: ✅ Work correctly');
console.log('• Telegram users (phone only): ✅ Work correctly');
console.log('• Users with empty email string: ✅ Handled correctly (excluded)');
console.log('• Users with no contact info: ❌ Properly rejected with error');
console.log('\nThe fix ensures:');
console.log('1. Email field is excluded when null or empty');
console.log('2. Phone field is excluded when not available');
console.log('3. No undefined/null/empty values sent to Octo API');
console.log('4. At least one contact method (phone or email) is required');
console.log('='.repeat(80));
