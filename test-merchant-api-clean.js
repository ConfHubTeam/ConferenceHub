#!/usr/bin/env node

/**
 * Clean Click.uz Merchant API Test
 * Complete workflow: Authentication → Create Invoice → Get Invoice Status
 * 
 * Usage: node test-merchant-api-clean.js
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

class ClickMerchantAPI {
  constructor() {
    this.apiUrl = 'https://api.click.uz/v2/merchant';
    this.serviceId = process.env.CLICK_SERVICE_ID;
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
    this.secretKey = process.env.CLICK_SECRET_KEY;
    
    console.log('🔧 Configuration:');
    console.log(`   Service ID: ${this.serviceId}`);
    console.log(`   Merchant User ID: ${this.merchantUserId}`);
    console.log(`   Secret Key: ${this.secretKey?.substring(0, 4)}***`);
    console.log('');
  }

  /**
   * Generate authentication header
   */
  generateAuth() {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureString = timestamp + this.secretKey;
    const digest = crypto.createHash('sha1').update(signatureString).digest('hex');
    
    return {
      'Auth': `${this.merchantUserId}:${digest}:${timestamp}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Step 1: Test Authentication
   */
  async testAuth() {
    console.log('🔐 Step 1: Testing Authentication');
    console.log('=================================');
    
    try {
      const headers = this.generateAuth();
      console.log(`   Auth Header: ${headers.Auth.split(':')[0]}:***:${headers.Auth.split(':')[2]}`);
      
      // Use a dummy payment ID to test auth
      const url = `${this.apiUrl}/payment/status/${this.serviceId}/999999999`;
      
      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Data:`, response.data);
      
      if (response.status === 200) {
        if (response.data.error_code === -15) {
          console.log('   ❌ Authentication FAILED: Invalid signature');
          return false;
        } else {
          console.log('   ✅ Authentication SUCCESS');
          return true;
        }
      } else {
        console.log('   ❌ Authentication FAILED: HTTP error');
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Authentication ERROR: ${error.message}`);
      return false;
    }
  }

  /**
   * Step 2: Create Invoice
   */
  async createInvoice() {
    console.log('\n📄 Step 2: Creating Invoice');
    console.log('===========================');
    
    try {
      const headers = this.generateAuth();
      const url = `${this.apiUrl}/invoice/create`;
      
      const invoiceData = {
        service_id: parseInt(this.serviceId),
        amount: 1000.00,
        phone_number: '998901234567',
        merchant_trans_id: `TEST-CLEAN-${Date.now()}`
      };
      
      console.log(`   Creating invoice:`, invoiceData);
      
      const response = await axios.post(url, invoiceData, {
        headers,
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Data:`, response.data);
      
      if (response.status === 200 && response.data.error_code === 0) {
        console.log(`   ✅ Invoice Creation SUCCESS`);
        console.log(`   📄 Invoice ID: ${response.data.invoice_id}`);
        return {
          success: true,
          invoiceId: response.data.invoice_id,
          merchantTransId: invoiceData.merchant_trans_id
        };
      } else {
        console.log(`   ❌ Invoice Creation FAILED`);
        console.log(`   📝 Error: ${response.data?.error_code} - ${response.data?.error_note}`);
        return { success: false, error: response.data };
      }
      
    } catch (error) {
      console.log(`   ❌ Invoice Creation ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Step 3: Get Invoice Status
   */
  async getInvoiceStatus(invoiceId) {
    console.log('\n📊 Step 3: Getting Invoice Status');
    console.log('=================================');
    
    try {
      const headers = this.generateAuth();
      const url = `${this.apiUrl}/invoice/status/${this.serviceId}/${invoiceId}`;
      
      console.log(`   Checking status for Invoice ID: ${invoiceId}`);
      
      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Data:`, response.data);
      
      if (response.status === 200 && response.data.error_code === 0) {
        console.log(`   ✅ Invoice Status SUCCESS`);
        console.log(`   📋 Status: ${response.data.invoice_status}`);
        console.log(`   📝 Note: ${response.data.invoice_status_note}`);
        return { success: true, data: response.data };
      } else {
        console.log(`   ❌ Invoice Status FAILED`);
        console.log(`   📝 Error: ${response.data?.error_code} - ${response.data?.error_note}`);
        return { success: false, error: response.data };
      }
      
    } catch (error) {
      console.log(`   ❌ Invoice Status ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Step 4: Test Existing Transaction Retrieval
   */
  async testExistingTransactions() {
    console.log('\n🔍 Step 4: Testing Existing Transaction Retrieval');
    console.log('================================================');
    
    // Known transactions from your dashboard
    const existingTransactions = [
      { paymentId: '171010156', merchantTransId: '076292', date: '2025-07-30', status: 'New (Not Paid)' },
      { paymentId: '170984211', merchantTransId: 'REQ-MDHC89N5-IPIXM', date: '2025-07-29', status: 'Cancelled' },
      { paymentId: '170879649', merchantTransId: 'REQ-MDCV1IB2-WE12B', date: '2025-07-24', status: 'New (Not Paid)' },
      { paymentId: '170879555', merchantTransId: 'REQ-MDCV1IB2-WE12B', date: '2025-07-24', status: 'Deleted by Payer' }
    ];
    
    const results = [];
    
    for (const transaction of existingTransactions) {
      console.log(`\n🔍 Testing Transaction: ${transaction.merchantTransId} (${transaction.status})`);
      console.log('-'.repeat(60));
      
      // Test 1: Check by Payment ID
      try {
        const headers = this.generateAuth();
        const paymentUrl = `${this.apiUrl}/payment/status/${this.serviceId}/${transaction.paymentId}`;
        
        console.log(`   Checking by Payment ID: ${transaction.paymentId}`);
        
        const paymentResponse = await axios.get(paymentUrl, {
          headers,
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (paymentResponse.status === 200 && paymentResponse.data.error_code === 0) {
          console.log(`   ✅ Found by Payment ID: ${JSON.stringify(paymentResponse.data)}`);
          results.push({ type: 'payment_id', transaction, success: true, data: paymentResponse.data });
        } else {
          console.log(`   ❌ Not found by Payment ID: ${paymentResponse.data.error_code} - ${paymentResponse.data.error_note}`);
          results.push({ type: 'payment_id', transaction, success: false, error: paymentResponse.data });
        }
      } catch (error) {
        console.log(`   💥 Error checking Payment ID: ${error.message}`);
        results.push({ type: 'payment_id', transaction, success: false, error: error.message });
      }
      
      // Test 2: Check by Merchant Transaction ID
      try {
        const headers = this.generateAuth();
        const merchantUrl = `${this.apiUrl}/payment/status_by_mti/${this.serviceId}/${transaction.merchantTransId}/${transaction.date}`;
        
        console.log(`   Checking by Merchant Trans ID: ${transaction.merchantTransId} on ${transaction.date}`);
        
        const merchantResponse = await axios.get(merchantUrl, {
          headers,
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (merchantResponse.status === 200 && merchantResponse.data.error_code === 0) {
          console.log(`   ✅ Found by Merchant Trans ID: ${JSON.stringify(merchantResponse.data)}`);
          results.push({ type: 'merchant_trans_id', transaction, success: true, data: merchantResponse.data });
        } else {
          console.log(`   ❌ Not found by Merchant Trans ID: ${merchantResponse.data.error_code} - ${merchantResponse.data.error_note}`);
          results.push({ type: 'merchant_trans_id', transaction, success: false, error: merchantResponse.data });
        }
      } catch (error) {
        console.log(`   💥 Error checking Merchant Trans ID: ${error.message}`);
        results.push({ type: 'merchant_trans_id', transaction, success: false, error: error.message });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Run complete test workflow
   */
  async runCompleteTest() {
    console.log('🚀 Click.uz Merchant API - Complete Test');
    console.log('=========================================\n');
    
    // Step 1: Test Authentication
    const authResult = await this.testAuth();
    if (!authResult) {
      console.log('\n❌ WORKFLOW STOPPED: Authentication failed');
      console.log('💡 Fix authentication issues before proceeding');
      return false;
    }
    
    // Step 2: Create Invoice
    const invoiceResult = await this.createInvoice();
    if (!invoiceResult.success) {
      console.log('\n❌ WORKFLOW STOPPED: Invoice creation failed');
      console.log('💡 Check account permissions for invoice creation');
      return false;
    }
    
    // Wait a moment for invoice processing
    console.log('\n⏱️  Waiting 2 seconds for invoice processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Get Invoice Status
    const statusResult = await this.getInvoiceStatus(invoiceResult.invoiceId);
    
    // Step 4: Test Existing Transaction Retrieval
    const existingTransResults = await this.testExistingTransactions();
    
    // Final Summary
    console.log('\n📋 FINAL RESULTS');
    console.log('================');
    console.log(`🔐 Authentication: ${authResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📄 Invoice Creation: ${invoiceResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📊 Invoice Status: ${statusResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Existing Transactions Summary
    const foundTransactions = existingTransResults.filter(r => r.success);
    console.log(`🔍 Existing Transactions Found: ${foundTransactions.length}/${existingTransResults.length}`);
    
    if (foundTransactions.length > 0) {
      console.log('\n✅ Found Existing Transactions:');
      foundTransactions.forEach(result => {
        console.log(`   ${result.type}: ${result.transaction.merchantTransId} (${result.transaction.status})`);
      });
    } else {
      console.log('\n❌ No existing transactions found via API');
      console.log('💡 This is normal for unpaid/cancelled transactions');
    }
    
    if (authResult && invoiceResult.success && statusResult.success) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Your Click.uz Merchant API integration is working correctly');
      console.log('\n📄 Invoice Details:');
      console.log(`   Invoice ID: ${invoiceResult.invoiceId}`);
      console.log(`   Merchant Trans ID: ${invoiceResult.merchantTransId}`);
      console.log(`   Status: ${statusResult.data.invoice_status}`);
      console.log(`   Status Note: ${statusResult.data.invoice_status_note}`);
      
      console.log('\n💳 Next Steps:');
      console.log('1. Use this invoice ID to test payments');
      console.log('2. Integrate invoice creation into your booking system');
      console.log('3. Set up webhooks for real-time payment notifications');
      
      return true;
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('💡 Check the error messages above and fix issues');
      return false;
    }
  }
}

// Run the test
if (require.main === module) {
  const api = new ClickMerchantAPI();
  
  api.runCompleteTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = ClickMerchantAPI;
