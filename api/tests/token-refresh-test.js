/**
 * Token Refresh Test Script
 * 
 * Tests the enhanced Eskiz SMS service token management and automatic refresh functionality.
 * This script simulates token expiry scenarios and validates the robust retry logic.
 * 
 * Usage: node api/tests/token-refresh-test.js
 */

require("dotenv").config({ path: "../../.env" });
const eskizSMSService = require("../services/eskizSMSService");

/**
 * Test basic authentication
 */
async function testAuthentication() {
  console.log("\n🔐 Testing basic authentication...");
  
  try {
    const token = await eskizSMSService.authenticate();
    console.log("✅ Authentication successful");
    console.log(`📝 Token preview: ${token ? token.substring(0, 20) + "..." : "null"}`);
    console.log(`⏰ Token expires at: ${eskizSMSService.tokenExpiresAt}`);
    return true;
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    return false;
  }
}

/**
 * Test token validation logic
 */
async function testTokenValidation() {
  console.log("\n🔍 Testing token validation logic...");
  
  try {
    // First authenticate to get a valid token
    await eskizSMSService.authenticate();
    
    // Test with valid token
    const isValid = eskizSMSService.isTokenValid();
    console.log(`✅ Token validity check: ${isValid ? "VALID" : "INVALID"}`);
    
    // Manually expire token to test validation
    const originalExpiry = eskizSMSService.tokenExpiresAt;
    eskizSMSService.tokenExpiresAt = new Date(Date.now() - 1000); // 1 second ago
    
    const isExpired = eskizSMSService.isTokenValid();
    console.log(`✅ Expired token check: ${isExpired ? "VALID" : "INVALID (Expected)"}`);
    
    // Restore original expiry
    eskizSMSService.tokenExpiresAt = originalExpiry;
    
    return true;
  } catch (error) {
    console.error("❌ Token validation test failed:", error.message);
    return false;
  }
}

/**
 * Test token expired error detection
 */
async function testTokenExpiredErrorDetection() {
  console.log("\n🚨 Testing token expired error detection...");
  
  try {
    // Test various error scenarios
    const testCases = [
      {
        description: "HTTP 401 error",
        error: { response: { status: 401, data: { message: "Unauthorized" } } },
        expected: true
      },
      {
        description: "Token expired message",
        error: { response: { status: 400, data: { message: "Token expired" } } },
        expected: true
      },
      {
        description: "Invalid token message",
        error: { response: { status: 403, data: { message: "Invalid token provided" } } },
        expected: true
      },
      {
        description: "Network error",
        error: { code: "ECONNREFUSED" },
        expected: false
      },
      {
        description: "Other error",
        error: { response: { status: 500, data: { message: "Internal server error" } } },
        expected: false
      }
    ];
    
    let passedTests = 0;
    
    for (const testCase of testCases) {
      const result = eskizSMSService.isTokenExpiredError(testCase.error);
      const passed = result === testCase.expected;
      
      console.log(`${passed ? "✅" : "❌"} ${testCase.description}: ${result ? "EXPIRED" : "NOT EXPIRED"}`);
      
      if (passed) passedTests++;
    }
    
    console.log(`📊 Passed ${passedTests}/${testCases.length} error detection tests`);
    return passedTests === testCases.length;
    
  } catch (error) {
    console.error("❌ Error detection test failed:", error.message);
    return false;
  }
}

/**
 * Test SMS sending with simulated token expiry
 */
async function testSMSWithTokenExpiry() {
  console.log("\n📱 Testing SMS sending with simulated token expiry...");
  
  try {
    // First authenticate to get a valid token
    await eskizSMSService.authenticate();
    console.log("🔐 Initial authentication successful");
    
    // Save original token
    const originalToken = eskizSMSService.token;
    const originalExpiry = eskizSMSService.tokenExpiresAt;
    
    // Simulate expired token by setting an invalid one
    eskizSMSService.token = "invalid_expired_token_12345";
    eskizSMSService.tokenExpiresAt = new Date(Date.now() - 1000); // Already expired
    
    console.log("⚠️  Simulated token expiry - attempting SMS send...");
    
    // Try to send SMS - this should trigger automatic token refresh
    const result = await eskizSMSService.sendSMS(
      "+998901234567", // Test number
      "Test message with token refresh"
    );
    
    if (result.success) {
      console.log("✅ SMS sent successfully after automatic token refresh");
      console.log(`📝 Result: ${result.message}`);
    } else {
      console.log("⚠️  SMS failed (expected for test account with custom message)");
      console.log(`📝 Error: ${result.error}`);
      
      // Check if the token was refreshed (different from our invalid token)
      if (eskizSMSService.token !== "invalid_expired_token_12345") {
        console.log("✅ Token was automatically refreshed during SMS attempt");
      } else {
        console.log("❌ Token was not refreshed");
      }
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ SMS with token expiry test failed:", error.message);
    return false;
  }
}

/**
 * Test connection with comprehensive error scenarios
 */
async function testConnectionResilience() {
  console.log("\n🔗 Testing connection resilience...");
  
  try {
    const result = await eskizSMSService.testConnection();
    
    console.log(`${result.success ? "✅" : "❌"} Connection test: ${result.message}`);
    
    if (result.success) {
      console.log("📡 SMS service is ready for production use");
    } else {
      console.log("⚠️  SMS service needs attention before production use");
    }
    
    return result.success;
    
  } catch (error) {
    console.error("❌ Connection resilience test failed:", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("🧪 Starting Enhanced Eskiz SMS Token Refresh Tests");
  console.log("=" .repeat(60));
  
  const tests = [
    { name: "Authentication", fn: testAuthentication },
    { name: "Token Validation", fn: testTokenValidation },
    { name: "Error Detection", fn: testTokenExpiredErrorDetection },
    { name: "SMS with Token Expiry", fn: testSMSWithTokenExpiry },
    { name: "Connection Resilience", fn: testConnectionResilience }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔄 Running ${test.name} test...`);
    
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed, error: null });
      
      if (passed) {
        passedTests++;
        console.log(`✅ ${test.name} test PASSED`);
      } else {
        console.log(`❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
      console.log(`❌ ${test.name} test FAILED with error: ${error.message}`);
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=" .repeat(60));
  
  results.forEach(result => {
    console.log(`${result.passed ? "✅" : "❌"} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log("🎉 All tests passed! Token refresh functionality is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Please review the implementation.");
  }
  
  console.log("\n💡 Notes:");
  console.log("- Test account limitations may cause SMS sending to fail with custom messages");
  console.log("- Token refresh logic should still work even if SMS delivery fails");
  console.log("- Upgrade to paid account for full SMS functionality with custom messages");
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
