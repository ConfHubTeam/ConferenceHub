/**
 * Debug Authentication Race Conditions 
 * Test if concurrent authentication requests cause issues
 */

require('dotenv').config();
const eskizSMSService = require("../services/eskizSMSService");

async function debugAuthenticationRaceConditions() {
  console.log("🔍 DEBUGGING AUTHENTICATION RACE CONDITIONS");
  console.log("==========================================");

  try {
    // Clear any existing token to force fresh authentication
    console.log("🔄 Clearing existing tokens...");
    eskizSMSService.token = null;
    eskizSMSService.tokenExpiresAt = null;

    // Test 1: Sequential authentication calls
    console.log("\n📱 Test 1: Sequential authentication calls...");
    const auth1 = await eskizSMSService.authenticate();
    console.log("Auth 1 result:", auth1 ? "Success" : "Failed");
    
    const auth2 = await eskizSMSService.authenticate();
    console.log("Auth 2 result:", auth2 ? "Success" : "Failed");

    // Test 2: Clear token and test concurrent authentication
    console.log("\n🔄 Clearing tokens for concurrent test...");
    eskizSMSService.token = null;
    eskizSMSService.tokenExpiresAt = null;

    console.log("📱 Test 2: Concurrent authentication calls...");
    const concurrentAuth = await Promise.allSettled([
      eskizSMSService.authenticate(),
      eskizSMSService.authenticate(),
      eskizSMSService.authenticate()
    ]);

    concurrentAuth.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Concurrent auth ${index + 1}: Success`);
      } else {
        console.log(`Concurrent auth ${index + 1}: Failed - ${result.reason.message}`);
      }
    });

    // Test 3: Concurrent SMS sending (which includes auth)
    console.log("\n📱 Test 3: Concurrent SMS sending...");
    eskizSMSService.token = null;
    eskizSMSService.tokenExpiresAt = null;

    const concurrentSMS = await Promise.allSettled([
      eskizSMSService.sendSMS("+998999899999", "Concurrent test message 1"),
      eskizSMSService.sendSMS("+998999899999", "Concurrent test message 2"), 
      eskizSMSService.sendSMS("+998999899999", "Concurrent test message 3")
    ]);

    concurrentSMS.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Concurrent SMS ${index + 1}: ${result.value.success ? 'Success' : 'Failed'} - ${result.value.error || 'OK'}`);
      } else {
        console.log(`Concurrent SMS ${index + 1}: Error - ${result.reason.message}`);
      }
    });

  } catch (error) {
    console.error("❌ Error in race condition test:", error);
  }
}

debugAuthenticationRaceConditions();
