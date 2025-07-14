/**
 * Simple SMS Test Script using Eskiz API
 * Tests SMS functionality with actual credentials
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

// Test configuration
const TEST_PHONE = "+998993730907"; // Host's phone number
const TEST_MESSAGE = "This is test from Eskiz";

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
   * Send test SMS
   */
  async sendTestSMS() {
    try {
      console.log("\n📱 Sending test SMS...");
      console.log(`Phone: ${TEST_PHONE}`);
      console.log(`Message: ${TEST_MESSAGE}`);
      console.log(`Sender ID: ${this.from}`);

      // Clean phone number for Uzbekistan format
      const cleanPhone = TEST_PHONE.replace(/\D/g, '');
      console.log(`Cleaned phone: ${cleanPhone}`);

      const formData = new FormData();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', TEST_MESSAGE);
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
      
      console.log("✅ SMS Response:", JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        console.log("🎉 SMS sent successfully!");
        return response.data;
      } else {
        throw new Error("Invalid SMS response");
      }
    } catch (error) {
      console.error("❌ SMS sending failed:");
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
   * Run complete test
   */
  async runTest() {
    console.log("🚀 Starting Eskiz SMS Test");
    console.log("=" .repeat(50));
    
    try {
      // Step 1: Authenticate
      await this.authenticate();
      
      // Step 2: Send test SMS
      await this.sendTestSMS();
      
      console.log("\n" + "=" .repeat(50));
      console.log("✅ SMS test completed successfully!");
      console.log("📱 Check your phone for the test message");
      console.log("\n📝 Note: This is a test account with limitations:");
      console.log("- Only approved test messages work");
      console.log("- Only sender ID '4546' works");
      console.log("- For custom messages, upgrade to paid account");
      
    } catch (error) {
      console.error("\n❌ SMS test failed:");
      console.error(error.message);
      process.exit(1);
    }
  }
}

// Run the test
const test = new EskizSMSTest();
test.runTest().catch(console.error);
