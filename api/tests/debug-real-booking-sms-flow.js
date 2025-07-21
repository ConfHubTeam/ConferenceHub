/**
 * Debug Real Booking SMS Flow with Timing Analysis
 * Monitor the entire notification flow including async SMS processing
 */

require('dotenv').config();
const UnifiedNotificationService = require("../services/unifiedNotificationService");
const eskizSMSService = require("../services/eskizSMSService");

async function debugRealBookingSMSFlow() {
  console.log("🔍 DEBUGGING REAL BOOKING SMS FLOW WITH TIMING");
  console.log("==============================================");

  try {
    console.log("⏰ Starting at:", new Date().toISOString());
    
    // Step 1: Check initial SMS service state
    console.log("\n📱 Step 1: Checking SMS service initial state...");
    console.log("Token exists:", eskizSMSService.token ? "Yes" : "No");
    console.log("Token expires:", eskizSMSService.tokenExpiresAt);
    
    // Step 2: Test SMS service connection
    console.log("\n📞 Step 2: Testing SMS service connection...");
    const connectionResult = await UnifiedNotificationService.testSMSService();
    console.log("Connection result:", connectionResult);
    
    // Step 3: Create notification (this triggers async SMS)
    console.log("\n📝 Step 3: Creating booking notification...");
    const notificationStartTime = Date.now();
    
    const result = await UnifiedNotificationService.createBookingNotification({
      userId: 42, // Host user ID
      type: "booking_requested",
      title: "Real Booking Test",
      message: "Booking #REQ-REAL-DEBUG requested for \"Debug Place\" on Jul 22, 2025 from 02:00 to 07:00",
      bookingId: 9999,
      placeId: 888,
      additionalMetadata: {
        debugTest: true,
        timestamp: new Date().toISOString()
      }
    });
    
    const notificationEndTime = Date.now();
    console.log(`✅ In-app notification created in ${notificationEndTime - notificationStartTime}ms`);
    console.log("📋 Notification ID:", result.notification.id);
    console.log("⏰ Notification created at:", result.notification.createdAt);
    
    // Step 4: Monitor SMS processing in real-time
    console.log("\n📱 Step 4: Monitoring SMS processing...");
    console.log("⏳ Waiting for async SMS processing...");
    
    let smsProcessed = false;
    let attempts = 0;
    const maxAttempts = 20; // Wait up to 20 seconds
    
    while (!smsProcessed && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      console.log(`📊 Check ${attempts}/20 - Checking SMS status...`);
      
      // Query database to check SMS status
      try {
        // We'll need to use a different approach since we don't have direct DB access here
        // Let's check the SMS service state instead
        console.log("SMS Service Token:", eskizSMSService.token ? "Present" : "Missing");
        console.log("SMS Service Token Expires:", eskizSMSService.tokenExpiresAt);
        
        if (attempts >= 5) {
          console.log("⚠️  SMS processing taking longer than expected...");
        }
        
        if (attempts >= 10) {
          console.log("⚠️  Still waiting for SMS processing...");
          
          // Try to send a direct SMS to see if the service is working
          console.log("🧪 Testing direct SMS send...");
          const directSMSResult = await eskizSMSService.sendSMS(
            "+998999899999",
            "Direct test during booking flow debug"
          );
          console.log("Direct SMS result:", {
            success: directSMSResult.success,
            error: directSMSResult.error
          });
        }
        
      } catch (error) {
        console.error(`Error checking SMS status on attempt ${attempts}:`, error.message);
      }
    }
    
    // Step 5: Final status check
    console.log("\n📊 Step 5: Final status check...");
    console.log("⏰ Final check at:", new Date().toISOString());
    console.log("🔍 Please check the database for notification ID:", result.notification.id);
    console.log("🔍 SQL Query to check: SELECT id, user_id, is_sms_sent, sms_error, sms_request_id, created_at FROM notifications WHERE id =", result.notification.id);
    
    // Step 6: Authentication and SMS service final state
    console.log("\n🔧 Step 6: SMS Service final state...");
    console.log("Token present:", eskizSMSService.token ? "Yes" : "No");
    console.log("Token valid:", eskizSMSService.isTokenValid());
    
    if (eskizSMSService.token) {
      console.log("Token expires:", eskizSMSService.tokenExpiresAt);
      
      // Test if we can send SMS with current token
      console.log("\n🧪 Final SMS test with current token...");
      const finalSMSTest = await eskizSMSService.sendSMS(
        "+998999899999",
        "Booking #REQ-FINAL-TEST requested for \"Final Test\" on Jul 22, 2025 from 02:00 to 07:00"
      );
      console.log("Final SMS test result:", {
        success: finalSMSTest.success,
        error: finalSMSTest.error,
        requestId: finalSMSTest.requestId
      });
    }
    
  } catch (error) {
    console.error("❌ Error in real booking SMS flow debug:", error);
  }
}

debugRealBookingSMSFlow();
