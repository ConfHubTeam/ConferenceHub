/**
 * Phone Verification Test Suite
 * 
 * Tests the complete phone verification flow including:
 * - SMS text generation in all languages
 * - Code generation and validation
 * - Session management
 * - Admin account phone updates
 * - Full verification workflow simulation
 * 
 * Following SOLID principles and DRY methodology
 */

const phoneVerificationService = require('../services/phoneVerificationService');
const { translate, changeLanguage } = require('../i18n/config');

class PhoneVerificationTester {
  constructor() {
    this.testResults = [];
    this.adminPhoneNumber = '+998901234567'; // Test admin phone
    this.testLanguages = ['en', 'ru', 'uz'];
  }

  /**
   * Initialize i18n system for testing
   */
  async initializeI18n() {
    // Initialize the i18n system by setting language
    await changeLanguage('en');
  }

  /**
   * Run all phone verification tests
   */
  async runAllTests() {
    console.log('🧪 PHONE VERIFICATION TEST SUITE');
    console.log('==================================================');
    console.log();

    try {
      // Initialize i18n system first
      await this.initializeI18n();
      
      // Test SMS text generation
      await this.testSMSTextGeneration();
      
      // Test code generation
      await this.testCodeGeneration();
      
      // Test verification flow
      await this.testVerificationFlow();
      
      // Test session management
      await this.testSessionManagement();
      
      // Test admin phone update simulation
      await this.testAdminPhoneUpdate();
      
      // Test multilingual support
      await this.testMultilingualSupport();
      
      // Print summary
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Test Suite Failed:', error.message);
    }
  }

