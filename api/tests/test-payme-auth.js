/**
 * Test script to verify Payme authorization error format
 */

const express = require('express');
const { paymeCheckToken } = require('../middleware/payme');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Test endpoint with Payme auth middleware
app.post('/test-payme-auth', paymeCheckToken, (req, res) => {
  res.json({ success: true, message: 'Authorization passed' });
});

// Start test server
const port = 3001;
const server = app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  
  // Run tests
  runTests();
});

async function runTests() {
  const axios = require('axios');
  const baseUrl = `http://localhost:${port}`;
  
  console.log('\n=== Testing Payme Authorization Error Format ===\n');
  
  // Test 1: No authorization header
  try {
    console.log('Test 1: No authorization header');
    const response = await axios.post(`${baseUrl}/test-payme-auth`, {
      "jsonrpc": "2.0",
      "id": 104660,
      "method": "CheckPerformTransaction",
      "params": {
        "amount": 50000,
        "account": {}
      }
    });
    console.log('❌ Expected error but got success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Status:', error.response.status);
      console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
      
      // Verify the response format
      const data = error.response.data;
      if (data.error && data.error.code === -32504) {
        console.log('✅ Correct error code -32504');
      } else {
        console.log('❌ Wrong error format or code');
      }
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  // Test 2: Invalid authorization header
  try {
    console.log('\nTest 2: Invalid authorization header');
    const response = await axios.post(`${baseUrl}/test-payme-auth`, {
      "jsonrpc": "2.0",
      "id": 104661,
      "method": "CheckPerformTransaction",
      "params": {
        "amount": 50000,
        "account": {}
      }
    }, {
      headers: {
        'Authorization': 'Basic aW52YWxpZF9rZXk='
      }
    });
    console.log('❌ Expected error but got success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('✅ Status:', error.response.status);
      console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
      
      // Verify the response format
      const data = error.response.data;
      if (data.error && data.error.code === -32504) {
        console.log('✅ Correct error code -32504');
      } else {
        console.log('❌ Wrong error format or code');
      }
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
  
  console.log('\n=== Tests Completed ===\n');
  server.close();
}
