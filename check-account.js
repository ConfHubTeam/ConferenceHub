/**
 * Check Eskiz Account Status and Balance
 */

require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

class EskizAccountChecker {
  constructor() {
    this.baseURL = process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz/api";
    this.email = process.env.ESKIZ_EMAIL;
    this.secretCode = process.env.ESKIZ_SECRET_CODE;
    this.token = null;
  }

  async authenticate() {
    try {
      console.log("🔐 Authenticating...");
      
      const formData = new FormData();
      formData.append('email', this.email);
      formData.append('password', this.secretCode);

      const response = await axios.post(`${this.baseURL}/auth/login`, formData, {
        headers: formData.getHeaders()
      });
      
      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        console.log("✅ Authentication successful!");
        
        // Decode token to check account type
        try {
          const tokenPayload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
          console.log("📋 Token details:", {
            role: tokenPayload.role,
            subject: tokenPayload.sub,
            expires: new Date(tokenPayload.exp * 1000).toLocaleString()
          });
        } catch (error) {
          console.warn("Could not decode token");
        }
        
        return this.token;
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error) {
      console.error("❌ Authentication failed:", error.message);
      throw error;
    }
  }

  async checkBalance() {
    try {
      console.log("\n💰 Checking account balance...");
      
      const response = await axios.get(`${this.baseURL}/user/get-limit`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📊 Balance Response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error("❌ Balance check failed:");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error:", error.message);
      }
    }
  }

  async getUserInfo() {
    try {
      console.log("\n👤 Getting user info...");
      
      const response = await axios.get(`${this.baseURL}/user/get-profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📋 User Info:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error("❌ User info failed:");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error("Error:", error.message);
      }
    }
  }

  async run() {
    console.log("🚀 Checking Eskiz Account Status");
    console.log("=" .repeat(50));
    
    try {
      await this.authenticate();
      await this.checkBalance();
      await this.getUserInfo();
      
      console.log("\n" + "=" .repeat(50));
      console.log("📝 Summary:");
      console.log("- This is a TEST account");
      console.log("- Only approved test messages can be sent");
      console.log("- To send custom messages, upgrade to paid account");
      console.log("- Contact Eskiz support for production access");
      
    } catch (error) {
      console.error("❌ Account check failed:", error.message);
    }
  }
}

const checker = new EskizAccountChecker();
checker.run();
