/**
 * Test Real Booking Flow with Real Users and Phone Numbers
 * Find actual users by phone numbers and test complete flow
 */

require('dotenv').config();
const { User } = require("../models");
const UnifiedNotificationService = require("../services/unifiedNotificationService");
const eskizSMSService = require("../services/eskizSMSService");

async function testRealBookingFlowWithRealUsers() {
  console.log("🔍 TESTING REAL BOOKING FLOW WITH REAL USERS");
  console.log("==========================================");

  try {
    console.log("⏰ Starting at:", new Date().toISOString());
    
    // Step 1: Find users by their real phone numbers
    console.log("\n👥 Step 1: Finding users by phone numbers...");
    
    const hostUser = await User.findOne({
      where: { phoneNumber: "+998993730907" },
      attributes: ["id", "name", "phoneNumber", "userType"]
    });
    
    const clientUser = await User.findOne({
      where: { phoneNumber: "+998999298936" },
      attributes: ["id", "name", "phoneNumber", "userType"]
    });
    
    if (!hostUser) {
      console.log("❌ Host user with phone +998993730907 not found");
      console.log("📋 Available users with phone numbers:");
      const usersWithPhones = await User.findAll({
        where: { phoneNumber: { [require("sequelize").Op.not]: null } },
        attributes: ["id", "name", "phoneNumber", "userType"],
        limit: 5
      });
      usersWithPhones.forEach(user => {
        console.log(`   ID: ${user.id}, Name: ${user.name}, Phone: ${user.phoneNumber}, Type: ${user.userType}`);
      });
      return;
    }
    
    if (!clientUser) {
      console.log("❌ Client user with phone +998999298936 not found");
      console.log("📋 Available users with phone numbers:");
      const usersWithPhones = await User.findAll({
        where: { phoneNumber: { [require("sequelize").Op.not]: null } },
        attributes: ["id", "name", "phoneNumber", "userType"],
        limit: 5
      });
      usersWithPhones.forEach(user => {
        console.log(`   ID: ${user.id}, Name: ${user.name}, Phone: ${user.phoneNumber}, Type: ${user.userType}`);
      });
      return;
    }
    
    console.log("✅ Found host user:", {
      id: hostUser.id,
      name: hostUser.name,
      phone: hostUser.phoneNumber,
      type: hostUser.userType
    });
    
    console.log("✅ Found client user:", {
      id: clientUser.id,
      name: clientUser.name,
      phone: clientUser.phoneNumber,
      type: clientUser.userType
    });
    
    // Step 2: Test SMS service connection
    console.log("\n📞 Step 2: Testing SMS service connection...");
    const connectionResult = await UnifiedNotificationService.testSMSService();
    console.log("Connection result:", connectionResult);
    
    // Step 3: Test host notification (booking request)
    console.log("\n📝 Step 3: Creating HOST notification (booking requested)...");
    const hostNotificationStartTime = Date.now();
    
    const hostResult = await UnifiedNotificationService.createBookingNotification({
      userId: hostUser.id,
      type: "booking_requested",
      title: "New Booking Request",
      message: `Booking #REQ-REAL-TEST requested for "Test Property" on Jul 22, 2025 from 14:00 to 18:00`,
      bookingId: 8888,
      placeId: 777,
      additionalMetadata: {
        realUserTest: true,
        hostPhone: hostUser.phoneNumber,
        timestamp: new Date().toISOString()
      }
    });
    
    const hostNotificationEndTime = Date.now();
    console.log(`✅ Host notification created in ${hostNotificationEndTime - hostNotificationStartTime}ms`);
    console.log("📋 Host Notification ID:", hostResult.notification.id);
    
    // Step 4: Test client notification (booking selected)
    console.log("\n📝 Step 4: Creating CLIENT notification (booking selected)...");
    const clientNotificationStartTime = Date.now();
    
    const clientResult = await UnifiedNotificationService.createBookingNotification({
      userId: clientUser.id,
      type: "booking_selected",
      title: "Booking Selected",
      message: `Booking #REQ-REAL-TEST for "Test Property" on Jul 22, 2025 from 14:00 to 18:00 has been selected. Please proceed with payment.`,
      bookingId: 8888,
      placeId: 777,
      additionalMetadata: {
        realUserTest: true,
        clientPhone: clientUser.phoneNumber,
        timestamp: new Date().toISOString()
      }
    });
    
    const clientNotificationEndTime = Date.now();
    console.log(`✅ Client notification created in ${clientNotificationEndTime - clientNotificationStartTime}ms`);
    console.log("📋 Client Notification ID:", clientResult.notification.id);
    
    // Step 5: Monitor async SMS processing
    console.log("\n📱 Step 5: Monitoring async SMS processing...");
    console.log("⏳ Waiting for SMS processing (15 seconds)...");
    
    for (let i = 1; i <= 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`📊 Wait ${i}/15 - SMS processing...`);
      
      if (i === 5) {
        console.log("🔍 Mid-check: SMS service state");
        console.log("   Token present:", eskizSMSService.token ? "Yes" : "No");
        console.log("   Token valid:", eskizSMSService.isTokenValid());
      }
      
      if (i === 10) {
        console.log("🧪 Testing direct SMS to both numbers...");
        
        // Test direct SMS to host
        const hostSMSTest = await eskizSMSService.sendSMS(
          hostUser.phoneNumber,
          "Direct test SMS to host during real flow"
        );
        console.log("Host direct SMS:", hostSMSTest.success ? "✅ Success" : `❌ Failed: ${hostSMSTest.error}`);
        
        // Test direct SMS to client
        const clientSMSTest = await eskizSMSService.sendSMS(
          clientUser.phoneNumber,
          "Direct test SMS to client during real flow"
        );
        console.log("Client direct SMS:", clientSMSTest.success ? "✅ Success" : `❌ Failed: ${clientSMSTest.error}`);
      }
    }
    
    // Step 6: Final status check
    console.log("\n📊 Step 6: Final status check...");
    console.log("⏰ Final check at:", new Date().toISOString());
    console.log("🔍 Host notification ID:", hostResult.notification.id);
    console.log("🔍 Client notification ID:", clientResult.notification.id);
    console.log("📋 Check database with these queries:");
    console.log(`   SELECT id, user_id, is_sms_sent, sms_error, sms_request_id FROM notifications WHERE id = ${hostResult.notification.id};`);
    console.log(`   SELECT id, user_id, is_sms_sent, sms_error, sms_request_id FROM notifications WHERE id = ${clientResult.notification.id};`);
    
    // Step 7: Test final SMS with approved format
    console.log("\n🧪 Step 7: Final SMS test with approved format...");
    const finalHostSMS = await eskizSMSService.sendSMS(
      hostUser.phoneNumber,
      "Booking #REQ-FINAL-HOST requested for \"Test Property\" on Jul 22, 2025 from 14:00 to 18:00"
    );
    
    const finalClientSMS = await eskizSMSService.sendSMS(
      clientUser.phoneNumber,
      "Booking #REQ-FINAL-CLIENT for \"Test Property\" on Jul 22, 2025 from 14:00 to 18:00 has been selected. Please proceed with payment."
    );
    
    console.log("Final host SMS result:", {
      success: finalHostSMS.success,
      error: finalHostSMS.error,
      requestId: finalHostSMS.requestId
    });
    
    console.log("Final client SMS result:", {
      success: finalClientSMS.success,
      error: finalClientSMS.error,
      requestId: finalClientSMS.requestId
    });
    
  } catch (error) {
    console.error("❌ Error in real booking flow test:", error);
  }
}

testRealBookingFlowWithRealUsers();
