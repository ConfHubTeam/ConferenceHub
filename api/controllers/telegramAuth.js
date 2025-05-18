const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Environment variables for Telegram Gateway API and Bot
const TELEGRAM_TOKEN = process.env.TELEGRAM_GATEWAY_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(8);

// Check if a phone number can receive verification messages
exports.checkSendAbility = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return res.status(400).json({
        ok: false,
        error: 'Please provide a valid phone number in E.164 format (e.g., +12345678901)'
      });
    }
    
    // Call Telegram Gateway API to check send ability
    const response = await axios.post(
      'https://gatewayapi.telegram.org/checkSendAbility',
      { phone_number: phoneNumber },
      {
        headers: {
          'Authorization': `Bearer ${TELEGRAM_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.ok) {
      // Store in session for later use
      req.session.telegramVerification = {
        phoneNumber,
        requestId: response.data.result.request_id,
        timestamp: Date.now()
      };
      
      // Check if user with this phone number already exists
      const userExists = await User.findOne({ 
        where: { telegramPhone: phoneNumber } 
      });
      
      return res.json({
        ok: true,
        requestId: response.data.result.request_id,
        userExists: !!userExists
      });
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Unable to send verification message to this phone number'
      });
    }
  } catch (error) {
    console.error('Telegram checkSendAbility error:', error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred while checking phone number. Please try again.'
    });
  }
};

// Send verification code to the user's Telegram account
exports.sendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber, requestId } = req.body;
    
    if (!phoneNumber || !requestId) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number and request ID are required'
      });
    }
    
    // Verify that this matches what's in the session
    const sessionData = req.session.telegramVerification;
    if (!sessionData || sessionData.phoneNumber !== phoneNumber) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid session data. Please start over.'
      });
    }
    
    // Call Telegram Gateway API to send verification code
    const response = await axios.post(
      'https://gatewayapi.telegram.org/sendVerificationMessage',
      {
        phone_number: phoneNumber,
        request_id: requestId,
        code_length: 6,
        ttl: 300 // 5 minutes
      },
      {
        headers: {
          'Authorization': `Bearer ${TELEGRAM_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.ok) {
      // Check if user with this phone number already exists
      const userExists = await User.findOne({
        where: { telegramPhone: phoneNumber }
      });
      
      // Update session with new request ID
      req.session.telegramVerification = {
        ...sessionData,
        requestId: response.data.result.request_id,
        timestamp: Date.now()
      };
      
      return res.json({
        ok: true,
        requestId: response.data.result.request_id,
        userExists: !!userExists
      });
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Failed to send verification code'
      });
    }
  } catch (error) {
    console.error('Telegram sendVerificationCode error:', error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred while sending verification code. Please try again.'
    });
  }
};

