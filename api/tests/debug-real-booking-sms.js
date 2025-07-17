/**
 * Debug Real Booking SMS Test
 * Tests the exact same flow as real booking creation to identify SMS issues
 */

require('dotenv').config();

const { Booking, Place, User, Currency } = require("../models");
const BookingNotificationService = require("../services/bookingNotificationService");
const UnifiedNotificationService = require("../services/unifiedNotificationService");

async function debugRealBookingSMS() {
  console.log("🔍 DEBUGGING REAL BOOKING SMS FLOW");
  console.log("==================================");

  try {
    // Create a test booking similar to real flow
    const testBooking = {
      id: 999,
      userId: 41, // Client user
      placeId: 21, // Test place
      checkInDate: new Date('2025-07-20'),
      checkOutDate: new Date('2025-07-20'),
      totalPrice: 500000,
      numOfGuests: 2,
      timeSlots: [
        {
          date: "2025-07-20",
          startTime: "10:00",
          endTime: "12:00",
          dayOfWeek: "Sunday",
          formattedDate: "Jul 20, 2025"
        }
      ],
      uniqueRequestId: "REQ-DEBUG-TEST"
    };

    console.log("📋 Test booking data:", testBooking);

    // Step 1: Test notification creation directly
    console.log("\n📱 Step 1: Testing BookingNotificationService...");
    
    const notification = await BookingNotificationService.createBookingRequestNotification(testBooking);
    
    if (notification) {
      console.log("✅ Notification created successfully!");
      console.log("📋 Notification ID:", notification.id);
      console.log("📱 Message:", notification.message);
      
      // Check if SMS was sent
      const updatedNotification = await require("../models/notification").findByPk(notification.id);
      console.log("📞 SMS Status:");
      console.log("  - isSMSSent:", updatedNotification.isSMSSent);
      console.log("  - smsError:", updatedNotification.smsError);
      console.log("  - smsRequestId:", updatedNotification.smsRequestId);
      
    } else {
      console.log("❌ No notification created");
    }

    // Step 2: Test SMS service directly
    console.log("\n📞 Step 2: Testing SMS service directly...");
    
    const smsTest = await UnifiedNotificationService.testSMSService();
    console.log("SMS Test Result:", smsTest);

    // Step 3: Check user phone numbers
    console.log("\n👤 Step 3: Checking user phone numbers...");
    
    const hostUser = await User.findByPk(2, { // Host user
      attributes: ["id", "name", "phoneNumber"]
    });
    console.log("Host user:", hostUser ? hostUser.toJSON() : "Not found");
    
    const clientUser = await User.findByPk(41, { // Client user
      attributes: ["id", "name", "phoneNumber"] 
    });
    console.log("Client user:", clientUser ? clientUser.toJSON() : "Not found");

  } catch (error) {
    console.error("❌ Error in debug test:", error);
  }
}

// Run the debug test
debugRealBookingSMS();
