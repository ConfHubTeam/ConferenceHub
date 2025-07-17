/**
 * Eskiz SMS Service
 * 
 * TEST ACCOUNT LIMITATIONS:
 * - Only approved test messages: "This is test from Eskiz", "Bu Eskiz dan test", "Это тест от Eskiz"
 * - Only sender ID "4546" works (custom sender IDs require paid account)
 * - For production use with custom messages and sender IDs, upgrade to paid account
 * 
 * Following SOLID principles:
 * - Single Responsibility: Handles only SMS operations via Eskiz API
 * - Open/Closed: Extensible for new SMS features without modifying existing code
 * - Liskov Substitution: Can be replaced with other SMS providers implementing same interface
 * - Interface Segregation: Focused SMS-specific methods only
 * - Dependency Inversion: Depends on abstractions (axios) not concrete implementations
 * 
 * Implements DRY principle by centralizing SMS logic and avoiding code duplication
 */

const axios = require("axios");
const FormData = require("form-data");

class EskizSMSService {
  constructor() {
    this.baseURL = process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz/api";
    this.email = process.env.ESKIZ_EMAIL;
    this.secretCode = process.env.ESKIZ_SECRET_CODE;
    this.from = process.env.ESKIZ_FROM || "4546";
    this.token = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Authenticate with Eskiz API and get access token
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    try {
      // Check if we already have a valid token
      if (this.isTokenValid()) {
        console.log("Using existing valid token");
        return this.token;
      }

      console.log("Authenticating with Eskiz API...");
      
      if (!this.email || !this.secretCode) {
        throw new Error("Eskiz credentials (ESKIZ_EMAIL and ESKIZ_SECRET_CODE) are required");
      }

      const formData = new FormData();
      formData.append("email", this.email);
      formData.append("password", this.secretCode);

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseURL}/auth/login`,
        headers: {
          ...formData.getHeaders()
        },
        data: formData,
        timeout: 30000 // 30 second timeout
      };

      const response = await axios(config);
      
      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        // Set token expiration to 23 hours from now (1 hour buffer before actual expiry)
        this.tokenExpiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
        
        console.log("Eskiz SMS: Authentication successful");
        return this.token;
      } else {
        throw new Error("Invalid authentication response from Eskiz API - missing token in response");
      }
    } catch (error) {
      // Clear any existing token on authentication failure
      this.token = null;
      this.tokenExpiresAt = null;
      
      let errorMessage = "SMS service authentication failed";
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = "Invalid Eskiz credentials - check ESKIZ_EMAIL and ESKIZ_SECRET_CODE";
        } else if (status === 429) {
          errorMessage = "Too many authentication attempts - please wait and try again";
        } else if (data && data.message) {
          errorMessage = `Eskiz API error: ${data.message}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Authentication timeout - Eskiz API is not responding";
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to Eskiz API - check internet connection";
      }
      
