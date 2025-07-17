/**
 * Comprehensive Booking Flow SMS Test
 * Tests the complete booking workflow with three users: Host, Client, Agent
 * 
 * Flow:
 * 1. Client requests booking → Host gets SMS notification on requested booking
 * 2. Host or Agent selects booking → Client gets SMS on booking selection and to proceed with payment
 * 3. Client makes payment or Agent clicks Approved to mark payment and approval status → Agent gets SMS notification on payment. Host and CClient gets SMS on approval
 * 4. Agent mark paid to host → Host gets SMS confirmation
 */

require('dotenv').config();
const path = require('path');

// Import the unified notification service
const UnifiedNotificationService = require('../services/unifiedNotificationService');
const User = require('../models/users');

// Mock User.findByPk to return our test phone numbers
const originalFindByPk = User.findByPk;
User.findByPk = async function(userId, options) {
  // Define our test phone number mapping
  const testPhoneNumbers = {
    1: "+998993730907",  // Agent
    2: "+998993730907",  // Client 
    37: "+998993730907"  // Host
  };

  // Call original method
  const user = await originalFindByPk.call(this, userId, options);
  
  // Override phone number for test users
  if (user && testPhoneNumbers[userId]) {
    user.phoneNumber = testPhoneNumbers[userId];
  }
  
  return user;
};

class BookingFlowSMSTest {
  constructor() {
    // All using same phone number for testing - so you can see all SMS on one phone
    this.testUsers = {
      client: {
        id: 2, // Real host user (will act as client for test)
        name: "Host",
        email: "host@gmail.com", 
        phoneNumber: "+998993730907", // Your test phone number
        userType: "client" // Correct property name
      },
      host: {
        id: 37, // Real host user with phone
        name: "mak",
        email: "mak2@gmail.com",
        phoneNumber: "+998993730907", // Your test phone number
        userType: "host"
      },
      agent: {
        id: 1, // Real agent user
        name: "Support Team",
        email: "admin@conferencehub.com",
        phoneNumber: "+998993730907", // Your test phone number
        userType: "agent"
      }
    };

    // Test booking data
    this.testBooking = {
      id: "BR123456",
      placeName: "Luxury Apartment",
      checkIn: "2025-07-20",
      checkOut: "2025-07-22", 
      totalPrice: 250,
      clientName: "Host", // Updated to real name
      hostName: "mak", // Updated to real name
      payoutAmount: 200
    };

    this.flowResults = [];
  }

  /**
   * Step 1: Client requests booking - Host gets notification
   */
  async step1_ClientRequestsBooking() {
    console.log("🔵 STEP 1: Client requests booking → Host gets SMS notification");
    console.log("=" .repeat(60));
    
    try {
      // First attempt
      let result = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.host.id,
        type: 'booking_requested',
        title: "New Booking Request",
        message: `New booking request #${this.testBooking.id} for ${this.testBooking.placeName} on ${this.testBooking.checkIn}`,
        metadata: {
          bookingReference: this.testBooking.id,
          placeName: this.testBooking.placeName,
          dates: `${this.testBooking.checkIn} to ${this.testBooking.checkOut}`,
          guestName: this.testUsers.client.name,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut
        }
      });

      console.log(`📱 SMS sent to HOST: ${this.testUsers.host.name} (${this.testUsers.host.phoneNumber})`);
      console.log(`📋 Message: "New booking request #${this.testBooking.id} for ${this.testBooking.placeName} on ${this.testBooking.checkIn}"`);
      console.log(`✅ First attempt result: ${result.success ? "SUCCESS" : "FAILED"}`);
      
      // If first attempt failed, wait and retry
      if (!result.success) {
        console.log("⚠️  First SMS attempt failed, waiting 10 seconds before retry...");
        await this.delay(10000);
        
        console.log("🔄 Retrying booking request SMS...");
        result = await UnifiedNotificationService.createNotification({
          userId: this.testUsers.host.id,
          type: 'booking_requested',
          title: "New Booking Request",
          message: `New booking request #${this.testBooking.id} for ${this.testBooking.placeName} on ${this.testBooking.checkIn}`,
          metadata: {
            bookingReference: this.testBooking.id,
            placeName: this.testBooking.placeName,
            dates: `${this.testBooking.checkIn} to ${this.testBooking.checkOut}`,
            guestName: this.testUsers.client.name,
            checkInDate: this.testBooking.checkIn,
            checkOutDate: this.testBooking.checkOut
          }
        });
        
        console.log(`🔄 Retry result: ${result.success ? "SUCCESS" : "FAILED"}`);
      }
      
