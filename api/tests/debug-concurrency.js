/**
 * Debug Concurrency and Real Request Simulation
 * Simulate multiple concurrent booking requests like a real web server
 */

require('dotenv').config();
const UnifiedNotificationService = require("../services/unifiedNotificationService");

async function simulateRealWebServerLoad() {
  console.log("🔍 SIMULATING REAL WEB SERVER LOAD");
  console.log("=================================");

  try {
    // Simulate 3 concurrent booking requests happening simultaneously
    console.log("📱 Simulating 3 concurrent booking notifications...");
    
    const promises = [
      UnifiedNotificationService.createBookingNotification({
        userId: 42, // Host ID
        type: "booking_requested", 
        title: "New Booking Request",
        message: "Booking #REQ-CONCURRENT-1 requested for \"Test Place 1\" on Jul 22, 2025 from 02:00 to 07:00",
        bookingId: 1001,
        placeId: 201,
        additionalMetadata: { concurrentTest: "request1" }
      }),
      
      UnifiedNotificationService.createBookingNotification({
        userId: 2, // Different user
        type: "booking_selected",
        title: "Booking Selected", 
        message: "Booking #REQ-CONCURRENT-2 for \"Test Place 2\" on Jul 23, 2025 from 10:00 to 15:00 has been selected. Please proceed with payment.",
        bookingId: 1002,
        placeId: 202,
        additionalMetadata: { concurrentTest: "request2" }
      }),
      
      UnifiedNotificationService.createBookingNotification({
        userId: 37, // Another user
        type: "booking_confirmed",
        title: "Booking Confirmed",
        message: "Your booking #REQ-CONCURRENT-3 for \"Test Place 3\" on Jul 24, 2025 from 18:00 to 22:00 has been confirmed! Payment processed successfully.",
        bookingId: 1003,
        placeId: 203, 
        additionalMetadata: { concurrentTest: "request3" }
      })
    ];

    // Execute all concurrent requests
    const results = await Promise.allSettled(promises);
    
    console.log("\n📊 Concurrent Request Results:");
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Request ${index + 1}: Success - Notification ID ${result.value.notification.id}`);
      } else {
        console.log(`❌ Request ${index + 1}: Failed - ${result.reason.message}`);
      }
    });

    // Wait for async SMS processing
    console.log("\n⏳ Waiting for SMS processing...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Check SMS statuses
    console.log("\n📱 Checking SMS statuses...");
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        const notificationId = results[i].value.notification.id;
        // We'll check via database since we don't have getNotificationById method
        console.log(`📋 Notification ${notificationId} created - check database for SMS status`);
      }
    }

  } catch (error) {
    console.error("❌ Error in concurrent simulation:", error);
  }
}

simulateRealWebServerLoad();