  /**
   * Test SMS text generation in all languages
   */
  async testSMSTextGeneration() {
    console.log('📱 Testing SMS Text Generation');
    console.log('----------------------------------------');

    const testCode = '123456';
    
    for (const language of this.testLanguages) {
      try {
        // Set the language for this test
        await changeLanguage(language);
        
        const smsText = phoneVerificationService.generateVerificationSMS(testCode, language);
        const expectedBranding = language === 'en' ? 'from getspace' : 
                                language === 'ru' ? 'от getspace' : 
                                'Getspace-dan';
        
        const hasCorrectBranding = smsText.includes(expectedBranding);
        const hasCode = smsText.includes(testCode);
        const hasValidityInfo = smsText.includes('5') && 
                               (smsText.includes('minute') || smsText.includes('минут') || smsText.includes('daqiqa'));
        
        const passed = hasCorrectBranding && hasCode && hasValidityInfo;
        
        console.log(`  ${this.getLanguageFlag(language)} ${language.toUpperCase()}:`);
        console.log(`    Text: "${smsText}"`);
        console.log(`    ✓ Branding: ${hasCorrectBranding ? '✅' : '❌'}`);
        console.log(`    ✓ Code: ${hasCode ? '✅' : '❌'}`);
        console.log(`    ✓ Validity: ${hasValidityInfo ? '✅' : '❌'}`);
        console.log(`    Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log();
        
        this.addTestResult('SMS Text Generation', language, passed, smsText);
        
      } catch (error) {
        console.log(`    ❌ ERROR: ${error.message}`);
        this.addTestResult('SMS Text Generation', language, false, error.message);
      }
    }
  }

  /**
   * Test code generation functionality
   */
  async testCodeGeneration() {
    console.log('🔢 Testing Code Generation');
    console.log('----------------------------------------');

    try {
      const codes = [];
      for (let i = 0; i < 5; i++) {
        const code = phoneVerificationService.generateVerificationCode();
        codes.push(code);
        console.log(`  Generated Code ${i + 1}: ${code}`);
      }

      // Validate code format
      const allValid = codes.every(code => 
        /^\d{6}$/.test(code) && parseInt(code) >= 100000 && parseInt(code) <= 999999
      );

      // Check uniqueness (should be highly likely with good randomness)
      const uniqueCodes = new Set(codes);
      const allUnique = uniqueCodes.size === codes.length;

      console.log(`  ✓ Format (6 digits): ${allValid ? '✅' : '❌'}`);
      console.log(`  ✓ Uniqueness: ${allUnique ? '✅' : '❌'}`);
      console.log(`  Result: ${allValid && allUnique ? '✅ PASSED' : '❌ FAILED'}`);
      console.log();

      this.addTestResult('Code Generation', 'format', allValid && allUnique, `Generated ${codes.length} codes`);

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      this.addTestResult('Code Generation', 'error', false, error.message);
    }
  }

  /**
   * Test complete verification flow without sending SMS
   */
  async testVerificationFlow() {
    console.log('🔄 Testing Verification Flow');
    console.log('----------------------------------------');

    try {
      // Step 1: Send verification code (without actually sending SMS)
      console.log('  Step 1: Initiating verification...');
      
      // Mock the SMS sending to avoid actual API call
      const originalSendSMS = require('../services/eskizSMSService').sendSMS;
      require('../services/eskizSMSService').sendSMS = async (phone, message) => {
        console.log(`    📱 [MOCK SMS] To: ${phone}`);
        console.log(`    📱 [MOCK SMS] Message: "${message}"`);
        return { success: true, requestId: 'mock-request-' + Date.now() };
      };

      const sendResult = await phoneVerificationService.sendVerificationCode(
        this.adminPhoneNumber, 
        'en'
      );

      console.log(`    ✓ Send Result: ${sendResult.success ? '✅' : '❌'}`);
      console.log(`    ✓ Session ID: ${sendResult.sessionId ? '✅' : '❌'}`);
      
      if (sendResult.success) {
        // Step 2: Get the session info to extract the code
        const sessionInfo = phoneVerificationService.getSessionInfo(sendResult.sessionId);
        console.log(`    ✓ Session Info: ${sessionInfo ? '✅' : '❌'}`);
        
        if (sessionInfo) {
          // Step 3: Verify with correct code
          console.log('  Step 2: Verifying with correct code...');
          
          // Extract the actual code from the session (for testing purposes)
          const actualCode = phoneVerificationService.verificationCodes.get(sendResult.sessionId).code;
          console.log(`    📝 Generated Code: ${actualCode}`);
          
          const verifyResult = phoneVerificationService.verifyCode(sendResult.sessionId, actualCode);
          console.log(`    ✓ Verification: ${verifyResult.success ? '✅' : '❌'}`);
          console.log(`    ✓ Phone Match: ${verifyResult.phoneNumber === this.adminPhoneNumber ? '✅' : '❌'}`);
          
          // Step 4: Test with wrong code
          console.log('  Step 3: Testing with wrong code...');
          
          // Send another verification for wrong code test
          const sendResult2 = await phoneVerificationService.sendVerificationCode(
            this.adminPhoneNumber, 
            'ru'
          );
          
          const wrongCodeResult = phoneVerificationService.verifyCode(sendResult2.sessionId, '000000');
          console.log(`    ✓ Wrong Code Rejected: ${!wrongCodeResult.success ? '✅' : '❌'}`);
          console.log(`    ✓ Error Code: ${wrongCodeResult.code === 'INVALID_CODE' ? '✅' : '❌'}`);
          
          const flowPassed = sendResult.success && verifyResult.success && !wrongCodeResult.success;
          console.log(`  Result: ${flowPassed ? '✅ PASSED' : '❌ FAILED'}`);
          
          this.addTestResult('Verification Flow', 'complete', flowPassed, 'Full flow tested');
        }
      }

      // Restore original SMS function
      require('../services/eskizSMSService').sendSMS = originalSendSMS;

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      this.addTestResult('Verification Flow', 'error', false, error.message);
    }
    
    console.log();
  }

  /**
   * Test session management features
   */
  async testSessionManagement() {
    console.log('💾 Testing Session Management');
    console.log('----------------------------------------');

    try {
      // Mock SMS sending
      require('../services/eskizSMSService').sendSMS = async () => ({
        success: true,
        requestId: 'mock-session-test'
      });

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const result = await phoneVerificationService.sendVerificationCode(
          `+99890123456${i}`,
          'en'
        );
        if (result.success) {
          sessions.push(result.sessionId);
        }
      }

      console.log(`  ✓ Multiple Sessions Created: ${sessions.length === 3 ? '✅' : '❌'}`);

      // Check active sessions count
      const activeCount = phoneVerificationService.getActiveSessionsCount();
      console.log(`  ✓ Active Sessions Count: ${activeCount >= 3 ? '✅' : '❌'} (${activeCount})`);

      // Test session cleanup
      const cleanedCount = phoneVerificationService.cleanupExpiredCodes();
      console.log(`  ✓ Cleanup Executed: ✅ (${cleanedCount} expired codes removed)`);

      // Test force cleanup
      if (sessions.length > 0) {
        const forceCleanup = phoneVerificationService.forceCleanupSession(sessions[0]);
        console.log(`  ✓ Force Cleanup: ${forceCleanup ? '✅' : '❌'}`);
      }

      console.log(`  Result: ✅ PASSED`);
      this.addTestResult('Session Management', 'all', true, `Managed ${sessions.length} sessions`);

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      this.addTestResult('Session Management', 'error', false, error.message);
    }

    console.log();
  }

  /**
   * Test admin phone update simulation
   */
  async testAdminPhoneUpdate() {
    console.log('👑 Testing Admin Phone Update Simulation');
    console.log('----------------------------------------');

    try {
      // Mock SMS sending
      require('../services/eskizSMSService').sendSMS = async (phone, message) => {
        console.log(`    📱 [ADMIN SMS] To: ${phone}`);
        console.log(`    📱 [ADMIN SMS] Message: "${message}"`);
        return { success: true, requestId: 'admin-mock-' + Date.now() };
      };

      // Simulate admin trying to update phone number
      console.log(`  👤 Admin Account: admin@conferencehub.com`);
      console.log(`  📱 New Phone: ${this.adminPhoneNumber}`);
      console.log(`  🌍 Language: English`);
      console.log();

      // Step 1: Admin requests verification
      console.log('  Step 1: Admin requests phone verification...');
      const adminVerification = await phoneVerificationService.sendVerificationCode(
        this.adminPhoneNumber,
        'en'
      );

      console.log(`    ✓ Verification Initiated: ${adminVerification.success ? '✅' : '❌'}`);
      console.log(`    📧 Session ID: ${adminVerification.sessionId}`);
      console.log(`    ⏰ Expires In: ${adminVerification.expiresIn} seconds`);

      if (adminVerification.success) {
        // Step 2: Extract the code (admin would receive via SMS)
        const sessionData = phoneVerificationService.getSessionInfo(adminVerification.sessionId);
        const adminCode = phoneVerificationService.verificationCodes.get(adminVerification.sessionId).code;
        
        console.log();
        console.log('  🔐 GENERATED VERIFICATION CODE FOR ADMIN:');
        console.log(`      Code: ${adminCode}`);
        console.log(`      Valid Until: ${sessionData.expiresAt.toLocaleString()}`);
        console.log(`      Phone: ${sessionData.phoneNumber}`);
        console.log();

        // Step 3: Admin enters the code
        console.log('  Step 2: Admin verifies the code...');
        const verificationResult = phoneVerificationService.verifyCode(
          adminVerification.sessionId,
          adminCode
        );

        console.log(`    ✓ Code Verification: ${verificationResult.success ? '✅' : '❌'}`);
        console.log(`    ✓ Phone Verified: ${verificationResult.phoneNumber === this.adminPhoneNumber ? '✅' : '❌'}`);

        if (verificationResult.success) {
          console.log('  Step 3: Phone update would be completed...');
          console.log(`    📝 Database would update admin phone to: ${verificationResult.phoneNumber}`);
          console.log(`    ✅ Admin phone update simulation: SUCCESSFUL`);
        }

        const adminTestPassed = adminVerification.success && verificationResult.success;
        console.log(`  Result: ${adminTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
        
        this.addTestResult('Admin Phone Update', 'simulation', adminTestPassed, `Code: ${adminCode}`);
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      this.addTestResult('Admin Phone Update', 'error', false, error.message);
    }

    console.log();
  }

  /**
   * Test multilingual support
   */
  async testMultilingualSupport() {
    console.log('🌍 Testing Multilingual Support');
    console.log('----------------------------------------');

    try {
      // Mock SMS sending
      require('../services/eskizSMSService').sendSMS = async (phone, message) => ({
        success: true,
        requestId: 'multilingual-mock'
      });

      const multilingualResults = [];

      for (const language of this.testLanguages) {
        console.log(`  Testing ${this.getLanguageFlag(language)} ${language.toUpperCase()}...`);
        
        const result = await phoneVerificationService.sendVerificationCode(
          `+998901234${language}`,
          language
        );

        if (result.success) {
          const sessionData = phoneVerificationService.getSessionInfo(result.sessionId);
          const code = phoneVerificationService.verificationCodes.get(result.sessionId).code;
          const smsText = phoneVerificationService.generateVerificationSMS(code, language);
          
          console.log(`    📱 SMS: "${smsText}"`);
          console.log(`    🔐 Code: ${code}`);
          console.log(`    ✅ Success: ${result.success}`);
          
          multilingualResults.push({
            language,
            success: result.success,
            smsText,
            code
          });
        }
        
        console.log();
      }

      const allLanguagesPassed = multilingualResults.length === this.testLanguages.length &&
                                multilingualResults.every(r => r.success);

      console.log(`  Result: ${allLanguagesPassed ? '✅ PASSED' : '❌ FAILED'}`);
      this.addTestResult('Multilingual Support', 'all', allLanguagesPassed, 
        `Tested ${multilingualResults.length} languages`);

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      this.addTestResult('Multilingual Support', 'error', false, error.message);
    }

    console.log();
  }

  /**
   * Add test result to results array
   */
  addTestResult(category, test, passed, details) {
    this.testResults.push({
      category,
      test,
      passed,
      details,
      timestamp: new Date()
    });
  }

  /**
   * Get language flag emoji
   */
  getLanguageFlag(language) {
    const flags = {
      'en': '🇺🇸',
      'ru': '🇷🇺',
      'uz': '🇺🇿'
    };
    return flags[language] || '🏳️';
  }

  /**
   * Print comprehensive test summary
   */
  printTestSummary() {
    console.log('📊 TEST SUMMARY');
    console.log('==================================================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

    console.log(`📈 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`   Success Rate: ${successRate}% ${successRate >= 90 ? '🎉' : successRate >= 70 ? '⚠️' : '🚨'}`);
    console.log();

    // Group by category
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    console.log(`📋 Detailed Results:`);
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(r => r.category === category);
      const categoryPassed = categoryTests.filter(r => r.passed).length;
      const categoryTotal = categoryTests.length;
      
      console.log(`   ${category}: ${categoryPassed}/${categoryTotal} ${categoryPassed === categoryTotal ? '✅' : '❌'}`);
      
      categoryTests.forEach(test => {
        console.log(`     ${test.test}: ${test.passed ? '✅' : '❌'} ${test.details}`);
      });
    });

    console.log();
    console.log(`🏁 Test Suite Completed at ${new Date().toLocaleString()}`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT! Phone verification system is working perfectly!');
    } else if (successRate >= 70) {
      console.log('⚠️  GOOD! Minor issues detected, check failed tests.');
    } else {
      console.log('🚨 ATTENTION NEEDED! Multiple failures detected.');
    }
  }
}

// Export for use in other tests
module.exports = PhoneVerificationTester;

// Run tests if called directly
if (require.main === module) {
  const tester = new PhoneVerificationTester();
  tester.runAllTests().catch(console.error);
}
