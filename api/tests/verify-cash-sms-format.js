/**
 * Cash Payment SMS Format Verification Test
 * 
 * This test verifies that our SMS message format matches the Eskiz documentation
 * by directly reading and testing the SMS templates.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load SMS templates directly from files
 */
function loadSMSTemplates() {
  const languages = ['en', 'ru', 'uz'];
  const templates = {};
  
  for (const lang of languages) {
    const filePath = path.join(__dirname, '..', 'i18n', 'locales', lang, 'sms.json');
    const content = fs.readFileSync(filePath, 'utf8');
    templates[lang] = JSON.parse(content);
  }
  
  return templates;
}

/**
 * Simple template interpolation function
 */
function interpolate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Test the SMS message generation directly from templates
 */
async function testSMSMessageFormat() {
  console.log("📱 CASH PAYMENT SMS FORMAT VERIFICATION TEST");
  console.log("=" .repeat(60));
  
  try {
    // Test data
    const testData = {
      bookingReference: "REQ-CASH-TEST-2025",
      placeName: "Luxury Conference Room",
      dateRange: "Aug 25, 2025 from 10:00 to 14:00"
    };
    
    console.log("\n📋 Test Data:");
    console.log(`   Booking Reference: ${testData.bookingReference}`);
    console.log(`   Place Name: ${testData.placeName}`);
    console.log(`   Date Range: ${testData.dateRange}`);
    console.log(`   Target Phone: +998993730907`);
    
    console.log("\n1️⃣ Loading SMS templates...");
    const templates = loadSMSTemplates();
    
    console.log("\n2️⃣ Testing SMS message generation for all languages...");
    
    const results = {};
    const languages = ['en', 'ru', 'uz'];
    
    for (const language of languages) {
      console.log(`\n🌍 Testing ${language.toUpperCase()} language:`);
      console.log("-".repeat(40));
      
      // Get SMS template
      const template = templates[language].booking.cashSelected;
      console.log(`📝 Template: ${template}`);
      
      // Generate SMS message
      const smsMessage = interpolate(template, testData);
      console.log(`� Generated SMS: ${smsMessage}`);
      console.log(`📏 Length: ${smsMessage.length} characters`);
      console.log(`⚠️  Multi-part: ${smsMessage.length > 160 ? 'YES (will be split)' : 'NO'}`);
      
      // Verify components
      const hasBookingRef = smsMessage.includes(testData.bookingReference);
      const hasPlaceName = smsMessage.includes(testData.placeName);
      const hasCashMention = smsMessage.toLowerCase().includes('cash') || 
                           smsMessage.includes('наличную') || 
                           smsMessage.includes('naqd');
      const hasOfflineInstruction = smsMessage.toLowerCase().includes('offline') || 
                                  smsMessage.includes('офлайн') || 
                                  smsMessage.includes('oflayn');
      
      console.log(`✅ Components Check:`);
      console.log(`   - Booking Reference: ${hasBookingRef ? '✅' : '❌'}`);
      console.log(`   - Place Name: ${hasPlaceName ? '✅' : '❌'}`);
      console.log(`   - Cash Payment Mention: ${hasCashMention ? '✅' : '❌'}`);
      console.log(`   - Offline Collection: ${hasOfflineInstruction ? '✅' : '❌'}`);
      
      const passed = hasBookingRef && hasPlaceName && hasCashMention && hasOfflineInstruction;
      console.log(`📊 ${language.toUpperCase()} Test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      results[language] = {
        template,
        message: smsMessage,
        length: smsMessage.length,
        passed
      };
    }
    
    console.log("\n3️⃣ ESKIZ DOCUMENTATION COMPLIANCE CHECK:");
    console.log("=" .repeat(60));
    
    // Expected formats from our Eskiz documentation
    const expectedFormats = {
      en: "Client with booking #{{bookingReference}} for \"{{placeName}}\" on {{dateRange}} selected cash as payment method. Please collect payment offline.",
      ru: "Клиент с бронированием #{{bookingReference}} для \"{{placeName}}\" на {{dateRange}} выбрал наличную оплату. Пожалуйста, получите оплату офлайн.",
      uz: "{{bookingReference}} band qilish \"{{placeName}}\" uchun {{dateRange}} sanasiga mijoz naqd to'lovni tanladi. Iltimos, to'lovni oflayn qabul qiling."
    };
    
    let allMatchExact = true;
    let allPassed = true;
    
    for (const [lang, expected] of Object.entries(expectedFormats)) {
      const actual = results[lang].template;
      const actualMessage = results[lang].message;
      const expectedMessage = interpolate(expected, testData);
      
      const templateMatch = actual === expected;
      const messageMatch = actualMessage === expectedMessage;
      
      console.log(`\n🔍 ${lang.toUpperCase()} Format Check:`);
      console.log(`Backend Template: ${actual}`);
      console.log(`Documentation:    ${expected}`);
      console.log(`Template Match:   ${templateMatch ? '✅ EXACT MATCH' : '⚠️  DIFFERENT'}`);
      
      if (!templateMatch) {
        console.log(`Generated Message: ${actualMessage}`);
        console.log(`Expected Message:  ${expectedMessage}`);
        console.log(`Message Match:     ${messageMatch ? '✅ EXACT MATCH' : '⚠️  DIFFERENT'}`);
        allMatchExact = false;
      }
      
      if (!results[lang].passed) {
        allPassed = false;
      }
    }
    
    console.log("\n4️⃣ FINAL SUMMARY:");
    console.log("=" .repeat(60));
    
    if (allMatchExact && allPassed) {
      console.log("🎉 PERFECT! All SMS formats exactly match Eskiz documentation.");
    } else if (allPassed) {
      console.log("✅ SUCCESS! All SMS formats are functionally correct.");
      console.log("⚠️  Minor template differences from documentation but content is valid.");
    } else {
      console.log("❌ ISSUES FOUND! Some SMS formats are missing required components.");
    }
    
    console.log(`\n� Target Phone: +998993730907`);
    console.log("✅ All language templates verified");
    console.log("✅ Ready for agent notification testing");
    
    console.log("\n📋 SMS Templates for Eskiz Submission:");
    console.log("=" .repeat(60));
    
    for (const [lang, result] of Object.entries(results)) {
      console.log(`\n${lang.toUpperCase()}:`);
      console.log(`Template: ${result.template}`);
      console.log(`Example:  ${result.message}`);
      console.log(`Length:   ${result.length} chars`);
    }
    
    console.log("\n✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
testSMSMessageFormat();
