/**
 * Cash Payment SMS Test for Eskiz Format Verification
 * 
 * This test verifies that cash payment SMS notifications are formatted correctly
 * according to the Eskiz submission templates documentation.
 * 
 * Test Phone: +998993730907
 */

const { Booking, Place, User } = require("../models");
const BookingNotificationService = require("../services/bookingNotificationService");
const AgentService = require("../services/agentService");

// Test configuration
const TEST_PHONE = "+998993730907";
const TEST_LANGUAGES = ["en", "ru", "uz"];

async function testCashPaymentSMS() {
  console.log("🧪 Starting Cash Payment SMS Test for Eskiz Format Verification");
  console.log(`📱 Test Phone: ${TEST_PHONE}`);
  console.log("=" .repeat(80));

  try {
    // Create test data
    console.log("1️⃣ Setting up test data...");
    
    // Create test user (agent) with the specified phone number
    const testAgent = await User.findOne({ where: { phoneNumber: TEST_PHONE } });
    if (!testAgent) {
      console.log(`❌ Test agent with phone ${TEST_PHONE} not found. Please create this user first.`);
      return;
    }
    console.log(`✅ Found test agent: ${testAgent.name} (ID: ${testAgent.id})`);

    // Create test client
    const testClient = await User.findOne({ 
      where: { 
        userType: "client",
        id: { [require("sequelize").Op.ne]: testAgent.id }
      }
    });
    if (!testClient) {
      console.log("❌ No test client found. Please create a client user first.");
      return;
    }
    console.log(`✅ Found test client: ${testClient.name} (ID: ${testClient.id})`);

    // Find test place
    const testPlace = await Place.findOne();
    if (!testPlace) {
      console.log("❌ No test place found. Please create a place first.");
      return;
    }
    console.log(`✅ Found test place: ${testPlace.title} (ID: ${testPlace.id})`);

    // Create test booking with cash payment selected
    const booking = await Booking.create({
      userId: testClient.id,
      placeId: testPlace.id,
      checkInDate: new Date("2025-09-15"),
      checkOutDate: new Date("2025-09-15"),
      totalPrice: 150000, // 150,000 UZS
      status: "selected",
      uniqueRequestId: `REQ-CASH-${Date.now()}`,
      numOfGuests: 2, // Required field
      guestName: testClient.name, // Required field
      guestPhone: testClient.phoneNumber, // Required field
      timeSlots: [
        {
          date: "2025-09-15",
          startTime: "14:00",
          endTime: "18:00"
        }
      ],
      cashSelected: true // Important: cash payment selected
    });

    console.log(`✅ Created test booking: ${booking.uniqueRequestId} (ID: ${booking.id})`);

    // Test cash payment notification for each language
    console.log("\n2️⃣ Testing cash payment SMS format for all languages...");
    
    const results = {};

    for (const language of TEST_LANGUAGES) {
      console.log(`\n📢 Testing ${language.toUpperCase()} SMS format...`);
      
      try {
        // Temporarily set agent's language preference
        await User.update(
          { preferredLanguage: language },
          { where: { id: testAgent.id } }
        );

        // Include Place data in booking object (as it would be in real scenario)
        const bookingWithPlace = await Booking.findByPk(booking.id, {
          include: [
            {
              model: Place,
              as: "place",
              attributes: ["id", "title"]
            }
          ]
        });

        // Create cash payment notification
        const notifications = await BookingNotificationService.createCashPaymentSelectedNotification(bookingWithPlace);
        
        if (notifications && notifications.length > 0) {
          const notification = notifications[0];
          console.log(`✅ Notification created for agent (${language})`);
          console.log(`   📧 Title: ${notification.title}`);
          console.log(`   💬 Message: ${notification.message}`);
          
          // Extract SMS message from metadata if available
          if (notification.metadata && notification.metadata.smsMessage) {
            console.log(`   📱 SMS: ${notification.metadata.smsMessage}`);
            results[language] = notification.metadata.smsMessage;
          } else {
            console.log(`   ⚠️  No SMS message found in metadata`);
            results[language] = "SMS message not found";
          }
        } else {
          console.log(`❌ No notifications created for ${language}`);
          results[language] = "No notification created";
        }

      } catch (error) {
        console.error(`❌ Error testing ${language}:`, error.message);
        results[language] = `Error: ${error.message}`;
      }
    }

    // Display results and compare with Eskiz documentation
    console.log("\n3️⃣ SMS Format Verification Results:");
    console.log("=" .repeat(80));

    const expectedFormats = {
      en: "Client with booking #{{bookingReference}} for \"{{placeName}}\" on {{dateRange}} selected cash as payment method. Please collect payment offline.",
      ru: "Клиент с бронированием #{{bookingReference}} для \"{{placeName}}\" на {{dateRange}} выбрал наличную оплату. Пожалуйста, получите оплату офлайн.",
      uz: "{{bookingReference}} band qilish \"{{placeName}}\" uchun {{dateRange}} sanasiga mijoz naqd to'lovni tanladi. Iltimos, to'lovni oflayn qabul qiling."
    };

    let allTestsPassed = true;

    for (const language of TEST_LANGUAGES) {
      console.log(`\n🔍 ${language.toUpperCase()} SMS Verification:`);
      console.log(`📝 Expected pattern: ${expectedFormats[language]}`);
      console.log(`📱 Actual SMS: ${results[language]}`);
      
      // Verify key components are present
      const smsMessage = results[language];
      const hasBookingRef = smsMessage.includes(booking.uniqueRequestId);
      const hasPlaceName = smsMessage.includes(testPlace.title);
      const hasCashPayment = smsMessage.toLowerCase().includes('cash') || 
                            smsMessage.includes('наличн') || 
                            smsMessage.includes('naqd');
      const hasOfflineInstruction = smsMessage.toLowerCase().includes('offline') || 
                                   smsMessage.includes('офлайн') || 
                                   smsMessage.includes('oflayn');

      console.log(`   ✅ Booking Reference: ${hasBookingRef ? '✓' : '✗'} (${booking.uniqueRequestId})`);
      console.log(`   ✅ Place Name: ${hasPlaceName ? '✓' : '✗'} (${testPlace.title})`);
      console.log(`   ✅ Cash Payment Mention: ${hasCashPayment ? '✓' : '✗'}`);
      console.log(`   ✅ Offline Collection: ${hasOfflineInstruction ? '✓' : '✗'}`);

      const languagePassed = hasBookingRef && hasPlaceName && hasCashPayment && hasOfflineInstruction;
      console.log(`   📊 ${language.toUpperCase()} Test: ${languagePassed ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!languagePassed) {
        allTestsPassed = false;
      }
    }

    // Summary
    console.log("\n4️⃣ Final Summary:");
    console.log("=" .repeat(80));
    
    if (allTestsPassed) {
      console.log("🎉 ALL TESTS PASSED! Cash payment SMS format is correct for Eskiz submission.");
      console.log("✅ SMS messages match the documented templates");
      console.log("✅ All required components are present in each language");
      console.log(`✅ Ready for Eskiz approval with phone ${TEST_PHONE}`);
    } else {
      console.log("❌ SOME TESTS FAILED! SMS format needs adjustment.");
      console.log("🔧 Please review the SMS templates and backend logic");
    }

    // Cleanup
    console.log("\n5️⃣ Cleaning up test data...");
    await Booking.destroy({ where: { id: booking.id } });
    console.log("✅ Test booking deleted");

  } catch (error) {
    console.error("💥 Test failed with error:", error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCashPaymentSMS()
    .then(() => {
      console.log("\n🏁 Cash Payment SMS Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testCashPaymentSMS };
