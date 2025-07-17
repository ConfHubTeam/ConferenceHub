/**
 * Debug Real Booking Flow
 * Test the exact same flow as real bookings use
 */

require('dotenv').config();
const UnifiedNotificationService = require("../services/unifiedNotificationService");

async function debugRealBookingFlow() {
  console.log("🔍 DEBUGGING REAL BOOKING FLOW");
  console.log("=============================");

  try {
    console.log("📝 Creating booking notification (like real bookings do)...");
    
    // This is exactly what BookingNotificationService.createBookingRequestNotification calls
    const result = await UnifiedNotificationService.createBookingNotification({
      userId: 42, // Host ID from our database query
      type: "booking_requested",
      title: "New Booking Request",
      message: "Booking #REQ-MD78MTIX-YULBQ requested for \"Refactored 2\" on Jul 22, 2025 from 02:00 to 07:00",
      bookingId: 999,
      placeId: 123,
      additionalMetadata: {
        uniqueRequestId: "REQ-MD78MTIX-YULBQ",
        bookingReference: "REQ-MD78MTIX-YULBQ",
        placeName: "Refactored 2",
        dates: "Jul 22, 2025",
        checkInDate: "2025-07-22",
        checkOutDate: "2025-07-22",
        totalPrice: 100,
        numOfGuests: 2,
        timeSlots: [{ startTime: "02:00", endTime: "07:00" }],
        dateTimeWindow: "Jul 22, 2025 from 02:00 to 07:00"
      }
    });

    if (result.success) {
      console.log("✅ Booking notification created successfully!");
      console.log("📋 Notification ID:", result.notification.id);
      
      // Wait a moment for the async SMS to process
      console.log("⏳ Waiting for async SMS processing...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check the notification status
      console.log("📊 Checking SMS status...");
      const checkResult = await UnifiedNotificationService.getNotificationById(result.notification.id);
      console.log("SMS Status:", {
        isSMSSent: checkResult?.isSMSSent,
        smsError: checkResult?.smsError,
        smsRequestId: checkResult?.smsRequestId
      });
      
    } else {
      console.log("❌ Failed to create booking notification:", result.message);
    }

  } catch (error) {
    console.error("❌ Error in real booking flow test:", error);
  }
}

debugRealBookingFlow();
