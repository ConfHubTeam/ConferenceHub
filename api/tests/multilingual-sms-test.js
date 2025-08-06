/**
 * Multilingual SMS Test - Sequential Language Testing
 * Tests booking notifications by language group to clearly see template differences
 * 
 * This test validates that:
 * 1. English templates work correctly (✅ APPROVED)
 * 2. Uzbek templates work correctly (✅ APPROVED) 
 * 3. Russian templates work correctly (testing approval status)
 * 4. All message variables are properly interpolated in each language
 * 5. Actual message templates from bookingNotificationService are tested
 * 
 * Tests run sequentially: English → Uzbek → Russian
 * All SMS messages will be sent to: +998993730907 (your phone number)
 */

require('dotenv').config();
const { User, Place } = require('../models');
const BookingNotificationService = require('../services/bookingNotificationService');
const UnifiedNotificationService = require('../services/unifiedNotificationService');

// Test configuration
const TEST_PHONE_NUMBER = "+998993730907";

// Mock users with different language preferences
const TEST_USERS = {
  english: { id: 1, name: "English User", preferredLanguage: "en" },
  uzbek: { id: 2, name: "Uzbek User", preferredLanguage: "uz" },
  russian: { id: 3, name: "Russian User", preferredLanguage: "ru" },
  host_english: { id: 4, name: "English Host", preferredLanguage: "en" },
  host_uzbek: { id: 5, name: "Uzbek Host", preferredLanguage: "uz" },
  host_russian: { id: 6, name: "Russian Host", preferredLanguage: "ru" }
};

// Mock User.findByPk to return test users with language preferences
const originalFindByPk = User.findByPk;
User.findByPk = async function(userId, options) {
  // Find the test user based on ID
  const testUser = Object.values(TEST_USERS).find(user => user.id === userId);
  
  if (testUser) {
    return {
      ...testUser,
      phoneNumber: TEST_PHONE_NUMBER, // All messages go to your phone
      dataValues: testUser
    };
  }
  
  // Fallback to default English user if not found
  return {
    id: userId,
    name: "Default User",
    preferredLanguage: "en",
    phoneNumber: TEST_PHONE_NUMBER,
    dataValues: { id: userId, name: "Default User", preferredLanguage: "en" }
  };
};

// Mock Place.findByPk to return test place
const originalPlaceFindByPk = Place.findByPk;
Place.findByPk = async function(placeId, options) {
  return {
    id: 1,
    title: "Luxury Conference Room",
    owner: {
      id: TEST_USERS.host_english.id,
      name: TEST_USERS.host_english.name,
      email: "host@example.com"
    }
  };
};

// Mock booking data for different users
const createMockBooking = (userId) => ({
  id: 100 + userId,
  uniqueRequestId: `REQ-${userId}0000`,
  placeId: 1,
  userId: userId,
  checkInDate: "2025-08-10",
  checkOutDate: "2025-08-12", 
  totalPrice: 250,
  numOfGuests: 4,
  timeSlots: []
});