// Verify the code entered by the user
exports.verifyCode = async (req, res) => {
  try {
    const { requestId, code, username, userType } = req.body;
    
    if (!requestId || !code) {
      return res.status(400).json({
        ok: false,
        error: 'Request ID and verification code are required'
      });
    }
    
    // Verify session data
    const sessionData = req.session.telegramVerification;
    if (!sessionData || sessionData.requestId !== requestId) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid session data. Please start over.'
      });
    }
    
    // Check if the verification request has expired (15 minutes max)
    const now = Date.now();
    if (now - sessionData.timestamp > 15 * 60 * 1000) {
      return res.status(400).json({
        ok: false,
        error: 'Verification request has expired. Please start over.'
      });
    }
    
    // Call Telegram Gateway API to verify the code
    const response = await axios.post(
      'https://gatewayapi.telegram.org/checkVerificationStatus',
      {
        request_id: requestId,
        code
      },
      {
        headers: {
          'Authorization': `Bearer ${TELEGRAM_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.ok && 
        response.data.result.verification_status && 
        response.data.result.verification_status.status === 'code_valid') {
      
      // Check if user exists with this phone number
      let user = await User.findOne({ 
        where: { telegramPhone: sessionData.phoneNumber } 
      });
      
      if (user) {
        // User exists, update Telegram data if needed
        if (!user.telegramLinked) {
          user.telegramLinked = true;
          await user.save();
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { email: user.email, id: user.id, userType: user.userType },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        return res.json({
          ok: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email || '',
            userType: user.userType
          },
          token
        });
      } else {
        // New user, check if we have required registration data
        if (!username || !userType) {
          return res.status(400).json({
            ok: false,
            error: 'Username and user type are required for registration'
          });
        }
        
        // Generate a random password
        const randomPassword = crypto.randomBytes(12).toString('hex');
        const hashedPassword = bcrypt.hashSync(randomPassword, bcryptSalt);
        
        // Create new user
        user = await User.create({
          name: username,
          password: hashedPassword,
          telegramPhone: sessionData.phoneNumber,
          telegramLinked: true,
          userType
        });
        
        // Generate JWT token
        const token = jwt.sign(
          { email: user.email, id: user.id, userType: user.userType },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        return res.json({
          ok: true,
          user: {
            id: user.id,
            name: user.name,
            userType: user.userType
          },
          token
        });
      }
    } else {
      // Code is not valid
      return res.status(400).json({
        ok: false,
        error: 'Invalid verification code. Please try again.'
      });
    }
  } catch (error) {
    console.error('Telegram verifyCode error:', error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred while verifying the code. Please try again.'
    });
  }
};

// Handle Telegram Login Widget callback
exports.handleCallback = async (req, res) => {
  try {
    // Handle both GET and POST requests by checking for data in different places
    // For GET requests, data is in query parameters
    // For POST requests, data is in the request body
    const telegramData = req.method === 'GET' ? req.query : req.body;
    
    // Default to client for compatibility with previous versions
    const userType = 'client';
    
    // Validate Telegram data
    if (!validateTelegramLoginData(telegramData)) {
      console.error('Telegram auth validation failed:', JSON.stringify(telegramData));
      return res.redirect('/login?error=invalid_auth');
    }
    
    // Check if the authentication is not too old (1 day max)
    const authDate = parseInt(telegramData.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.redirect('/login?error=expired_auth');
    }
    
    // Get the base URL for redirects - prioritize the host header from the request
    const baseUrl = process.env.APP_URL || 
                   req.headers.origin;
    
    // Redirect to our client-side handler with all the telegram params
    // This keeps the original parameters intact for validation
    return res.redirect(`${baseUrl}/telegram-callback${req.url.substring(req.url.indexOf('?'))}`);
  } catch (error) {
    console.error('Telegram callback error:', error);
    return res.redirect('/login?error=server_error');
  }
};

// New controller method to complete Telegram login with user type
exports.completeLogin = async (req, res) => {
  try {
    const { userType, ...telegramData } = req.body;
    
    // Validate the user type
    if (userType !== 'client' && userType !== 'host') {
      return res.status(400).json({
        ok: false,
        error: 'Invalid user type. Please choose either "client" or "host".'
      });
    }
    
    // Validate Telegram data
    if (!validateTelegramLoginData(telegramData)) {
      console.error('Telegram auth validation failed in complete-login:', JSON.stringify(telegramData));
      return res.status(400).json({
        ok: false,
        error: 'Invalid authentication data.'
      });
    }
    
    // Check if the authentication is not too old (1 day max)
    const authDate = parseInt(telegramData.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.status(400).json({
        ok: false,
        error: 'Authentication has expired. Please try again.'
      });
    }
    
    // Check if a user with this Telegram ID exists
    let user = await User.findOne({ 
      where: { telegramId: String(telegramData.id) } 
    });
    
    let isNewUser = false;
    
    if (user) {
      // Update Telegram data
      user.telegramUsername = telegramData.username || user.telegramUsername;
      user.telegramFirstName = telegramData.first_name || user.telegramFirstName;
      user.telegramPhotoUrl = telegramData.photo_url || user.telegramPhotoUrl;
      user.telegramLinked = true;
      
      // Update user type if explicitly requested
      if (userType && userType !== user.userType) {
        user.userType = userType;
      }
      
      await user.save();
    } else {
      // Create a new account with Telegram data
      isNewUser = true;
      const randomPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = bcrypt.hashSync(randomPassword, bcryptSalt);
      
      // Use Telegram username or first name as the user's name
      const userName = telegramData.username || telegramData.first_name || 'Telegram User';
      
      // Create new user with Telegram data
      user = await User.create({
        name: userName,
        password: hashedPassword,
        telegramId: String(telegramData.id),
        telegramUsername: telegramData.username || null,
        telegramFirstName: telegramData.first_name || null,
        telegramPhotoUrl: telegramData.photo_url || null,
        telegramPhone: telegramData.phone || null,
        telegramLinked: true,
        userType: userType // Use the selected user type
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, id: user.id, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set cookie for browser-based access
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    return res.json({
      ok: true,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email || '',
        userType: user.userType
      },
      token
    });
  } catch (error) {
    console.error('Telegram complete-login error:', error);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred during authentication. Please try again.'
    });
  }
};

// Add a logout function for Telegram authentication
exports.logoutTelegram = async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User not authenticated'
      });
    }
    
    // Find the user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    // Check if the user is linked to Telegram
    if (!user.telegramLinked) {
      return res.status(400).json({
        ok: false,
        error: 'User is not linked to Telegram'
      });
    }
    
    // Update user's Telegram connection status
    user.telegramLinked = false;
    // Don't remove the Telegram data, just disconnect it
    // This allows easy reconnection later if needed
    
    await user.save();
    
    // Clear the token cookie
    res.clearCookie('token');
    
    return res.json({
      ok: true,
      message: 'Successfully logged out from Telegram'
    });
  } catch (error) {
    console.error('Telegram logout error:', error);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred during logout. Please try again.'
    });
  }
};

// Utility function to validate Telegram Login Widget data
function validateTelegramLoginData(data) {
  if (!data.id || !data.hash || !data.auth_date) {
    return false;
  }
  
  // Create data check string by sorting all fields alphabetically
  const dataCheckArr = Object.entries(data)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  
  // Create secret key by SHA256 of the bot token
  const secretKey = crypto.createHash('sha256')
    .update(TELEGRAM_BOT_TOKEN)
    .digest();
  
  // Generate HMAC-SHA256 hash of the data check string
  const hash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // Compare our hash with the hash from Telegram
  return hash === data.hash;
}