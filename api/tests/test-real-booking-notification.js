/**
 * Test Real Booking Notification Flow
 */

require('dotenv').config();
const BookingNotificationService = require('../services/bookingNotificationService');

async function testRealBookingNotification() {
  console.log("🔍 TESTING REAL BOOKING NOTIFICATION FLOW");
  console.log("=" .repeat(50));
  
  // Simulate a real booking object similar to what comes from the database
  const mockBooking = {
    id: 999,
    userId: 41, // Client
    placeId: 21, // Place owned by user 2 (Host)
    uniqueRequestId: "REQ-TEST-123",
    checkInDate: "2025-07-20",
    checkOutDate: "2025-07-20",
    timeSlots: [
      {
        date: "2025-07-20",
        startTime: "10:00",
        endTime: "11:00",
        dayOfWeek: "Saturday",
        formattedDate: "Jul 20, 2025"
      }
    ],
    totalPrice: 500000,
    numOfGuests: 5
  };

  try {
    console.log("📋 Creating booking request notification...");
    const notification = await BookingNotificationService.createBookingRequestNotification(mockBooking);
    
    if (notification) {
      console.log("✅ Notification created successfully!");
      console.log("📱 Notification ID:", notification.id);
    } else {
      console.log("ℹ️ No notification created (user booking own place)");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

testRealBookingNotification().catch(console.error);