      console.log(`✅ Final Result: ${result.success ? "SUCCESS" : "FAILED"}`);
      
      this.flowResults.push({
        step: 1,
        description: "Client requests booking → Host SMS",
        recipient: "Host",
        phone: this.testUsers.host.phoneNumber,
        success: result.success
      });

      return result;
    } catch (error) {
      console.error("❌ Step 1 failed:", error.message);
      this.flowResults.push({
        step: 1,
        description: "Client requests booking → Host SMS",
        recipient: "Host",
        phone: this.testUsers.host.phoneNumber,
        success: false,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Step 2: Host/Agent selects booking - Client gets notification to pay
   */
  async step2_HostSelectsBooking() {
    console.log("\n� STEP 2: Host/Agent selects booking → Client gets SMS to proceed with payment");
    console.log("=" .repeat(60));
    
    try {
      const result = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.client.id,
        type: 'booking_selected',
        title: "Booking Selected",
        message: `Your booking #${this.testBooking.id} for ${this.testBooking.placeName} has been selected! Complete payment to confirm.`,
        metadata: {
          bookingReference: this.testBooking.id,
          placeName: this.testBooking.placeName,
          hostName: this.testUsers.host.name,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut
        }
      });

      console.log(`📱 SMS sent to CLIENT: ${this.testUsers.client.name} (${this.testUsers.client.phoneNumber})`);
      console.log(`📋 Message: "Your booking #${this.testBooking.id} for ${this.testBooking.placeName} has been selected! Complete payment to confirm."`);
      console.log(`✅ Result: ${result.success ? "SUCCESS" : "FAILED"}`);
      
      this.flowResults.push({
        step: 2,
        description: "Host selects booking → Client SMS",
        recipient: "Client",
        phone: this.testUsers.client.phoneNumber,
        success: result.success
      });

      return result;
    } catch (error) {
      console.error("❌ Step 2 failed:", error.message);
      this.flowResults.push({
        step: 2,
        description: "Host selects booking → Client SMS",
        recipient: "Client",
        phone: this.testUsers.client.phoneNumber,
        success: false,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Step 3: Client makes payment or Agent clicks Approved to mark payment and approval status → Agent gets SMS notification on payment. Host and Client gets SMS on approval
   */
  async step3_ClientMakesPaymentAndApproval() {
    console.log("\n💰 STEP 3: Client makes payment or Agent clicks Approved → Agent gets SMS on payment, Host and Client get SMS on approval");
    console.log("=" .repeat(60));
    
    try {
      // Part A: Agent gets SMS notification on payment
      console.log("📋 Part A: Sending payment notification to Agent...");
      const agentResult = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.agent.id,
        type: 'booking_payment_pending',
        title: "Payment Received",
        message: `Payment received for booking #${this.testBooking.id}. Payout to host ${this.testUsers.host.name} required.`,
        metadata: {
          bookingReference: this.testBooking.id,
          hostName: this.testUsers.host.name,
          clientName: this.testUsers.client.name,
          amount: `$${this.testBooking.totalPrice}`,
          placeName: this.testBooking.placeName
        }
      });

      console.log(`📱 SMS sent to AGENT: ${this.testUsers.agent.name} (${this.testUsers.agent.phoneNumber})`);
      console.log(`📋 Message: "Payment received for booking #${this.testBooking.id}. Payout to host ${this.testUsers.host.name} required."`);
      console.log(`✅ Agent SMS Result: ${agentResult.success ? "SUCCESS" : "FAILED"}`);

      // Small delay between notifications
      await this.delay(3000);

      // Part B: Host gets SMS on approval
      console.log("\n📋 Part B: Sending approval notification to Host...");
      const hostResult = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.host.id,
        type: 'booking_approved',
        title: "Booking Approved",
        message: `Booking #${this.testBooking.id} for ${this.testBooking.placeName} has been approved. Please proceed with payment.`,
        metadata: {
          bookingReference: this.testBooking.id,
          placeName: this.testBooking.placeName,
          clientName: this.testUsers.client.name,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut
        }
      });

      console.log(`📱 SMS sent to HOST: ${this.testUsers.host.name} (${this.testUsers.host.phoneNumber})`);
      console.log(`📋 Message: "Booking #${this.testBooking.id} for ${this.testBooking.placeName} has been approved. Please proceed with payment."`);
      console.log(`✅ Host SMS Result: ${hostResult.success ? "SUCCESS" : "FAILED"}`);

      // Small delay between notifications
      await this.delay(3000);

      // Part C: Client gets SMS on approval
      console.log("\n📋 Part C: Sending approval notification to Client...");
      const clientResult = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.client.id,
        type: 'booking_approved',
        title: "Booking Approved",
        message: `Booking #${this.testBooking.id} for ${this.testBooking.placeName} has been approved. Please proceed with payment.`,
        metadata: {
          bookingReference: this.testBooking.id,
          placeName: this.testBooking.placeName,
          hostName: this.testUsers.host.name,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut
        }
      });

      console.log(`📱 SMS sent to CLIENT: ${this.testUsers.client.name} (${this.testUsers.client.phoneNumber})`);
      console.log(`📋 Message: "Booking #${this.testBooking.id} for ${this.testBooking.placeName} has been approved. Please proceed with payment."`);
      console.log(`✅ Client SMS Result: ${clientResult.success ? "SUCCESS" : "FAILED"}`);

      // Record results for all three notifications
      this.flowResults.push({
        step: 3,
        description: "Payment/Approval → Agent SMS (payment notification)",
        recipient: "Agent", 
        phone: this.testUsers.agent.phoneNumber,
        success: agentResult.success
      });

      this.flowResults.push({
        step: 3,
        description: "Payment/Approval → Host SMS (approval notification)",
        recipient: "Host",
        phone: this.testUsers.host.phoneNumber,
        success: hostResult.success
      });

      this.flowResults.push({
        step: 3,
        description: "Payment/Approval → Client SMS (approval notification)",
        recipient: "Client",
        phone: this.testUsers.client.phoneNumber,
        success: clientResult.success
      });

      return { agentResult, hostResult, clientResult };
    } catch (error) {
      console.error("❌ Step 3 failed:", error.message);
      this.flowResults.push({
        step: 3,
        description: "Payment/Approval → Multiple SMS notifications",
        recipient: "Agent, Host, Client",
        phone: "Multiple",
        success: false,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Step 4: Agent mark paid to host → Host gets SMS confirmation
   */
  async step4_AgentMarksPaidToHost() {
    console.log("\n💸 STEP 4: Agent mark paid to host → Host gets SMS confirmation");
    console.log("=" .repeat(60));
    
    try {
      const result = await UnifiedNotificationService.createNotification({
        userId: this.testUsers.host.id,
        type: 'booking_paid_to_host',
        title: "Payout Processed",
        message: `Payout of $${this.testBooking.payoutAmount} has been processed for booking #${this.testBooking.id}`,
        metadata: {
          bookingReference: this.testBooking.id,
          placeName: this.testBooking.placeName,
          clientName: this.testUsers.client.name,
          amount: `$${this.testBooking.payoutAmount}`,
          checkInDate: this.testBooking.checkIn,
          checkOutDate: this.testBooking.checkOut
        }
      });

      console.log(`📱 SMS sent to HOST: ${this.testUsers.host.name} (${this.testUsers.host.phoneNumber})`);
      console.log(`📋 Message: "Payout of $${this.testBooking.payoutAmount} has been processed for booking #${this.testBooking.id}"`);
      console.log(`✅ Result: ${result.success ? "SUCCESS" : "FAILED"}`);
      
      this.flowResults.push({
        step: 4,
        description: "Agent mark paid to host → Host SMS confirmation",
        recipient: "Host",
        phone: this.testUsers.host.phoneNumber,
        success: result.success
      });

      return result;
    } catch (error) {
      console.error("❌ Step 4 failed:", error.message);
      this.flowResults.push({
        step: 4,
        description: "Agent mark paid to host → Host SMS confirmation",
        recipient: "Host",
        phone: this.testUsers.host.phoneNumber,
        success: false,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Print comprehensive test summary
   */
  printFlowSummary() {
    console.log("\n" + "=" .repeat(80));
    console.log("📊 BOOKING FLOW SMS TEST SUMMARY");
    console.log("=" .repeat(80));
    
    const successful = this.flowResults.filter(r => r.success);
    const failed = this.flowResults.filter(r => !r.success);
    
    console.log(`✅ Successful Steps: ${successful.length}/${this.flowResults.length}`);
    console.log(`❌ Failed Steps: ${failed.length}/${this.flowResults.length}`);
    
    console.log("\n📋 DETAILED RESULTS:");
    this.flowResults.forEach((result, index) => {
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      console.log(`Step ${result.step}: ${result.description}`);
      console.log(`   Recipient: ${result.recipient} (${result.phone})`);
      console.log(`   Status: ${status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log("");
    });

    console.log("📱 PHONE NUMBERS USED:");
    console.log(`   Client: ${this.testUsers.client.phoneNumber}`);
    console.log(`   Host: ${this.testUsers.host.phoneNumber}`);
    console.log(`   Agent: ${this.testUsers.agent.phoneNumber}`);

    console.log("\n🎯 FLOW ANALYSIS:");
    if (successful.length === this.flowResults.length) {
      console.log("🎉 ALL BOOKING FLOW STEPS WORKING!");
      console.log("✅ SMS integration is ready for production");
    } else if (successful.length > 0) {
      console.log("⚠️  PARTIAL SUCCESS - Some steps working");
      console.log("🔧 Check failed steps and SMS service configuration");
    } else {
      console.log("❌ NO STEPS WORKING - Check SMS service configuration");
    }

    console.log("\n📝 NEXT STEPS:");
    console.log("1. Update phone numbers in this test with real numbers");
    console.log("2. Test with actual users in your database");
    console.log("3. Integrate this flow into your booking controllers");
    console.log("4. Ensure notification triggers are added to booking endpoints");
  }

  /**
   * Run the complete booking flow test
   */
  async runCompleteFlow() {
    console.log("🚀 STARTING COMPREHENSIVE BOOKING FLOW SMS TEST");
    console.log("=" .repeat(80));
    console.log("📋 Testing complete booking workflow with 3 users:");
    console.log(`   Client: ${this.testUsers.client.name} (${this.testUsers.client.phoneNumber})`);
    console.log(`   Host: ${this.testUsers.host.name} (${this.testUsers.host.phoneNumber})`);
    console.log(`   Agent: ${this.testUsers.agent.name} (${this.testUsers.agent.phoneNumber})`);
    console.log("=" .repeat(80));

    try {
      // Initial delay to allow Eskiz API to fully initialize
      console.log("⏳ Initializing SMS service...");
      await this.delay(5000);

      // Step 1: Client requests booking
      await this.step1_ClientRequestsBooking();
      await this.delay(8000); // Increased to 8 second delay between steps

      // Step 2: Host selects booking  
      await this.step2_HostSelectsBooking();
      await this.delay(8000); // Increased to 8 second delay between steps

      // Step 3: Client makes payment or Agent clicks Approved → Agent gets SMS on payment, Host and Client get SMS on approval
      await this.step3_ClientMakesPaymentAndApproval();
      await this.delay(8000); // Increased to 8 second delay between steps

      // Step 4: Agent mark paid to host
      await this.step4_AgentMarksPaidToHost();

      // Print comprehensive summary
      this.printFlowSummary();

    } catch (error) {
      console.error("❌ Booking flow test suite failed:", error.message);
    }
  }

  /**
   * Utility function to add delay between steps
   */
  async delay(ms) {
    console.log(`⏳ Waiting ${ms/1000} seconds before next step...`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the comprehensive booking flow test
const flowTest = new BookingFlowSMSTest();
flowTest.runCompleteFlow().catch(console.error);