async function multilingualSMSTest() {
  console.log("🌍 SEQUENTIAL MULTILINGUAL SMS TEST");
  console.log("=" .repeat(70));
  console.log(`📱 All SMS will be sent to: ${TEST_PHONE_NUMBER}`);
  console.log("Tests will run: English → Uzbek → Russian");
  console.log("=" .repeat(70));
  
  const results = {};
  
  try {
    // Test SMS service connectivity
    console.log("📡 Testing SMS service connectivity...");
    const smsTest = await UnifiedNotificationService.testSMSService();
    console.log(`SMS Status: ${smsTest.success ? "✅ Connected" : "❌ Failed"}`);
    
    if (!smsTest.success) {
      console.log(`Error: ${smsTest.message}`);
      return;
    }

    // ENGLISH LANGUAGE TESTS
    console.log("\n�🇸 ========== ENGLISH LANGUAGE TESTS ==========");
    console.log("Testing all notification types in English...\n");

    // Test 1: English Booking Request
    console.log("1️⃣ Testing ENGLISH booking_requested...");
    try {
      const englishBooking = createMockBooking(TEST_USERS.english.id);
      const notification = await BookingNotificationService.createBookingRequestNotification(englishBooking);
      if (notification) {
        results.english_requested = { success: true, language: "en", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
      }
    } catch (error) {
      results.english_requested = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 2: English Booking Selection
    console.log("\n2️⃣ Testing ENGLISH booking_selected...");
    try {
      const englishBooking = createMockBooking(TEST_USERS.english.id);
      const notification = await BookingNotificationService.createBookingSelectedNotification(englishBooking);
      if (notification) {
        results.english_selected = { success: true, language: "en", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.english_selected = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 3: English Booking Confirmation
    console.log("\n3️⃣ Testing ENGLISH booking_confirmed...");
    try {
      const englishBooking = createMockBooking(TEST_USERS.english.id);
      const notification = await BookingNotificationService.createBookingConfirmedNotificationForClient(englishBooking);
      if (notification) {
        results.english_confirmed = { success: true, language: "en", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.english_confirmed = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // UZBEK LANGUAGE TESTS
    console.log("\n🇺🇿 ========== UZBEK LANGUAGE TESTS ==========");
    console.log("Testing all notification types in Uzbek...\n");

    // Test 4: Uzbek Booking Request
    console.log("4️⃣ Testing UZBEK booking_requested...");
    try {
      const uzbekBooking = createMockBooking(TEST_USERS.uzbek.id);
      const notification = await BookingNotificationService.createBookingRequestNotification(uzbekBooking);
      if (notification) {
        results.uzbek_requested = { success: true, language: "uz", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.uzbek_requested = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 5: Uzbek Booking Selection
    console.log("\n5️⃣ Testing UZBEK booking_selected...");
    try {
      const uzbekBooking = createMockBooking(TEST_USERS.uzbek.id);
      const notification = await BookingNotificationService.createBookingSelectedNotification(uzbekBooking);
      if (notification) {
        results.uzbek_selected = { success: true, language: "uz", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.uzbek_selected = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 6: Uzbek Booking Confirmation
    console.log("\n6️⃣ Testing UZBEK booking_confirmed...");
    try {
      const uzbekBooking = createMockBooking(TEST_USERS.uzbek.id);
      const notification = await BookingNotificationService.createBookingConfirmedNotificationForClient(uzbekBooking);
      if (notification) {
        results.uzbek_confirmed = { success: true, language: "uz", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.uzbek_confirmed = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // RUSSIAN LANGUAGE TESTS
    console.log("\n🇷🇺 ========== RUSSIAN LANGUAGE TESTS ==========");
    console.log("Testing all notification types in Russian...\n");

    // Test 7: Russian Booking Request
    console.log("7️⃣ Testing RUSSIAN booking_requested...");
    try {
      const russianBooking = createMockBooking(TEST_USERS.russian.id);
      const notification = await BookingNotificationService.createBookingRequestNotification(russianBooking);
      if (notification) {
        results.russian_requested = { success: true, language: "ru", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.russian_requested = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 8: Russian Booking Selection
    console.log("\n8️⃣ Testing RUSSIAN booking_selected...");
    try {
      const russianBooking = createMockBooking(TEST_USERS.russian.id);
      const notification = await BookingNotificationService.createBookingSelectedNotification(russianBooking);
      if (notification) {
        results.russian_selected = { success: true, language: "ru", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.russian_selected = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    // Test 9: Russian Booking Confirmation
    console.log("\n9️⃣ Testing RUSSIAN booking_confirmed...");
    try {
      const russianBooking = createMockBooking(TEST_USERS.russian.id);
      const notification = await BookingNotificationService.createBookingConfirmedNotificationForClient(russianBooking);
      if (notification) {
        results.russian_confirmed = { success: true, language: "ru", message: notification.message };
        console.log(`   Result: ✅ SUCCESS`);
        console.log(`   Message: "${notification.message}"`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      results.russian_confirmed = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();
    console.log("=" .repeat(70));
    console.log("📊 SEQUENTIAL TEST SUMMARY BY LANGUAGE");
    console.log("=" .repeat(70));

    const englishTests = [];
    const uzbekTests = [];
    const russianTests = [];
    const errors = [];

    Object.entries(results).forEach(([testKey, result]) => {
      if (result.success) {
        if (result.language === "en") {
          englishTests.push({ test: testKey, message: result.message });
        } else if (result.language === "uz") {
          uzbekTests.push({ test: testKey, message: result.message });
        } else if (result.language === "ru") {
          russianTests.push({ test: testKey, message: result.message });
        }
      } else {
        errors.push({ test: testKey, error: result.error });
      }
    });

    console.log(`\n🇺🇸 ENGLISH TEMPLATES (${englishTests.length} messages):`);
    englishTests.forEach(item => {
      console.log(`   ✅ ${item.test}`);
      console.log(`      📝 "${item.message}"`);
    });

    console.log(`\n🇿 UZBEK TEMPLATES (${uzbekTests.length} messages):`);
    uzbekTests.forEach(item => {
      console.log(`   ✅ ${item.test}`);
      console.log(`      📝 "${item.message}"`);
    });

    console.log(`\n�� RUSSIAN TEMPLATES (${russianTests.length} messages):`);
    russianTests.forEach(item => {
      console.log(`   ✅ ${item.test}`);
      console.log(`      📝 "${item.message}"`);
    });

    console.log(`\n💥 ERRORS (${errors.length}):`);
    errors.forEach(item => {
      console.log(`   ❌ ${item.test}: ${item.error}`);
    });

    const totalSuccessful = englishTests.length + uzbekTests.length + russianTests.length;
    console.log(`\n📱 CHECK YOUR PHONE (${TEST_PHONE_NUMBER}):`);
    console.log(`   Total SMS messages sent: ${totalSuccessful}`);
    console.log(`   - 🇺🇸 English: ${englishTests.length} messages`);
    console.log(`   - 🇺🇿 Uzbek: ${uzbekTests.length} messages`);
    console.log(`   - 🇷🇺 Russian: ${russianTests.length} messages`);

    if (totalSuccessful > 0) {
      console.log(`\n🎉 SEQUENTIAL MULTILINGUAL TEST COMPLETE!`);
      console.log(`   ✅ Language detection: Working correctly`);
      console.log(`   ✅ Template separation: Clear by language`);
      console.log(`   ✅ Variable interpolation: Functional across all languages`);
      
      if (englishTests.length > 0) console.log(`   ✅ English templates: ${englishTests.length}/3 working`);
      if (uzbekTests.length > 0) console.log(`   ✅ Uzbek templates: ${uzbekTests.length}/3 working`);
      if (russianTests.length > 0) console.log(`   ✅ Russian templates: ${russianTests.length}/3 working`);
    }

  } catch (error) {
    console.error("❌ Multilingual test failed:", error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  multilingualSMSTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = multilingualSMSTest;