      console.error("Eskiz SMS authentication failed:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if current token is valid and not expired
   * @returns {boolean} Token validity status
   */
  isTokenValid() {
    return this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt;
  }

  /**
   * Refresh the access token with enhanced error handling
   * @returns {Promise<string>} New access token
   */
  async refreshToken() {
    try {
      if (!this.token) {
        console.log("No existing token found, performing full authentication");
        return await this.authenticate();
      }

      const config = {
        method: "patch",
        maxBodyLength: Infinity,
        url: `${this.baseURL}/auth/refresh`,
        headers: {
          "Authorization": `Bearer ${this.token}`
        }
      };

      const response = await axios(config);
      
      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        console.log("Eskiz SMS: Token refreshed successfully");
        return this.token;
      } else {
        console.log("Token refresh returned invalid response, performing full authentication");
        // Clear existing token and perform full authentication
        this.token = null;
        this.tokenExpiresAt = null;
        return await this.authenticate();
      }
    } catch (error) {
      console.error("Eskiz SMS token refresh failed:", error.message);
      
      // Check if the error indicates the refresh token is also expired
      if (this.isTokenExpiredError(error)) {
        console.log("Refresh token also expired, performing full authentication");
        // Clear existing token and perform full authentication
        this.token = null;
        this.tokenExpiresAt = null;
        return await this.authenticate();
      }
      
      // For other errors, also fallback to full authentication
      console.log("Token refresh failed with unknown error, falling back to full authentication");
      this.token = null;
      this.tokenExpiresAt = null;
      return await this.authenticate();
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} Validation result
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }

    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Check if it's a valid length (8-15 digits as per international standards)
    return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }

  /**
   * Determine SMS sending method based on phone number
   * @param {string} phoneNumber - Phone number to analyze
   * @returns {object} SMS method configuration
   */
  determineSMSMethod(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Check if it's an Uzbekistan number (starts with 998)
    if (cleanPhone.startsWith("998")) {
      return {
        method: "domestic",
        endpoint: "/message/sms/send",
        phone: cleanPhone
      };
    } else {
      // International number - try to determine country code
      let countryCode = "US"; // Default fallback
      let formattedPhone = cleanPhone;

      // Common country code detection
      if (cleanPhone.startsWith("1")) {
        countryCode = "US";
        formattedPhone = cleanPhone;
      } else if (cleanPhone.startsWith("7")) {
        countryCode = "RU";
        formattedPhone = cleanPhone;
      } else if (cleanPhone.startsWith("44")) {
        countryCode = "GB";
        formattedPhone = cleanPhone;
      }
      // Add more country codes as needed

      return {
        method: "international",
        endpoint: "/message/sms/send-global",
        phone: formattedPhone,
        countryCode: countryCode
      };
    }
  }

  /**
   * Check if account is in test mode and modify message if needed
   * @param {string} message - Original message
   * @returns {string} Modified message for test accounts
   */
  prepareMessage(message) {
    // Test account restriction: only certain messages are allowed
    // If we detect we're in test mode (role: "test" in token), use approved test message
    if (this.token) {
      try {
        const tokenPayload = JSON.parse(Buffer.from(this.token.split('.')[1], 'base64').toString());
        if (tokenPayload.role === 'test') {
          console.log('Test account detected - using approved test message');
          return 'This is test from Eskiz';
        }
      } catch (error) {
        // If we can't decode token, continue with original message
        console.warn('Could not decode token to check account type');
      }
    }
    
    return message;
  }

  /**
   * Send SMS message with robust token refresh handling
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @param {number} retryCount - Internal retry counter (max 2 attempts)
   * @returns {Promise<object>} SMS sending result
   */
  async sendSMS(phoneNumber, message, retryCount = 0) {
    try {
      // Validate inputs
      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error("Invalid phone number format");
      }

      if (!message || message.trim().length === 0) {
        throw new Error("Message content cannot be empty");
      }

      if (message.length > 160) {
        console.warn(`SMS message length (${message.length}) exceeds 160 characters, may be sent as multiple parts`);
      }

      // Ensure we have a valid token
      await this.authenticate();

      // Determine SMS method based on phone number
      const smsMethod = this.determineSMSMethod(phoneNumber);
      
      const formData = new FormData();
      formData.append("mobile_phone", smsMethod.phone);
      formData.append("message", this.prepareMessage(message));

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseURL}${smsMethod.endpoint}`,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        data: formData
      };

      if (smsMethod.method === "domestic") {
        // For Uzbekistan numbers
        formData.append("from", this.from);
      } else {
        // For international numbers
        formData.append("country_code", smsMethod.countryCode);
        formData.append("unicode", "0"); // 0 for ASCII, 1 for Cyrillic
      }

      const response = await axios(config);

      if (response.data) {
        console.log(`Eskiz SMS sent successfully to ${phoneNumber}:`, response.data);
        
        return {
          success: true,
          requestId: response.data.id || null,
          message: response.data.message || "SMS sent successfully",
          status: response.data.status || "sent",
          rawResponse: response.data
        };
      } else {
        throw new Error("Invalid response from SMS service");
      }
    } catch (error) {
      console.error("Eskiz SMS sending failed:", error.message);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error("📋 Full API Error Response:");
        console.error("Status:", error.response.status);
        console.error("Status Text:", error.response.statusText);
        console.error("Headers:", error.response.headers);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("📋 No response received:", error.request);
      } else {
        console.error("📋 Error setting up request:", error.message);
      }
      
      // Handle token expiry with robust retry logic
      if (this.isTokenExpiredError(error) && retryCount < 2) {
        console.log(`Token expired error detected, attempting refresh (attempt ${retryCount + 1}/2)`);
        
        try {
          // Clear current token to force fresh authentication
          this.token = null;
          this.tokenExpiresAt = null;
          
          // Get fresh token
          await this.authenticate();
          
          // Retry SMS sending with incremented retry count
          return await this.sendSMS(phoneNumber, message, retryCount + 1);
        } catch (retryError) {
          console.error(`Eskiz SMS retry attempt ${retryCount + 1} failed:`, retryError.message);
          
          // If this was the last retry, return the retry error
          if (retryCount >= 1) {
            return {
              success: false,
              error: `SMS failed after ${retryCount + 1} retry attempts: ${retryError.message}`,
              requestId: null,
              rawResponse: retryError.response ? retryError.response.data : null
            };
          }
        }
      }

      return {
        success: false,
        error: error.message,
        requestId: null,
        rawResponse: error.response ? error.response.data : null
      };
    }
  }

  /**
   * Check if error indicates token expiry
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error indicates token expiry
   */
  isTokenExpiredError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // HTTP 401 Unauthorized
      if (status === 401) {
        return true;
      }
      
      // Check for specific error messages that indicate token expiry
      if (data && typeof data === 'object') {
        const errorMessage = data.message || data.error || '';
        const expiredKeywords = ['token', 'expired', 'unauthorized', 'invalid token', 'authentication'];
        
        return expiredKeywords.some(keyword => 
          errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );
      }
    }
    
    return false;
  }

  /**
   * Get SMS delivery status with robust token refresh handling
   * @param {string} requestId - SMS request ID
   * @param {number} retryCount - Internal retry counter (max 2 attempts)
   * @returns {Promise<object>} Delivery status
   */
  async getSMSStatus(requestId, retryCount = 0) {
    try {
      await this.authenticate();

      const formData = new FormData();
      formData.append("start_date", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " "));
      formData.append("end_date", new Date().toISOString().slice(0, 16).replace("T", " "));
      formData.append("page_size", "200");
      formData.append("count", "0");

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.baseURL}/message/sms/get-user-messages`,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          ...formData.getHeaders()
        },
        data: formData
      };

      const response = await axios(config);

      if (response.data && response.data.data && response.data.data.result) {
        const smsRecord = response.data.data.result.find(record => record.request_id === requestId);
        
        if (smsRecord) {
          return {
            success: true,
            status: smsRecord.status,
            deliveredAt: smsRecord.delivery_sm_at,
            rawRecord: smsRecord
          };
        } else {
          return {
            success: false,
            error: "SMS record not found",
            status: "unknown"
          };
        }
      } else {
        throw new Error("Invalid response from SMS status API");
      }
    } catch (error) {
      console.error("Eskiz SMS status check failed:", error.message);
      
      // Handle token expiry with robust retry logic
      if (this.isTokenExpiredError(error) && retryCount < 2) {
        console.log(`Token expired error detected in status check, attempting refresh (attempt ${retryCount + 1}/2)`);
        
        try {
          // Clear current token to force fresh authentication
          this.token = null;
          this.tokenExpiresAt = null;
          
          // Get fresh token
          await this.authenticate();
          
          // Retry status check with incremented retry count
          return await this.getSMSStatus(requestId, retryCount + 1);
        } catch (retryError) {
          console.error(`Eskiz SMS status check retry attempt ${retryCount + 1} failed:`, retryError.message);
        }
      }
      
      return {
        success: false,
        error: error.message,
        status: "error"
      };
    }
  }

  /**
   * Test SMS service connectivity and authentication
   * @returns {Promise<object>} Test result
   */
  async testConnection() {
    try {
      const token = await this.authenticate();
      return {
        success: true,
        message: "SMS service connection successful",
        hasToken: !!token
      };
    } catch (error) {
      return {
        success: false,
        message: "SMS service connection failed",
        error: error.message
      };
    }
  }
}

// Export singleton instance following DRY principle
module.exports = new EskizSMSService();
