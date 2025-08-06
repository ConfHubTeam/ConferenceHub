/**
 * Test to verify language fix for booking request notifications
 * This test simulates the real booking flow where a Russian client
 * makes a booking request to a Russian host
 */

const BookingNotificationService = require("../services/bookingNotificationService");
const { User, Place, Booking } = require("../models");
const { sequelize } = require("../config/database");

async function testBookingLanguageFix() {
  console.log("🧪 Testing Booking Language Fix");
  console.log("=" .repeat(50));

  try {
    // 1. Ensure host (user 3) is set to Russian
    console.log("\n🔧 Setting up test users...");
    await User.update(
      { preferredLanguage: "ru" },
      { where: { id: 3 } }
    );
    
    await User.update(
      { preferredLanguage: "ru" },
      { where: { id: 2 } }
    );

    // 2. Verify language settings
    console.log("\n✅ Verifying user language preferences:");
    const host = await User.findByPk(3, { attributes: ["id", "name", "userType", "preferredLanguage"] });
    const client = await User.findByPk(2, { attributes: ["id", "name", "userType", "preferredLanguage"] });
    
    console.log(`   Host (User ${host.id}): ${host.name} - Language: ${host.preferredLanguage}`);
    console.log(`   Client (User ${client.id}): ${client.name} - Language: ${client.preferredLanguage}`);

    // 3. Get the place owned by the host
    console.log("\n📍 Getting place info...");
    const place = await Place.findOne({
      where: { ownerId: 3 },
      include: [{
        model: User,
        as: "owner",
        attributes: ["id", "name", "preferredLanguage"]
      }]
    });

    if (!place) {
      console.log("❌ No place found for host");
      return;
    }

    console.log(`   Place: "${place.title}" owned by ${place.owner.name} (lang: ${place.owner.preferredLanguage})`);

    // 4. Create a test booking
    console.log("\n📝 Creating test booking...");
    const testBooking = {
      userId: 2, // client making booking
      placeId: place.id,
      checkInDate: new Date('2025-08-20'),
      checkOutDate: new Date('2025-08-22'),
      uniqueRequestId: 'LANG-TEST-' + Date.now(),
      totalPrice: 300.00,
      timeSlots: []
    };

    console.log(`   Booking: User ${testBooking.userId} booking Place ${testBooking.placeId}`);
    console.log(`   Reference: ${testBooking.uniqueRequestId}`);

    // 5. Test the notification creation
    console.log("\n🚀 Creating booking request notification...");
    
    const result = await BookingNotificationService.createBookingRequestNotification(testBooking);
    
    if (result) {
      console.log(`   ✅ Notification created successfully!`);
      console.log(`   📱 Notification ID: ${result.id}`);
      console.log(`   👤 Sent to User: ${result.userId}`);
      console.log(`   📄 Message: "${result.message}"`);
      
      // Check if message is in Russian
      if (result.message.includes("Запрос на бронирование")) {
        console.log("   ✅ SUCCESS: Message is in Russian! 🇷🇺");
      } else if (result.message.includes("Booking") && result.message.includes("requested")) {
        console.log("   ❌ ISSUE: Message is in English! 🇺🇸");
        console.log("   Expected Russian but got English message");
      } else {
        console.log("   ⚠️  UNKNOWN: Message format not recognized");
      }
    } else {
      console.log("   ⚠️  No notification created (might be same user booking own place)");
    }

    console.log("\n" + "=" .repeat(50));
    console.log("✅ Language fix test completed");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testBookingLanguageFix().then(() => {
  console.log("🏁 Test finished");
}).catch(error => {
  console.error("💥 Test error:", error);
});
