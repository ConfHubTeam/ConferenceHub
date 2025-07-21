/**
 * Debug SMS Test - Just test the first booking request SMS
 */

require('dotenv').config();
const UnifiedNotificationService = require('../services/unifiedNotificationService');
const User = require('../models/users');

// Mock User.findByPk to return our test phone numbers
const originalFindByPk = User.findByPk;
User.findByPk = async function(userId, options) {
  const testPhoneNumbers = {
    37: "+998993730907"  // Host
  };

  const user = await originalFindByPk.call(this, userId, options);
  
  if (user && testPhoneNumbers[userId]) {
    user.phoneNumber = testPhoneNumbers[userId];
  }
  
  return user;
};

async function debugBookingRequestSMS() {
  console.log("🔍 DEBUGGING: Booking Request SMS");
  console.log("=" .repeat(50));
  
  try {
    const result = await UnifiedNotificationService.createNotification({
      userId: 37, // Host user
      type: 'booking_requested',
      title: "New Booking Request",
      message: `New booking request #BR123456 for Luxury Apartment on 2025-07-20`,
      metadata: {
        bookingReference: "BR123456",
        placeName: "Luxury Apartment", 
        dates: "2025-07-20",  // Simplified dates
        guestName: "Test Client",
        checkInDate: "2025-07-20",
        checkOutDate: "2025-07-22"
      }
    });

    console.log("📱 SMS Result:", result);
    console.log("✅ Test complete");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

debugBookingRequestSMS().catch(console.error);
