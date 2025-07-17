#!/usr/bin/env node

/**
 * Debug Eskiz SMS Authentication
 * Test direct authentication with Eskiz API to diagnose issues
 */

require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");

async function testEskizAuth() {
  console.log("🔐 Testing Eskiz SMS Authentication...");
  console.log("📧 Email:", process.env.ESKIZ_EMAIL);
  console.log("🔑 Secret Code:", process.env.ESKIZ_SECRET_CODE ? "[SET]" : "[NOT SET]");
  console.log("🌍 Base URL:", process.env.ESKIZ_BASE_URL);
  
  try {
    const formData = new FormData();
    formData.append("email", process.env.ESKIZ_EMAIL);
    formData.append("password", process.env.ESKIZ_SECRET_CODE);

    console.log("\n📡 Making authentication request...");
    
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${process.env.ESKIZ_BASE_URL}/auth/login`,
      headers: {
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 30000
    };

    const response = await axios(config);
    
    console.log("✅ Authentication Response:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.token) {
      console.log("\n🎉 Authentication SUCCESSFUL!");
      console.log("Token:", response.data.data.token.substring(0, 50) + "...");
      
      // Test token with account info
      console.log("\n📊 Testing token with account info...");
      
      const accountConfig = {
        method: "get",
        url: `${process.env.ESKIZ_BASE_URL}/auth/user`,
        headers: {
          "Authorization": `Bearer ${response.data.data.token}`
        }
      };
      
      const accountResponse = await axios(accountConfig);
      console.log("Account Info:", JSON.stringify(accountResponse.data, null, 2));
      
    } else {
      console.log("❌ Authentication failed - no token in response");
    }
    
  } catch (error) {
    console.error("❌ Authentication Error:");
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error("\n🔐 INVALID CREDENTIALS - Check ESKIZ_EMAIL and ESKIZ_SECRET_CODE");
      } else if (error.response.status === 429) {
        console.error("\n⏰ TOO MANY REQUESTS - Wait and try again");
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error("\n⏰ TIMEOUT - Eskiz API not responding");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("\n🌐 CONNECTION ERROR - Cannot reach Eskiz API");
    } else {
      console.error("\n💥 UNKNOWN ERROR:", error.message);
    }
  }
}

// Run the test
testEskizAuth().catch(console.error);
