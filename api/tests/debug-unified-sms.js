/**
 * Debug UnifiedNotificationService SMS sending
 * Test if the issue is in UnifiedNotificationService layer
 */

require('dotenv').config();
const UnifiedNotificationService = require("../services/unifiedNotificationService");

async function debugUnifiedSMSService() {
  console.log("🔍 DEBUGGING UNIFIED SMS SERVICE");
  console.log("===============================");

  try {
    // Test connection first
    console.log("📱 Testing SMS service connection...");
    const connectionTest = await UnifiedNotificationService.testSMSService();
    console.log("Connection result:", connectionTest);

    // Create a test notification first
    console.log("\n📝 Creating test notification...");
    const notificationResult = await UnifiedNotificationService.createNotification({
      userId: 42, // Host ID from our database query
      type: "booking_requested",
      title: "Test Booking Request",
      message: "Booking #REQ-MD78MTIX-YULBQ requested for \"Refactored 2\" on Jul 22, 2025 from 02:00 to 07:00",
      metadata: {
        bookingId: "REQ-MD78MTIX-YULBQ",
        placeId: 123
      },
      sendSMS: false // Don't auto-send SMS yet
    });

    if (!notificationResult.success) {
      console.log("❌ Failed to create notification:", notificationResult.message);
      return;
    }

    console.log("✅ Notification created with ID:", notificationResult.notification.id);

    // Now test SMS sending directly
    console.log("\n📱 Testing SMS sending via UnifiedNotificationService...");
    const smsResult = await UnifiedNotificationService.sendSMSNotification(
      notificationResult.notification.id,
      42, // Host user ID
      "booking_requested",
      {
        bookingId: "REQ-MD78MTIX-YULBQ",
        placeId: 123
      }
    );

    if (smsResult.success) {
      console.log("✅ SMS sent successfully via UnifiedNotificationService!");
      console.log("📋 Request ID:", smsResult.requestId);
    } else {
      console.log("❌ SMS failed via UnifiedNotificationService:");
      console.log("Error:", smsResult.error);
      console.log("Reason:", smsResult.reason);
    }

  } catch (error) {
    console.error("❌ Error in unified service test:", error);
  }
}

debugUnifiedSMSService();
