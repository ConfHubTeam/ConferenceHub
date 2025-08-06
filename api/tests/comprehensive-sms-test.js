/**
 * Comprehensive SMS Test - All Booking Notification Types with Language Support
 * Tests all booking notification patterns to see which are approved in Eskiz
 * Now includes support for testing different language preferences (en, ru, uz)
 * 
 * All SMS messages will be sent to: +998993730907 (your phone number)
 * This includes notifications for host, client, and agent user types
 * 
 * Usage:
 * - node tests/comprehensive-sms-test.js         (default: English)
 * - node tests/comprehensive-sms-test.js ru      (Russian messages)  
 * - node tests/comprehensive-sms-test.js uz      (Uzbek messages)
 */

require('dotenv').config();
const { User } = require('../models');
const BookingNotificationService = require('../services/bookingNotificationService');
const UnifiedNotificationService = require('../services/unifiedNotificationService');

// Get language preference from command line argument
const testLanguage = process.argv[2] || "en";
const supportedLanguages = ["en", "ru", "uz"];

if (!supportedLanguages.includes(testLanguage)) {
  console.error(`❌ Unsupported language: ${testLanguage}`);
  console.error(`Supported languages: ${supportedLanguages.join(", ")}`);
  process.exit(1);
}

console.log(`🌍 Testing SMS notifications in: ${testLanguage.toUpperCase()}`);

// Mock User.findByPk to use your single phone number and specified language
const originalFindByPk = User.findByPk;
User.findByPk = async function(userId, options) {
  const testPhoneNumber = "+998993730907";   // Your phone number for all users

  const user = await originalFindByPk.call(this, userId, options);
  
  if (user) {
    user.phoneNumber = testPhoneNumber;
    user.preferredLanguage = testLanguage; // Set the test language
    user.dataValues = user.dataValues || {};
    user.dataValues.preferredLanguage = testLanguage;
  }
  
  return user;
};

// Mock booking data
const mockBooking = {
  id: 123,
  uniqueRequestId: "REQ-67890",
  placeId: 1,
  userId: 3,
  checkInDate: "2025-08-10",
  checkOutDate: "2025-08-12",
  totalPrice: 150,
  numOfGuests: 4,
  timeSlots: []
};

// Mock place data
const { Place } = require('../models');
const originalPlaceFindByPk = Place.findByPk;
Place.findByPk = async function(placeId, options) {
  return {
    id: 1,
    title: "Luxury Conference Room",
    owner: {
      id: 2,
      name: "Host User",
      email: "host@gmail.com"
    }
  };
};

async function comprehensiveSMSTest() {
  console.log("🚀 COMPREHENSIVE SMS APPROVAL TEST");
  console.log("=" .repeat(60));
  
  const results = {};
  
  try {
    // Test SMS service first
    console.log("📱 Testing SMS service connectivity...");
    const smsTest = await UnifiedNotificationService.testSMSService();
    console.log(`SMS Status: ${smsTest.success ? "✅ Connected" : "❌ Failed"}`);
    
    if (!smsTest.success) {
      console.log(`Error: ${smsTest.message}`);
      return;
    }

    console.log("\n📋 Testing all booking notification types...\n");

    // Test 1: Booking Request
    console.log("1️⃣ Testing booking_requested...");
    try {
      const notification = await BookingNotificationService.createBookingRequestNotification(mockBooking);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_requested = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_requested = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 2: Booking Selected
    console.log("2️⃣ Testing booking_selected...");
    try {
      const notification = await BookingNotificationService.createBookingSelectedNotification(mockBooking);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_selected = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_selected = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 3: Booking Approved (by host)
    console.log("3️⃣ Testing booking_approved (by host)...");
    try {
      const notification = await BookingNotificationService.createBookingApprovedNotification(mockBooking, false);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_approved_host = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_approved_host = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 4: Booking Approved (by agent)
    console.log("4️⃣ Testing booking_approved (by agent)...");
    try {
      const notification = await BookingNotificationService.createBookingApprovedNotification(mockBooking, true);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_approved_agent = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_approved_agent = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 5: Booking Confirmed (host)
    console.log("5️⃣ Testing booking_confirmed (host notification)...");
    try {
      const notification = await BookingNotificationService.createBookingConfirmedNotification(mockBooking);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_confirmed_host = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_confirmed_host = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 6: Booking Confirmed (client)
    console.log("6️⃣ Testing booking_confirmed (client notification)...");
    try {
      const notification = await BookingNotificationService.createBookingConfirmedNotificationForClient(mockBooking);
      if (notification) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notification.id);
        results.booking_confirmed_client = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_confirmed_client = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();

    // Test 7: Payment Received (agent notification)
    console.log("7️⃣ Testing booking_paid (payment notification to agents)...");
    try {
      // Mock AgentService
      const originalAgentService = require('../services/agentService');
      const mockAgentService = {
        getAllAgents: async () => [{ id: 1, name: "System Agent" }]
      };
      require.cache[require.resolve('../services/agentService')] = { exports: mockAgentService };

      const notifications = await BookingNotificationService.createBookingPaidNotification(mockBooking);
      if (notifications && notifications.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const updated = await require("../models/notification").findByPk(notifications[0].id);
        results.booking_paid = {
          success: updated.isSMSSent,
          error: updated.smsError,
          message: updated.message
        };
        console.log(`   Result: ${updated.isSMSSent ? "✅ APPROVED" : "❌ NEEDS APPROVAL"}`);
        if (updated.smsError) console.log(`   Error: ${updated.smsError}`);
        console.log(`   Message: "${updated.message}"`);
      }
    } catch (error) {
      results.booking_paid = { success: false, error: error.message };
      console.log(`   Result: ❌ ERROR - ${error.message}`);
    }

    console.log();
    console.log("=" .repeat(60));
    console.log("📊 SUMMARY REPORT");
    console.log("=" .repeat(60));

    const approved = [];
    const needsApproval = [];
    const errors = [];

    Object.entries(results).forEach(([type, result]) => {
      if (result.success) {
        approved.push(type);
      } else if (result.error && result.error.includes('модерацию')) {
        needsApproval.push({ type, message: result.message });
      } else {
        errors.push({ type, error: result.error });
      }
    });

    console.log(`\n✅ APPROVED MESSAGES (${approved.length}):`);
    approved.forEach(type => console.log(`   - ${type}`));

    console.log(`\n❌ NEEDS ESKIZ APPROVAL (${needsApproval.length}):`);
    needsApproval.forEach(item => {
      console.log(`   - ${item.type}`);
      console.log(`     Message: "${item.message}"`);
    });

    console.log(`\n💥 ERRORS (${errors.length}):`);
    errors.forEach(item => {
      console.log(`   - ${item.type}: ${item.error}`);
    });

    console.log(`\n📱 Check your phone (+998993730907):`);
    console.log(`   You should receive ${approved.length} SMS messages in total`);
    console.log(`   Messages will be for all user types: host, client, and agent notifications`);

  } catch (error) {
    console.error("❌ Comprehensive test failed:", error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  comprehensiveSMSTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = comprehensiveSMSTest;
