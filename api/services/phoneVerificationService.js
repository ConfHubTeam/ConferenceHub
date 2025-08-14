/**
 * Phone Verification Service
 * 
 * Following SOLID principles:
 * - Single Responsibility: Handles only phone verification logic
 * - Open/Closed: Extensible for new verification features without modifying existing code
 * - Liskov Substitution: Can be replaced with other verification providers implementing same interface
 * - Interface Segregation: Focused verification-specific methods only
 * - Dependency Inversion: Depends on abstractions (SMS service) not concrete implementations
 * 
 * Implements DRY principle by centralizing verification logic and avoiding code duplication
 */

const crypto = require("crypto");
const eskizSMSService = require("./eskizSMSService");
const { translate, changeLanguage } = require("../i18n/config");

class PhoneVerificationService {
  constructor() {
    // Store verification codes in memory with expiration
    // In production, use Redis or similar for distributed systems
    this.verificationCodes = new Map();
    this.codeExpirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Generate a random 6-digit verification code
   * @returns {string} 6-digit verification code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a unique session ID for verification process
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return crypto.randomUUID();
  }

  /**
   * Send verification code to phone number
   * @param {string} phoneNumber - Phone number to verify
   * @param {string} language - User's preferred language (en, ru, uz)
   * @returns {Promise<object>} Verification sending result
   */
  async sendVerificationCode(phoneNumber, language = 'en') {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error(translate('errors.invalidPhoneFormat', { lng: language, ns: 'auth' }));
      }

      // Generate verification code and session ID
      const verificationCode = this.generateVerificationCode();
      const sessionId = this.generateSessionId();

      // Store verification code with expiration
      this.verificationCodes.set(sessionId, {
        phoneNumber: phoneNumber,
        code: verificationCode,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.codeExpirationTime)
      });

      // Get localized SMS message
      const smsMessage = this.generateVerificationSMS(verificationCode, language);

      console.log(`📱 SENDING VERIFICATION CODE - Phone: ${phoneNumber}, Code: ${verificationCode}, Session: ${sessionId}, Language: ${language}`);

      // Send SMS
      const smsResult = await eskizSMSService.sendSMS(phoneNumber, smsMessage);

      if (smsResult.success) {
        console.log(`✅ VERIFICATION CODE SENT - Session: ${sessionId}, RequestID: ${smsResult.requestId}`);
        return {
          success: true,
          sessionId: sessionId,
          message: translate('success.verificationCodeSent', { lng: language, ns: 'auth' }),
          expiresIn: this.codeExpirationTime / 1000, // Return in seconds
          smsRequestId: smsResult.requestId
        };
      } else {
        // Clean up session if SMS failed
        this.verificationCodes.delete(sessionId);
        throw new Error(translate('errors.smsProviderFailed', { lng: language, ns: 'auth' }));
      }
    } catch (error) {
      console.error("Error sending verification code:", error.message);
      return {
        success: false,
        error: error.message,
        sessionId: null
      };
    }
  }

  /**
   * Verify the provided code against stored verification data
   * @param {string} sessionId - Verification session ID
   * @param {string} providedCode - Code provided by user
   * @param {string} language - User's preferred language (en, ru, uz)
   * @returns {object} Verification result
   */
  verifyCode(sessionId, providedCode, language = 'en') {
    try {
      const verificationData = this.verificationCodes.get(sessionId);

      if (!verificationData) {
        return {
          success: false,
          error: translate('errors.invalidOrExpiredSession', { lng: language, ns: 'auth' }),
          code: "INVALID_SESSION"
        };
      }

      // Check if code has expired
      if (new Date() > verificationData.expiresAt) {
        this.verificationCodes.delete(sessionId);
        return {
          success: false,
          error: translate('errors.verificationCodeExpired', { lng: language, ns: 'auth' }),
          code: "EXPIRED_CODE"
        };
      }

      // Verify the code
      if (providedCode === verificationData.code) {
        const phoneNumber = verificationData.phoneNumber;
        
        // Clean up successful verification
        this.verificationCodes.delete(sessionId);
        
        console.log(`✅ VERIFICATION SUCCESSFUL - Phone: ${phoneNumber}, Session: ${sessionId}`);
        
        return {
          success: true,
          phoneNumber: phoneNumber,
          message: translate('success.phoneVerifiedSuccessfully', { lng: language, ns: 'auth' })
        };
      } else {
        console.log(`❌ VERIFICATION FAILED - Session: ${sessionId}, Code mismatch`);
        
        return {
          success: false,
          error: translate('errors.invalidVerificationCode', { lng: language, ns: 'auth' }),
          code: "INVALID_CODE"
        };
      }
    } catch (error) {
      console.error("Error verifying code:", error.message);
      return {
        success: false,
        error: translate('errors.verificationServerError', { lng: language, ns: 'auth' }),
        code: "SERVER_ERROR"
      };
    }
  }

  /**
   * Clean up expired verification codes (should be called periodically)
   */
  cleanupExpiredCodes() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 CLEANUP - Removed ${cleanedCount} expired verification codes`);
    }

    return cleanedCount;
  }

  /**
   * Get verification session info (for debugging/admin purposes)
   * @param {string} sessionId - Session ID to check
   * @returns {object|null} Session info or null if not found
   */
  getSessionInfo(sessionId) {
    const data = this.verificationCodes.get(sessionId);
    if (!data) return null;

    return {
      phoneNumber: data.phoneNumber,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      isExpired: new Date() > data.expiresAt
    };
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }

    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Check if it's a valid length (8-15 digits as per international standards)
    // Must start with country code
    return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }

  /**
   * Generate localized verification SMS message
   * @param {string} code - Verification code
   * @param {string} language - Language code (en, ru, uz)
   * @returns {string} Localized SMS message
   */
  generateVerificationSMS(code, language = 'en') {
    try {
      // Get the localized message template and interpolate the code
      const messageTemplate = translate('verification.phoneVerification', { 
        lng: language, 
        ns: 'sms',
        code: code 
      });
      return messageTemplate;
    } catch (error) {
      console.error("Error generating SMS message:", error);
      // Fallback to English message
      return `Your verification code is ${code}. Valid for 5 minutes.`;
    }
  }

  /**
   * Get active verification sessions count (for monitoring)
   * @returns {number} Number of active sessions
   */
  getActiveSessionsCount() {
    // Clean up expired codes first
    this.cleanupExpiredCodes();
    return this.verificationCodes.size;
  }

  /**
   * Force cleanup a specific session (for admin purposes)
   * @param {string} sessionId - Session to remove
   * @returns {boolean} True if session was found and removed
   */
  forceCleanupSession(sessionId) {
    return this.verificationCodes.delete(sessionId);
  }
}

// Export singleton instance following DRY principle
module.exports = new PhoneVerificationService();

// Set up periodic cleanup (every 10 minutes)
setInterval(() => {
  module.exports.cleanupExpiredCodes();
}, 10 * 60 * 1000);
