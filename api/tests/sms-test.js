/**
 * Simple SMS Test Script using Eskiz API
 * Tests SMS functionality with actual credentials
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

// Test configuration
const TEST_PHONE = "+998993730907"; // Host's phone number

// Approved SMS Templates for testing
const APPROVED_TEMPLATES = [
  // 1. Booking Request Templates
  {
    category: "Booking Request",
    template: "New booking request #{bookingReference} for {placeName} on {dates}",
    message: "New booking request #BR123456 for Luxury Apartment on 2025-07-20"
  },
  
  // 2. Booking Selection Templates
  {
    category: "Booking Selection",
    template: "Your booking #{bookingReference} for {placeName} has been selected! Complete payment to confirm.",
    message: "Your booking #BR123456 for Luxury Apartment has been selected! Complete payment to confirm."
  },
  
  // 3. Booking Approval Templates
  {
    category: "Booking Approval",
    template: "Booking #{bookingReference} for {placeName} has been approved. Please proceed with payment.",
    message: "Booking #BR123456 for Luxury Apartment has been approved. Please proceed with payment."
  },
  
  // 4. Booking Confirmation Templates
  {
    category: "Booking Confirmation 1",
    template: "Great news! Your booking #{bookingReference} for {placeName} is confirmed.",
    message: "Great news! Your booking #BR123456 for Luxury Apartment is confirmed."
  },
  {
    category: "Booking Confirmation 2",
    template: "Booking #{bookingReference} for {placeName} confirmed - payment received from {clientName}",
    message: "Booking #BR123456 for Luxury Apartment confirmed - payment received from John Doe"
  },
  {
    category: "Booking Confirmation 3",
    template: "Your stay at {placeName} is confirmed for {dates}. Check-in instructions will follow.",
    message: "Your stay at Luxury Apartment is confirmed for 2025-07-20. Check-in instructions will follow."
  },
  
  // 5. Payment Templates
  {
    category: "Payment Host Notification",
    template: "Payment received for booking #{bookingReference}. Payout to host {hostName} required.",
    message: "Payment received for booking #BR123456. Payout to host Maria Smith required."
  },
  {
    category: "Payment Confirmation",
    template: "Payment of {amount} confirmed for your booking #{bookingReference}",
    message: "Payment of $250 confirmed for your booking #BR123456"
  },
  
  // 6. Booking Rejection Templates
  {
    category: "Booking Rejection",
    template: "Your booking #{bookingReference} for {placeName} was declined.",
    message: "Your booking #BR123456 for Luxury Apartment was declined."
  },
  
  // 7. Payout Templates
  {
    category: "Payout Confirmation",
    template: "Payout of {amount} has been processed for booking #{bookingReference}",
    message: "Payout of $200 has been processed for booking #BR123456"
  }
];

class EskizSMSTest {
  constructor() {
    this.baseURL = process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz/api";
    this.email = process.env.ESKIZ_EMAIL;
    this.secretCode = process.env.ESKIZ_SECRET_CODE;
    this.from = process.env.ESKIZ_FROM || "4546";
    this.token = null;
  }

  /**
   * Authenticate with Eskiz API
   */
  async authenticate() {
    try {
      console.log("🔐 Authenticating with Eskiz API...");
      console.log(`Email: ${this.email}`);
      console.log(`Base URL: ${this.baseURL}`);

      const formData = new FormData();
      formData.append('email', this.email);
      formData.append('password', this.secretCode);

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.baseURL}/auth/login`,
        headers: {
          ...formData.getHeaders()
        },
        data: formData
      };

      const response = await axios(config);
      
      console.log("✅ Authentication Response:", JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        console.log(`🎉 Authentication successful! Token: ${this.token.substring(0, 20)}...`);
        
        // Decode token to check account type
        try {
          const tokenPayload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
          console.log("📋 Account Details:", {
            role: tokenPayload.role,
            subject: tokenPayload.sub,
            expires: new Date(tokenPayload.exp * 1000).toLocaleString()
          });
        } catch (error) {
          console.warn("Could not decode token to check account type");
        }
        
        return this.token;
      } else {
        throw new Error("Invalid authentication response from Eskiz API");
      }
    } catch (error) {
      console.error("❌ Authentication failed:");
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error message:", error.message);
      }
      throw error;
    }
  }

  /**
   * Send SMS with a specific message
   */
  async sendSMS(message, description = "") {
    try {
      console.log(`\n📱 Sending SMS: ${description}`);
      console.log(`Phone: ${TEST_PHONE}`);
      console.log(`Message: ${message}`);

      // Clean phone number for Uzbekistan format
      const cleanPhone = TEST_PHONE.replace(/\D/g, '');

      const formData = new FormData();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', message);
      formData.append('from', this.from);

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${this.baseURL}/message/sms/send`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        data: formData
      };

      const response = await axios(config);
      
      console.log(`✅ SMS Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        console.log(`🎉 SMS sent successfully! (${description})`);
        return response.data;
      } else {
        throw new Error("Invalid SMS response");
      }
    } catch (error) {
      console.error(`❌ SMS sending failed for ${description}:`);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error message:", error.message);
      }
      return { error: error.message, description };
    }
  }

  /**
   * Test all approved templates
   */
  async testAllTemplates() {
    console.log("\n🧪 Testing All Approved SMS Templates");
    console.log("=" .repeat(60));
    
    const results = [];
    
    for (let i = 0; i < APPROVED_TEMPLATES.length; i++) {
      const template = APPROVED_TEMPLATES[i];
      
      console.log(`\n📋 Template ${i + 1}/${APPROVED_TEMPLATES.length}: ${template.category}`);
      console.log(`Template: ${template.template}`);
      console.log("-".repeat(40));
      
      try {
        const result = await this.sendSMS(template.message, template.category);
        results.push({
          category: template.category,
          template: template.template,
          message: template.message,
          success: !result.error,
          result: result
        });
        
        // Wait 2 seconds between messages to avoid rate limiting
        console.log("⏳ Waiting 2 seconds before next template...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        results.push({
          category: template.category,
          template: template.template,
          message: template.message,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Print test summary
   */
  printSummary(results) {
    console.log("\n" + "=" .repeat(60));
    console.log("📊 SMS TEMPLATE TEST SUMMARY");
    console.log("=" .repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      console.log("\n✅ SUCCESSFUL TEMPLATES:");
      successful.forEach((result, index) => {
        console.log(`${index + 1}. ${result.category}`);
        console.log(`   Message: ${result.message}`);
      });
    }
    
    if (failed.length > 0) {
      console.log("\n❌ FAILED TEMPLATES:");
      failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.category}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Error: ${result.error || 'Unknown error'}`);
      });
    }
    
    console.log("\n📝 NOTES:");
    console.log("- Test account limitations may affect results");
    console.log("- Only approved templates should work with test accounts");
    console.log("- For production use, ensure templates are pre-approved");
    console.log("- Rate limiting: 2 second delay between messages");
  }

  /**
   * Run complete test with all approved templates
   */
  async runTest() {
    console.log("🚀 Starting Comprehensive Eskiz SMS Template Test");
    console.log("=" .repeat(60));
    console.log(`📱 Test Phone: ${TEST_PHONE}`);
    console.log(`📋 Templates to test: ${APPROVED_TEMPLATES.length}`);
    console.log("=" .repeat(60));
    
    try {
      // Step 1: Authenticate
      await this.authenticate();
      
      // Step 2: Test all approved templates
      const results = await this.testAllTemplates();
      
      // Step 3: Print summary
      this.printSummary(results);
      
      console.log("\n" + "=" .repeat(60));
      console.log("✅ SMS template testing completed!");
      console.log("📱 Check your phone for the test messages");
      
    } catch (error) {
      console.error("\n❌ SMS template test failed:");
      console.error(error.message);
      process.exit(1);
    }
  }
}

// Run the test
const test = new EskizSMSTest();
test.runTest().catch(console.error);
