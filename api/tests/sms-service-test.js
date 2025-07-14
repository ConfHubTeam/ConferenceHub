/**
 * Test SMS Service Integration
 * Tests the main SMS service class used by the application
 */

require('dotenv').config();
const path = require('path');

// Import the actual SMS service
const eskizSMSService = require('../services/eskizSMSService');

class SMSServiceTest {
  constructor() {
    this.testPhone = "+998993730907"; // Host's phone number
  }

  async testAuthentication() {
    console.log("🔐 Testing authentication...");
    
    try {
      const result = await eskizSMSService.testConnection();
      
      if (result.success) {
        console.log("✅ Authentication test passed");
        console.log(`📋 Result: ${result.message}`);
      } else {
        console.log("❌ Authentication test failed");
        console.log(`📋 Error: ${result.error}`);
      }
      
      return result.success;
    } catch (error) {
      console.error("❌ Authentication test error:", error.message);
      return false;
    }
  }

  async testSMSSending() {
    console.log("\n📱 Testing SMS sending...");
    
    try {
      const result = await eskizSMSService.sendSMS(
        this.testPhone, 
        "Test message from Airbnb Clone - booking confirmed!"
      );
      
      if (result.success) {
        console.log("✅ SMS sending test passed");
        console.log(`📋 Request ID: ${result.requestId}`);
        console.log(`📋 Status: ${result.status}`);
        console.log(`📋 Message: ${result.message}`);
      } else {
        console.log("❌ SMS sending test failed");
        console.log(`📋 Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error("❌ SMS sending test error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async testPhoneValidation() {
    console.log("\n📞 Testing phone number validation...");
    
    const testCases = [
      { phone: "+998993730907", expected: true, desc: "Valid Uzbekistan number" },
      { phone: "998993730907", expected: true, desc: "Valid without +" },
      { phone: "+1234567890", expected: true, desc: "Valid US number" },
      { phone: "123", expected: false, desc: "Too short" },
      { phone: "", expected: false, desc: "Empty string" },
      { phone: null, expected: false, desc: "Null value" }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      const result = eskizSMSService.validatePhoneNumber(testCase.phone);
      const status = result === testCase.expected ? "✅" : "❌";
      
      console.log(`${status} ${testCase.desc}: "${testCase.phone}" -> ${result}`);
      
      if (result === testCase.expected) {
        passed++;
      }
    }
    
    console.log(`📊 Phone validation: ${passed}/${total} tests passed`);
    return passed === total;
  }

  async testCountryDetection() {
    console.log("\n🌍 Testing country detection...");
    
    const testCases = [
      { phone: "+998993730907", expectedMethod: "domestic", desc: "Uzbekistan number" },
      { phone: "+1234567890", expectedMethod: "international", desc: "US number" },
      { phone: "+447123456789", expectedMethod: "international", desc: "UK number" }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
      const result = eskizSMSService.determineSMSMethod(testCase.phone);
      const status = result.method === testCase.expectedMethod ? "✅" : "❌";
      
      console.log(`${status} ${testCase.desc}: ${testCase.phone} -> ${result.method}`);
      
      if (result.method === testCase.expectedMethod) {
        passed++;
      }
    }
    
    console.log(`📊 Country detection: ${passed}/${total} tests passed`);
    return passed === total;
  }

  async runAllTests() {
    console.log("🚀 Running SMS Service Integration Tests");
    console.log("=" .repeat(60));
    
    const results = {
      authentication: false,
      phoneValidation: false,
      countryDetection: false,
      smsSending: false
    };
    
    try {
      // Test 1: Authentication
      results.authentication = await this.testAuthentication();
      
      // Test 2: Phone validation
      results.phoneValidation = await this.testPhoneValidation();
      
      // Test 3: Country detection
      results.countryDetection = await this.testCountryDetection();
      
      // Test 4: SMS sending (only if authentication works)
      if (results.authentication) {
        const smsResult = await this.testSMSSending();
        results.smsSending = smsResult.success;
      } else {
        console.log("\n📱 Skipping SMS sending test (authentication failed)");
      }
      
      // Summary
      console.log("\n" + "=" .repeat(60));
      console.log("📊 Test Results Summary:");
      console.log(`🔐 Authentication: ${results.authentication ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`📞 Phone Validation: ${results.phoneValidation ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`🌍 Country Detection: ${results.countryDetection ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`📱 SMS Sending: ${results.smsSending ? "✅ PASS" : "❌ FAIL"}`);
      
      const passedCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;
      
      console.log(`\n🎯 Overall: ${passedCount}/${totalTests} tests passed`);
      
      if (passedCount === totalTests) {
        console.log("🎉 All tests passed! SMS service is working correctly.");
      } else {
        console.log("⚠️  Some tests failed. Check the errors above.");
      }
      
    } catch (error) {
      console.error("❌ Test suite failed:", error.message);
    }
  }
}

// Run the tests
const tester = new SMSServiceTest();
tester.runAllTests().catch(console.error);
