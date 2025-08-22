/**
 * Test script to verify Payme invalid amount error format
 */

const express = require('express');
const { paymeCheckToken } = require('./api/middleware/payme');
const paymeController = require('./api/controllers/paymeController');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Test endpoint with Payme middleware and controller
app.post('/test-payme-amount', paymeCheckToken, paymeController.pay);

// Start test server
const port = 3002;
const server = app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  
  // Run tests
  runTests();
});

async function runTests() {
  const axios = require('axios');
  const base64 = require('base-64');
  const baseUrl = `http://localhost:${port}`;
  
  console.log('\n=== Testing Payme Invalid Amount Error Format ===\n');
  
  // Create a basic auth header (you might need to adjust this based on your test key)
  const testKey = process.env.PAYME_TEST_KEY || 'test_key';
  const authData = `Paycom:${testKey}`;
  const authHeader = `Basic ${base64.encode(authData)}`;
  
  // Test 1: Invalid amount (too small)
  try {
    console.log('Test 1: Invalid amount (too small)');
    const response = await axios.post(`${baseUrl}/test-payme-amount`, {
      "jsonrpc": "2.0",
      "id": 104660,
      "method": "CheckPerformTransaction",
      "params": {
        "amount": 1000, // Wrong amount - too small
        "account": {
          "booking_id": "1" // Assuming booking ID 1 exists
        }
      }
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Expected error but got success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Status:', error.response.status);
      console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
      
      // Verify the response format
      const data = error.response.data;
      if (data.error && data.error.code === -31001) {
        console.log('✅ Correct error code -31001 for InvalidAmount');
      } else if (data.error && data.error.code === -31050) {
        console.log('❌ Wrong error code -31050 (should be -31001 for InvalidAmount)');
        console.log('Current error code:', data.error.code);
      } else {
        console.log('❌ Unexpected error format or code:', data.error?.code);
      }
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  // Test 2: Invalid amount (too large)
  try {
    console.log('\nTest 2: Invalid amount (too large)');
    const response = await axios.post(`${baseUrl}/test-payme-amount`, {
      "jsonrpc": "2.0",
      "id": 104661,
      "method": "CheckPerformTransaction",
      "params": {
        "amount": 999999999, // Wrong amount - too large
        "account": {
          "booking_id": "1" // Assuming booking ID 1 exists
        }
      }
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Expected error but got success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Status:', error.response.status);
      console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
      
      // Verify the response format
      const data = error.response.data;
      if (data.error && data.error.code === -31001) {
        console.log('✅ Correct error code -31001 for InvalidAmount');
      } else if (data.error && data.error.code === -31050) {
        console.log('❌ Wrong error code -31050 (should be -31001 for InvalidAmount)');
        console.log('Current error code:', data.error.code);
      } else {
        console.log('❌ Unexpected error format or code:', data.error?.code);
      }
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  console.log('\n=== Tests Completed ===\n');
  server.close();
}
