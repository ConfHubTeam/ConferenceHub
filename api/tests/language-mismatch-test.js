/**
 * Test to reproduce language mismatch issue:
 * Russian client sends booking request to Russian host,
 * but host receives SMS in English instead of Russian
 */

const BookingNotificationService = require("../services/bookingNotificationService");
const { User, Place, Booking } = require("../models");
const { sequelize } = require("../config/database");

async function testLanguageMismatch() {
  console.log("🧪 Testing Language Mismatch Issue");
  console.log("=" .repeat(60));

  try {
    // 1. Check current user language preferences
    console.log("\n📋 Current User Language Preferences:");
    const users = await User.findAll({
      where: { id: [1, 2, 3] },
      attributes: ["id", "name", "userType", "preferredLanguage"]
    });
    
    users.forEach(user => {
      console.log(`   User ${user.id} (${user.name}, ${user.userType}): ${user.preferredLanguage || 'null'}`);
    });

    // 2. Test getting user language for each user
    console.log("\n🔍 Testing _getUserLanguage method:");
    for (const user of users) {
      const detectedLang = await BookingNotificationService._getUserLanguage(user.id);
      console.log(`   User ${user.id}: stored="${user.preferredLanguage || 'null'}" -> detected="${detectedLang}"`);
    }

    // 3. Set host (user 3) to Russian preference
    console.log("\n🔧 Setting host (user 3) language to Russian...");
    await User.update(
      { preferredLanguage: "ru" },
      { where: { id: 3 } }
    );

    // 4. Set client (user 2) to Russian preference  
    console.log("🔧 Setting client (user 2) language to Russian...");
    await User.update(
      { preferredLanguage: "ru" },
      { where: { id: 2 } }
    );

    // 5. Verify language updates
    console.log("\n✅ Verifying language updates:");
    const updatedUsers = await User.findAll({
      where: { id: [2, 3] },
      attributes: ["id", "name", "preferredLanguage"]
    });
    
    updatedUsers.forEach(user => {
      console.log(`   User ${user.id} (${user.name}): ${user.preferredLanguage}`);
    });

    // 6. Test language detection after updates
    console.log("\n🔍 Testing _getUserLanguage after updates:");
    for (const user of updatedUsers) {
      const detectedLang = await BookingNotificationService._getUserLanguage(user.id);
      console.log(`   User ${user.id}: stored="${user.preferredLanguage}" -> detected="${detectedLang}"`);
    }

    // 7. Create a test booking request notification
    console.log("\n📝 Creating test booking request notification...");
    
    // Get place owned by user 3 (host)
    const place = await Place.findOne({
      where: { ownerId: 3 },
      include: [{
        model: User,
        as: "owner",
        attributes: ["id", "name", "preferredLanguage"]
      }]
    });

    if (!place) {
      console.log("❌ No place found for user 3");
      return;
    }

    console.log(`   Place: "${place.title}" owned by User ${place.owner.id} (${place.owner.name})`);
    console.log(`   Owner's language: ${place.owner.preferredLanguage}`);

    // Create test booking by user 2 (client)
    const testBooking = {
      id: 99999,
      userId: 2, // client making booking
      placeId: place.id,
      checkInDate: new Date('2025-08-15'),
      checkOutDate: new Date('2025-08-17'),
      uniqueRequestId: 'TEST-' + Date.now(),
      totalPrice: 250.00
    };

    console.log(`   Booking by User ${testBooking.userId} for place owned by User ${place.owner.id}`);

    // 8. Test the actual notification creation
    console.log("\n🚀 Creating booking request notification...");
    
    // Manually test the language detection in createBookingRequestNotification
    const hostLanguage = await BookingNotificationService._getUserLanguage(place.owner.id);
    console.log(`   🎯 Host language detected: "${hostLanguage}"`);

    // Test message generation
    const { translate } = require('../i18n/config');
    
    // Wait for i18n initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const testMessage = translate("booking.requested", {
      lng: hostLanguage,
      ns: "sms",
      bookingReference: testBooking.uniqueRequestId,
      placeName: place.title,
      dateRange: "Aug 15, 2025 - Aug 17, 2025"
    });

    console.log(`   📱 Generated SMS message (${hostLanguage}): "${testMessage}"`);

    // Compare with English version
    const englishMessage = translate("booking.requested", {
      lng: "en",
      ns: "sms", 
      bookingReference: testBooking.uniqueRequestId,
      placeName: place.title,
      dateRange: "Aug 15, 2025 - Aug 17, 2025"
    });

    console.log(`   📱 English version: "${englishMessage}"`);

    // Check if they're different
    if (testMessage === englishMessage) {
      console.log("   ❌ ISSUE FOUND: Russian message is same as English!");
    } else {
      console.log("   ✅ Messages are different - language detection working");
    }

    console.log("\n" + "=" .repeat(60));
    console.log("✅ Language mismatch test completed");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testLanguageMismatch().then(() => {
  console.log("🏁 Test finished");
}).catch(error => {
  console.error("💥 Test error:", error);
});
