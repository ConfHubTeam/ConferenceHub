/**
 * Debug Environment and Singleton State
 * Check if environment variables or singleton state are the issue
 */

require('dotenv').config();
const eskizSMSService = require("../services/eskizSMSService");

async function debugEnvironmentAndSingleton() {
  console.log("🔍 DEBUGGING ENVIRONMENT & SINGLETON STATE");
  console.log("=========================================");

  try {
    // Check environment variables
    console.log("🌍 Environment Variables:");
    console.log("ESKIZ_BASE_URL:", process.env.ESKIZ_BASE_URL ? "Present" : "Missing");
    console.log("ESKIZ_EMAIL:", process.env.ESKIZ_EMAIL ? "Present" : "Missing");
    console.log("ESKIZ_SECRET_CODE:", process.env.ESKIZ_SECRET_CODE ? "Present" : "Missing");
    console.log("ESKIZ_FROM:", process.env.ESKIZ_FROM ? "Present" : "Missing");

    // Check singleton state
    console.log("\n🏗️ Singleton State:");
    console.log("baseURL:", eskizSMSService.baseURL);
    console.log("email:", eskizSMSService.email ? "Present" : "Missing");
    console.log("secretCode:", eskizSMSService.secretCode ? "Present" : "Missing");
    console.log("from:", eskizSMSService.from);
    console.log("token:", eskizSMSService.token ? "Present" : "Missing");
    console.log("tokenExpiresAt:", eskizSMSService.tokenExpiresAt);

    // Force fresh authentication
    console.log("\n🔄 Forcing fresh authentication...");
    eskizSMSService.token = null;
    eskizSMSService.tokenExpiresAt = null;
    
    const authResult = await eskizSMSService.authenticate();
    console.log("Fresh auth result:", authResult ? "Success" : "Failed");

    // Test SMS immediately after fresh auth
    console.log("\n📱 Testing SMS after fresh auth...");
    const smsResult = await eskizSMSService.sendSMS(
      "+998999899999", 
      "Booking #REQ-MD78MTIX-YULBQ requested for \"Refactored 2\" on Jul 22, 2025 from 02:00 to 07:00"
    );
    
    console.log("SMS Result:", {
      success: smsResult.success,
      error: smsResult.error,
      requestId: smsResult.requestId
    });

    // Check singleton state after operations
    console.log("\n📊 Singleton State After Operations:");
    console.log("token:", eskizSMSService.token ? "Present" : "Missing");
    console.log("tokenExpiresAt:", eskizSMSService.tokenExpiresAt);

  } catch (error) {
    console.error("❌ Error in environment debug:", error);
  }
}

debugEnvironmentAndSingleton();
