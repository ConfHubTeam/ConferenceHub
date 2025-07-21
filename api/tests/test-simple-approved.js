/**
 * Test Simple Approved Template
 * Test with a known working SMS template
 */

require('dotenv').config();
const eskizSMSService = require("../services/eskizSMSService");

async function testSimpleApprovedTemplate() {
  console.log("🔍 TESTING SIMPLE APPROVED TEMPLATE");
  console.log("===================================");

  try {
    const phoneNumber = "+998993730907";
    
    // Test with the exact message from our working booking flow test
    const approvedMessage = "Booking #REQ-TEST-456 for \"Test Refund Options\" on Jul 20, 2025 from 14:00 to 16:00 has been selected. Please proceed with payment.";
    
    console.log("📱 Testing approved message:");
    console.log(approvedMessage);
    
    const result = await eskizSMSService.sendSMS(phoneNumber, approvedMessage);
    
    if (result.success) {
      console.log("✅ SMS sent successfully!");
      console.log("📋 Request ID:", result.requestId);
    } else {
      console.log("❌ SMS failed:");
      console.log("Error:", result.error);
    }
    
    // Test the exact booking requested format that should be approved
    console.log("\n📱 Testing booking requested format:");
    const requestedMessage = "Booking #REQ-TEST-123 requested for \"Test Refund Options\" on Jul 20, 2025 from 10:00 to 11:00";
    console.log(requestedMessage);
    
    const result3 = await eskizSMSService.sendSMS(phoneNumber, requestedMessage);
    
    if (result3.success) {
      console.log("✅ Requested SMS sent successfully!");
      console.log("📋 Request ID:", result3.requestId);
    } else {
      console.log("❌ Requested SMS failed:");
      console.log("Error:", result3.error);
    }

  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testSimpleApprovedTemplate();
