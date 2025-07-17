/**
 * Debug Web Server Context Authentication Issue
 * Simulate the exact conditions when a real booking happens through web interface
 */

require('dotenv').config();
const { User, Place } = require("../models");
const BookingNotificationService = require("../services/bookingNotificationService");
const eskizSMSService = require("../services/eskizSMSService");

async function debugWebServerAuthIssue() {
  console.log("🔍 DEBUGGING WEB SERVER AUTHENTICATION ISSUE");
  console.log("===========================================");

  try {
    console.log("⏰ Starting at:", new Date().toISOString());
    
    // Step 1: Get the real users and place data
    console.log("\n👥 Step 1: Getting real booking data...");
    
    const hostUser = await User.findOne({
      where: { email: "host@gmail.com" },
      attributes: ["id", "name", "email", "phoneNumber", "userType"]
    });
    
    const clientUser = await User.findOne({
      where: { email: "client111@gmail.com" }, 
      attributes: ["id", "name", "email", "phoneNumber", "userType"]
    });
    
    const place = await Place.findOne({
      where: { title: "Test Refund Options" },
      attributes: ["id", "title", "ownerId"],
      include: [{
        model: User,
        as: "owner",
        attributes: ["id", "name", "email", "phoneNumber"]
      }]
    });
    
    if (!hostUser || !clientUser || !place) {
      console.log("❌ Missing data:");
      console.log("Host user found:", !!hostUser);
      console.log("Client user found:", !!clientUser);
      console.log("Place found:", !!place);
      return;
    }
    
    console.log("✅ Real booking data found:");
    console.log("Host:", { id: hostUser.id, email: hostUser.email, phone: hostUser.phoneNumber });
    console.log("Client:", { id: clientUser.id, email: clientUser.email, phone: clientUser.phoneNumber });
    console.log("Place:", { id: place.id, title: place.title, ownerId: place.ownerId });
    console.log("Place owner:", place.owner ? { id: place.owner.id, phone: place.owner.phoneNumber } : "Not found");
    
    // Step 2: Check SMS service state before booking
    console.log("\n📱 Step 2: SMS service state before booking...");
    console.log("Initial token exists:", eskizSMSService.token ? "Yes" : "No");
    console.log("Initial token valid:", eskizSMSService.isTokenValid());
    
    // Step 3: Clear token to simulate fresh web server state
    console.log("\n🔄 Step 3: Simulating fresh web server state...");
    eskizSMSService.token = null;
    eskizSMSService.tokenExpiresAt = null;
    console.log("Cleared token and expiration");
    
    // Step 4: Create a mock booking object (like real booking flow)
    console.log("\n📋 Step 4: Creating mock booking for notification...");
    const mockBooking = {
      id: 99999,
      uniqueRequestId: "REQ-WEB-DEBUG-TEST",
      userId: clientUser.id,
      placeId: place.id,
      checkInDate: "2025-07-25",
      checkOutDate: "2025-07-25",
      timeSlots: [{ startTime: "14:00", endTime: "18:00" }],
      totalPrice: 100,
      numOfGuests: 2
    };
    
    console.log("Mock booking:", mockBooking);
    
    // Step 5: Call the EXACT same method as real booking flow
    console.log("\n📝 Step 5: Calling BookingNotificationService (real flow)...");
    console.log("This is the EXACT same call as real bookings use...");
    
    try {
      const startTime = Date.now();
      const notificationResult = await BookingNotificationService.createBookingRequestNotification(mockBooking);
      const endTime = Date.now();
      
      console.log(`✅ Notification created in ${endTime - startTime}ms`);
      console.log("Notification result:", notificationResult ? "Success" : "Failed");
      
      if (notificationResult) {
        console.log("Notification ID:", notificationResult.id);
        
        // Wait for async SMS processing
        console.log("⏳ Waiting for async SMS processing...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check the notification status in database
        console.log("🔍 Checking notification status...");
        console.log(`Query: SELECT id, is_sms_sent, sms_error, sms_request_id FROM notifications WHERE id = ${notificationResult.id};`);
      }
      
    } catch (notificationError) {
      console.error("❌ BookingNotificationService failed:", notificationError.message);
      console.error("Stack:", notificationError.stack);
    }
    
    // Step 6: Test SMS service state after notification attempt
    console.log("\n📱 Step 6: SMS service state after notification...");
    console.log("Final token exists:", eskizSMSService.token ? "Yes" : "No");
    console.log("Final token valid:", eskizSMSService.isTokenValid());
    
    // Step 7: Test direct SMS to confirm service works
    console.log("\n🧪 Step 7: Direct SMS test to confirm service works...");
    try {
      const directSMSResult = await eskizSMSService.sendSMS(
        hostUser.phoneNumber,
        "Booking #REQ-WEB-DEBUG-TEST requested for \"Test Refund Options\" on Jul 25, 2025 from 14:00 to 18:00"
      );
      
      console.log("Direct SMS result:", {
        success: directSMSResult.success,
        error: directSMSResult.error,
        requestId: directSMSResult.requestId
      });
    } catch (directSMSError) {
      console.error("Direct SMS failed:", directSMSError.message);
    }
    
  } catch (error) {
    console.error("❌ Error in web server debug:", error);
  }
}

debugWebServerAuthIssue();
