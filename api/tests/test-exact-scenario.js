/**
 * Test Exact User Scenario - Client111 booking Host's "Test Refund Options"
 */

require('dotenv').config();
const { User, Place } = require("../models");
const BookingNotificationService = require("../services/bookingNotificationService");

async function testExactUserScenario() {
  console.log("🔍 TESTING EXACT USER SCENARIO");
  console.log("=============================");
  console.log("Client: client111@gmail.com (+998999298936)");
  console.log("Host: host@gmail.com (+998993730907)");
  console.log("Place: Test Refund Options");
  console.log("Expected: Host should receive SMS notification");

  try {
    // Get exact users and place
    const clientUser = await User.findOne({ where: { email: "client111@gmail.com" } });
    const hostUser = await User.findOne({ where: { email: "host@gmail.com" } });
    const place = await Place.findOne({ where: { title: "Test Refund Options" } });

    console.log("\n✅ Data verified:");
    console.log("Client ID:", clientUser.id, "Phone:", clientUser.phoneNumber);
    console.log("Host ID:", hostUser.id, "Phone:", hostUser.phoneNumber);
    console.log("Place ID:", place.id, "Owner ID:", place.ownerId);
    console.log("Correct owner?", place.ownerId === hostUser.id);

    // Create the exact booking scenario
    const testBooking = {
      id: 88888,
      uniqueRequestId: "REQ-EXACT-SCENARIO",
      userId: clientUser.id,  // Client making the booking
      placeId: place.id,      // Host's place
      checkInDate: "2025-07-25",
      checkOutDate: "2025-07-25", 
      timeSlots: [{ startTime: "10:00", endTime: "14:00" }],
      totalPrice: 150,
      numOfGuests: 3
    };

    console.log("\n📝 Creating booking request notification...");
    console.log("This will send SMS to the HOST (place owner)");
    
    const result = await BookingNotificationService.createBookingRequestNotification(testBooking);
    
    if (result) {
      console.log("✅ Notification created successfully!");
      console.log("📋 Notification ID:", result.id);
      console.log("📱 SMS should be sent to host:", hostUser.phoneNumber);
      
      // Wait for SMS processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log("\n🔍 Check database:");
      console.log(`SELECT id, user_id, is_sms_sent, sms_error, message FROM notifications WHERE id = ${result.id};`);
      
    } else {
      console.log("❌ Notification creation failed");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testExactUserScenario();
