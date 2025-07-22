#!/usr/bin/env node

/**
 * Final Click.uz Payment Status Test
 * Comprehensive test for merchant API authentication and payment verification
 * 
 * Usage: node final-click-test.js
 * Configure the test parameters below for different payments
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');

// ===================================================================
// 🔧 CONFIGURATION - Update these for different payments/tests
// ===================================================================

const TEST_CONFIG = {
  // Payment details to test (update for new payments)
  PAYMENT_ID: '4260375618',
  MERCHANT_TRANS_ID: 'REQ-MDEKEZCM-PL1R2',
  PAYMENT_DATE: '2025-07-22', // YYYY-MM-DD format
  
  // Test options
  TEST_MERCHANT_API: true,      // Test merchant API endpoints
  TEST_CHEQUE_SCRAPER: true,    // Test cheque URL scraping
  VERBOSE_LOGGING: false,       // Show detailed request/response logs
  
  // Timeout settings
  REQUEST_TIMEOUT: 10000,       // 10 seconds
};

// ===================================================================
// 🏗️ IMPLEMENTATION
// ===================================================================

class ClickPaymentTester {
  constructor() {
    this.apiUrl = 'https://api.click.uz/v2/merchant';
    this.chequeUrl = 'https://merchant.click.uz/cheque';
    
    // Load credentials from .env
    this.merchantId = process.env.CLICK_MERCHANT_ID;
    this.serviceId = process.env.CLICK_SERVICE_ID;
    this.merchantUserId = process.env.CLICK_MERCHANT_USER_ID;
    this.secretKey = process.env.CLICK_SECRET_KEY;
    
    this.paymentId = TEST_CONFIG.PAYMENT_ID;
    this.merchantTransId = TEST_CONFIG.MERCHANT_TRANS_ID;
    this.paymentDate = TEST_CONFIG.PAYMENT_DATE;
  }

  /**
   * Generate authentication header for Click.uz Merchant API
   */
  generateAuthHeader() {
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = crypto.createHash('sha1')
      .update(timestamp + this.secretKey)
      .digest('hex');
    
    return {
      'Auth': `${this.merchantUserId}:${digest}:${timestamp}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Test 1: Merchant API Authentication & Payment Status
   */
  async testMerchantAPI() {
    if (!TEST_CONFIG.TEST_MERCHANT_API) {
      console.log('⏭️  Skipping Merchant API test (disabled in config)');
      return { skipped: true };
    }

    console.log('\n🔐 Testing Merchant API Authentication & Payment Status');
    console.log('======================================================');
    
    const results = {
      auth: false,
      paymentById: false,
      paymentByMerchantTrans: false,
      paymentData: null
    };

    // Test authentication with a simple request
    try {
      const testUrl = `${this.apiUrl}/payment/status/${this.serviceId}/999999999`;
      const headers = this.generateAuthHeader();
      
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log(`Auth test URL: ${testUrl}`);
        console.log(`Auth header: ${headers.Auth.split(':')[0]}:***:${headers.Auth.split(':')[2]}`);
      }

      const authResponse = await axios.get(testUrl, {
        headers,
        timeout: TEST_CONFIG.REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      if (authResponse.status === 200) {
        console.log('✅ API Authentication: SUCCESS');
        results.auth = true;
        
        if (TEST_CONFIG.VERBOSE_LOGGING) {
          console.log(`   Response: ${JSON.stringify(authResponse.data)}`);
        }
      } else {
        console.log(`❌ API Authentication: FAILED (HTTP ${authResponse.status})`);
        return results;
      }

    } catch (error) {
      console.log(`❌ API Authentication: ERROR (${error.message})`);
      return results;
    }

    // Test payment status by payment ID
    try {
      const paymentUrl = `${this.apiUrl}/payment/status/${this.serviceId}/${this.paymentId}`;
      const headers = this.generateAuthHeader();
      
      console.log(`\n🔍 Testing Payment ID: ${this.paymentId}`);
      
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log(`Payment URL: ${paymentUrl}`);
      }

      const paymentResponse = await axios.get(paymentUrl, {
        headers,
        timeout: TEST_CONFIG.REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      if (paymentResponse.status === 200 && paymentResponse.data.error_code === 0) {
        console.log('✅ Payment Status (by ID): FOUND');
        results.paymentById = true;
        results.paymentData = paymentResponse.data;
        
        console.log(`   Status: ${paymentResponse.data.payment_status === 1 ? 'PAID' : 'NOT PAID'}`);
        console.log(`   Amount: ${paymentResponse.data.amount}`);
        console.log(`   Create Date: ${paymentResponse.data.create_date}`);
        
      } else {
        console.log(`❌ Payment Status (by ID): NOT FOUND`);
        if (TEST_CONFIG.VERBOSE_LOGGING && paymentResponse.data) {
          console.log(`   Error: ${paymentResponse.data.error_code} - ${paymentResponse.data.error_note}`);
        }
      }

    } catch (error) {
      console.log(`❌ Payment Status (by ID): ERROR (${error.message})`);
    }

    // Test payment status by merchant transaction ID
    try {
      const transUrl = `${this.apiUrl}/payment/status_by_mti/${this.serviceId}/${this.merchantTransId}/${this.paymentDate}`;
      const headers = this.generateAuthHeader();
      
      console.log(`\n🔍 Testing Merchant Trans ID: ${this.merchantTransId}`);
      
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log(`Transaction URL: ${transUrl}`);
      }

      const transResponse = await axios.get(transUrl, {
        headers,
        timeout: TEST_CONFIG.REQUEST_TIMEOUT,
        validateStatus: () => true
      });

      if (transResponse.status === 200 && transResponse.data.error_code === 0) {
        console.log('✅ Payment Status (by Merchant Trans): FOUND');
        results.paymentByMerchantTrans = true;
        
        if (!results.paymentData) {
          results.paymentData = transResponse.data;
        }
        
        console.log(`   Status: ${transResponse.data.payment_status === 1 ? 'PAID' : 'NOT PAID'}`);
        console.log(`   Payment ID: ${transResponse.data.payment_id}`);
        console.log(`   Amount: ${transResponse.data.amount}`);
        
      } else {
        console.log(`❌ Payment Status (by Merchant Trans): NOT FOUND`);
        if (TEST_CONFIG.VERBOSE_LOGGING && transResponse.data) {
          console.log(`   Error: ${transResponse.data.error_code} - ${transResponse.data.error_note}`);
        }
      }

    } catch (error) {
      console.log(`❌ Payment Status (by Merchant Trans): ERROR (${error.message})`);
    }

    return results;
  }

  /**
   * Test 2: Cheque URL Scraper
   */
  async testChequeScraper() {
    if (!TEST_CONFIG.TEST_CHEQUE_SCRAPER) {
      console.log('⏭️  Skipping Cheque Scraper test (disabled in config)');
      return { skipped: true };
    }

    console.log('\n🧾 Testing Cheque URL Scraper');
    console.log('==============================');
    
    const chequeUrl = `${this.chequeUrl}/${this.paymentId}`;
    console.log(`Cheque URL: ${chequeUrl}`);
    
    try {
      const response = await axios.get(chequeUrl, {
        timeout: TEST_CONFIG.REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        validateStatus: () => true
      });

      if (response.status !== 200) {
        console.log(`❌ Cheque Scraper: HTTP ${response.status}`);
        return { success: false, error: `HTTP ${response.status}` };
      }

      console.log('✅ Cheque Page: ACCESSIBLE');
      
      // Parse HTML content
      const $ = cheerio.load(response.data);
      
      // Extract payment information (adjust selectors based on actual HTML structure)
      const chequeData = {
        paymentId: this.paymentId,
        status: null,
        amount: null,
        date: null,
        merchantTransId: null,
        cardType: null,
        details: {}
      };

      // Try to extract common payment fields
      // Note: You'll need to inspect the actual HTML to get correct selectors
      const possibleSelectors = {
        amount: ['.amount', '.sum', '.total', '[data-amount]', '.payment-amount'],
        status: ['.status', '.payment-status', '[data-status]'],
        date: ['.date', '.payment-date', '[data-date]'],
        merchantTransId: ['.merchant-trans-id', '.order-id', '[data-order]'],
        cardType: ['.card-type', '.payment-method', '[data-card-type]']
      };

      Object.entries(possibleSelectors).forEach(([field, selectors]) => {
        for (const selector of selectors) {
          const element = $(selector);
          if (element.length > 0) {
            const text = element.text().trim();
            if (text) {
              chequeData[field] = text;
              break;
            }
          }
        }
      });

      // Extract all text content for analysis
      const pageText = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Look for specific patterns in the text
      const patterns = {
        amount: /(\d+[.,]\d+)\s*(сум|sum|UZS)/i,
        status: /(успешн|successful|paid|оплачен)/i,
        date: /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/,
        time: /(\d{1,2}:\d{2})/,
        paymentId: new RegExp(this.paymentId),
        merchantTransId: new RegExp(this.merchantTransId.replace(/[-]/g, '\\-'))
      };

      Object.entries(patterns).forEach(([field, pattern]) => {
        const match = pageText.match(pattern);
        if (match) {
          chequeData.details[field] = match[1] || match[0];
        }
      });

      console.log('\n📊 Extracted Cheque Data:');
      console.log('=========================');
      
      if (chequeData.details.paymentId) {
        console.log(`✅ Payment ID Found: ${chequeData.details.paymentId}`);
      }
      
      if (chequeData.details.merchantTransId) {
        console.log(`✅ Merchant Trans ID Found: ${chequeData.details.merchantTransId}`);
      }
      
      if (chequeData.details.amount) {
        console.log(`✅ Amount Found: ${chequeData.details.amount}`);
      }
      
      if (chequeData.details.status) {
        console.log(`✅ Status Found: ${chequeData.details.status}`);
      }
      
      if (chequeData.details.date || chequeData.details.time) {
        const dateTime = [chequeData.details.date, chequeData.details.time].filter(Boolean).join(' ');
        console.log(`✅ Date/Time Found: ${dateTime}`);
      }

      // Check if page contains expected payment information
      const hasPaymentId = pageText.includes(this.paymentId);
      const hasMerchantTransId = pageText.includes(this.merchantTransId);
      const hasSuccessIndicator = /успешн|successful|paid|оплачен/i.test(pageText);
      
      console.log(`\n🔍 Content Analysis:`);
      console.log(`   Contains Payment ID: ${hasPaymentId ? '✅' : '❌'}`);
      console.log(`   Contains Merchant Trans ID: ${hasMerchantTransId ? '✅' : '❌'}`);
      console.log(`   Contains Success Indicator: ${hasSuccessIndicator ? '✅' : '❌'}`);
      
      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log('\n📄 Raw Page Text (first 500 chars):');
        console.log(pageText.substring(0, 500) + '...');
      }

      return {
        success: true,
        accessible: true,
        data: chequeData,
        hasPaymentId,
        hasMerchantTransId,
        hasSuccessIndicator,
        rawTextLength: pageText.length
      };

    } catch (error) {
      console.log(`❌ Cheque Scraper: ERROR (${error.message})`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run all tests and generate summary
   */
  async runAllTests() {
    console.log('🚀 Click.uz Payment Status Final Test');
    console.log('=====================================');
    console.log(`Payment ID: ${this.paymentId}`);
    console.log(`Merchant Trans ID: ${this.merchantTransId}`);
    console.log(`Payment Date: ${this.paymentDate}`);
    console.log(`Service ID: ${this.serviceId}`);
    console.log(`Merchant ID: ${this.merchantId}`);
    console.log('=====================================');

    const startTime = Date.now();
    
    // Run tests
    const apiResults = await this.testMerchantAPI();
    const chequeResults = await this.testChequeScraper();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Generate summary
    console.log('\n📋 FINAL SUMMARY');
    console.log('================');
    console.log(`Test Duration: ${duration}s`);
    console.log('');

    // API Summary
    if (apiResults.skipped) {
      console.log('🔐 Merchant API: SKIPPED');
    } else {
      console.log('🔐 Merchant API Results:');
      console.log(`   Authentication: ${apiResults.auth ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   Payment by ID: ${apiResults.paymentById ? '✅ FOUND' : '❌ NOT FOUND'}`);
      console.log(`   Payment by Trans ID: ${apiResults.paymentByMerchantTrans ? '✅ FOUND' : '❌ NOT FOUND'}`);
      
      if (apiResults.paymentData) {
        console.log('   💰 Payment Data Available: ✅');
      }
    }

    // Cheque Summary
    if (chequeResults.skipped) {
      console.log('\n🧾 Cheque Scraper: SKIPPED');
    } else {
      console.log('\n🧾 Cheque Scraper Results:');
      console.log(`   Page Accessible: ${chequeResults.accessible ? '✅ YES' : '❌ NO'}`);
      
      if (chequeResults.success) {
        console.log(`   Payment ID Found: ${chequeResults.hasPaymentId ? '✅ YES' : '❌ NO'}`);
        console.log(`   Transaction ID Found: ${chequeResults.hasMerchantTransId ? '✅ YES' : '❌ NO'}`);
        console.log(`   Success Indicator: ${chequeResults.hasSuccessIndicator ? '✅ YES' : '❌ NO'}`);
      }
    }

    // Overall assessment
    const apiSuccess = !apiResults.skipped && (apiResults.paymentById || apiResults.paymentByMerchantTrans);
    const chequeSuccess = !chequeResults.skipped && chequeResults.success && chequeResults.hasPaymentId;
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    if (apiSuccess) {
      console.log('✅ Merchant API: Payment data is accessible via API');
    } else if (!apiResults.skipped) {
      console.log('❌ Merchant API: Payment data is NOT accessible via API');
    }
    
    if (chequeSuccess) {
      console.log('✅ Cheque Scraper: Payment data is accessible via cheque URL');
    } else if (!chequeResults.skipped) {
      console.log('❌ Cheque Scraper: Payment data is NOT accessible via cheque URL');
    }

    if (!apiSuccess && !chequeSuccess) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('   1. Verify payment ID and merchant transaction ID are correct');
      console.log('   2. Check Click.uz account API permissions');
      console.log('   3. Contact Click.uz support for API access verification');
      console.log('   4. Use webhook-based payment confirmation as primary method');
    }

    return {
      api: apiResults,
      cheque: chequeResults,
      overallSuccess: apiSuccess || chequeSuccess,
      duration
    };
  }
}

// ===================================================================
// 🚀 EXECUTION
// ===================================================================

if (require.main === module) {
  // Install cheerio if not available
  try {
    require('cheerio');
  } catch (error) {
    console.log('📦 Installing cheerio for HTML parsing...');
    require('child_process').execSync('npm install cheerio', { stdio: 'inherit' });
    console.log('✅ Cheerio installed successfully\n');
  }

  const tester = new ClickPaymentTester();
  
  tester.runAllTests()
    .then(results => {
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = ClickPaymentTester;
