/**
 * Debug Real Booking Authentication Issue
 * Check why authentication is failing for real bookings
 */

require('dotenv').config();
const eskizSMSService = require("../services/eskizSMSService");

async function debugAuthenticationIssue() {
  console.log("🔍 DEBUGGING AUTHENTICATION ISSUE");
  console.log("=================================");

  try {
    // Test authentication directly
    console.log("📱 Testing Eskiz authentication...");
    const authToken = await eskizSMSService.authenticate();
    
    if (authToken) {
      console.log("✅ Authentication successful!");
      console.log("📋 Token:", authToken ? "Present" : "Missing");
    } else {
      console.log("❌ Authentication failed:");
      console.log("Error: No token returned");
    }

    // Test connection
    console.log("\n📞 Testing connection...");
    const connResult = await eskizSMSService.testConnection();
    console.log("Connection result:", connResult);

    // Test simple SMS
    console.log("\n📱 Testing simple SMS...");
    const smsResult = await eskizSMSService.sendSMS(
      "+998993730907", 
      "Booking #REQ-MD78MTIX-YULBQ requested for \"Refactored 2\" on Jul 22, 2025 from 02:00 to 07:00"
    );
    
    if (smsResult.success) {
      console.log("✅ SMS sent successfully!");
      console.log("📋 Request ID:", smsResult.requestId);
    } else {
      console.log("❌ SMS failed:");
      console.log("Error:", smsResult.error);
    }

  } catch (error) {
    console.error("❌ Error in debug test:", error);
  }
}

debugAuthenticationIssue();
