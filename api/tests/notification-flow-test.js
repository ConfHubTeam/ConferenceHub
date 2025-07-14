/**
 * Test Booking Notification SMS Flow
 * Simulates actual application notification flow with test messages
 * 
 * Note: Review notifications are in-app only to reduce SMS costs
 */

require('dotenv').config();
const path = require('path');

// Import the unified notification service
const UnifiedNotificationService = require('../services/unifiedNotificationService');

class NotificationFlowTest {
  constructor() {
    // Test user data (simulating real users from database)
    this.testUsers = {
      guest: {
        id: 1,
        name: "John Guest",
        email: "guest@gmail.com", 
        phoneNumber: "+998993730907" // Using host's phone for testing
      },
      host: {
        id: 2,
        name: "Host User",
        email: "host@gmail.com",
        phoneNumber: "+998993730907"
      }
    };

    // Test place data
    this.testPlace = {
      id: 1,
      title: "Beautiful Apartment",
      location: "Tashkent, Uzbekistan",
      pricePerNight: 50
    };

    // Test booking data
    this.testBooking = {
      id: 1,
      checkIn: "2025-07-20",
      checkOut: "2025-07-22", 
      totalPrice: 100,
      status: "pending",
      guestId: 1,
      hostId: 2,
      placeId: 1
    };
  }

  /**
   * Test booking confirmation notification
   */
  async testBookingConfirmation() {
    console.log("📋 Testing Booking Confirmation SMS...");
    
    try {
      const notificationData = {
        type: 'booking_confirmed',
        userId: this.testUsers.guest.id,
        bookingId: this.testBooking.id,
        metadata: {
          guestName: this.testUsers.guest.name,
          hostName: this.testUsers.host.name,
          placeTitle: this.testPlace.title,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut,
          totalPrice: this.testBooking.totalPrice,
          bookingId: this.testBooking.id
        }
      };

      // Send to guest
      console.log(`📱 Sending booking confirmation to guest: ${this.testUsers.guest.phoneNumber}`);
      const guestResult = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.guest.id,
        type: notificationData.type,
        title: "Booking Confirmed",
        message: "Your booking has been confirmed",
        metadata: notificationData.metadata
      });

      console.log("Guest notification result:", {
        success: guestResult?.success || false,
        notificationId: guestResult?.notificationId
      });

      // Send to host
      const hostNotificationData = {
        ...notificationData,
        type: 'booking_requested'
      };

      console.log(`📱 Sending new booking notification to host: ${this.testUsers.host.phoneNumber}`);
      const hostResult = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.host.id,
        type: hostNotificationData.type,
        title: "New Booking Request",
        message: "You have a new booking request",
        metadata: hostNotificationData.metadata
      });

      console.log("Host notification result:", {
        success: hostResult?.success || false,
        notificationId: hostResult?.notificationId
      });

      return { guestResult, hostResult };
    } catch (error) {
      console.error("❌ Booking confirmation test failed:", error.message);
      return null;
    }
  }

  /**
   * Test booking status update notification
   */
  async testBookingStatusUpdate() {
    console.log("\n📋 Testing Booking Status Update SMS...");
    
    try {
      const notificationData = {
        type: 'booking_approved',
        userId: this.testUsers.guest.id,
        bookingId: this.testBooking.id,
        metadata: {
          guestName: this.testUsers.guest.name,
          hostName: this.testUsers.host.name,
          placeTitle: this.testPlace.title,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut,
          bookingId: this.testBooking.id,
          previousStatus: 'pending',
          newStatus: 'approved'
        }
      };

      console.log(`📱 Sending booking approval to guest: ${this.testUsers.guest.phoneNumber}`);
      const result = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.guest.id,
        type: notificationData.type,
        title: "Booking Approved",
        message: "Your booking has been approved",
        metadata: notificationData.metadata
      });

      console.log("Booking approval result:", {
        success: result?.success || false,
        notificationId: result?.notificationId
      });

      return result;
    } catch (error) {
      console.error("❌ Booking status update test failed:", error.message);
      return null;
    }
  }

  /**
   * Run all notification flow tests
   */
  async runAllTests() {
    console.log("🚀 Testing SMS Notification Flows");
    console.log("=" .repeat(60));
    console.log("📝 Note: Using approved test message due to test account limitations");
    console.log("📝 With paid account, custom messages will work automatically");
    console.log("📝 Review notifications are in-app only to reduce SMS costs");
    console.log("=" .repeat(60));

    const results = {
      bookingConfirmation: false,
      bookingStatusUpdate: false
    };

    try {
      // Test 1: Booking Confirmation Flow
      const bookingResult = await this.testBookingConfirmation();
      results.bookingConfirmation = bookingResult && 
        (bookingResult.guestResult?.success || bookingResult.hostResult?.success);

      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Booking Status Update
      const statusResult = await this.testBookingStatusUpdate();
      results.bookingStatusUpdate = statusResult?.success || false;

      // Summary
      console.log("\n" + "=" .repeat(60));
      console.log("📊 SMS Notification Flow Test Results:");
      console.log(`📋 Booking Confirmation: ${results.bookingConfirmation ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`📋 Booking Status Update: ${results.bookingStatusUpdate ? "✅ PASS" : "❌ FAIL"}`);

      const passedCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;

      console.log(`\n🎯 Overall: ${passedCount}/${totalTests} booking notification flows working`);

      if (passedCount === totalTests) {
        console.log("🎉 All booking notification flows working! SMS integration ready for production.");
      } else if (passedCount > 0) {
        console.log("⚠️  Some flows working. Check individual results above.");
      } else {
        console.log("❌ No SMS flows working. Check SMS service configuration.");
      }

      console.log("\n📝 Next Steps:");
      console.log("1. Upgrade to paid Eskiz account for custom messages");
      console.log("2. Custom booking messages will work automatically");
      console.log("3. Review notifications remain in-app only");
      console.log("4. Check your phone for test SMS messages");

    } catch (error) {
      console.error("❌ Notification flow test suite failed:", error.message);
    }
  }
}

// Run the tests
const tester = new NotificationFlowTest();
tester.runAllTests().catch(console.error);
