/**
 * Debug Eskiz Authentication Test
 */

require('dotenv').config();
const eskizSMSService = require('../services/eskizSMSService');

async function debugEskizAuth() {
  console.log("🔍 DEBUGGING ESKIZ AUTHENTICATION");
  console.log("=" .repeat(50));
  
  console.log("📋 Environment Variables:");
  console.log(`ESKIZ_EMAIL: ${process.env.ESKIZ_EMAIL}`);
  console.log(`ESKIZ_SECRET_CODE: ${process.env.ESKIZ_SECRET_CODE ? '[SET]' : '[NOT SET]'}`);
  console.log(`ESKIZ_BASE_URL: ${process.env.ESKIZ_BASE_URL}`);
  console.log(`ESKIZ_FROM: ${process.env.ESKIZ_FROM}`);
  
  try {
    console.log("\n🔐 Testing authentication...");
    const token = await eskizSMSService.authenticate();
    console.log("✅ Authentication successful!");
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    console.log("\n📱 Testing SMS send...");
    const result = await eskizSMSService.sendSMS("+998993730907", "Test authentication debug");
    console.log("📱 SMS Result:", result);
    
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    console.error("Full error:", error);
  }
}

debugEskizAuth().catch(console.error);
