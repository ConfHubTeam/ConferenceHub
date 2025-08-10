const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const authConfig = require("../config/auth");
const phoneVerificationService = require("../services/phoneVerificationService");

/**
 * Get password requirements
 */
const getPasswordRequirements = (req, res) => {
  res.json(authConfig.passwordPolicy);
};

/**
 * Check if user exists
 */
const checkUserExists = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: req.t("auth:validation.emailRequired") });
  }
  
  try {
    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (e) {
    console.error("Error checking user existence:", e);
    res.status(500).json({ error: req.t("auth:errors.failedToCheckUser") });
  }
};

/**
 * Check if phone number exists
 */
const checkPhoneExists = async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: req.t("auth:validation.phoneRequired") });
  }
  
  try {
    const user = await User.findOne({ where: { phoneNumber } });
    res.json({ exists: !!user });
  } catch (e) {
    console.error("Error checking phone existence:", e);
    res.status(500).json({ error: req.t("auth:errors.failedToCheckPhone") });
  }
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  const { name, email, password, userType, phoneNumber } = req.body;
  
  // Validate email format
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    return res.status(400).json({ error: req.t("auth:validation.emailInvalid") });
  }
  
  // Check if password is strong enough
  const allowedSpecialChars = "@$!%*?&";
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    // Check what specific requirement is failing
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = new RegExp(`[${allowedSpecialChars}]`).test(password);
    const hasMinLength = password.length >= 8;
    
    let specificError = req.t("auth:password.weak");
    
    // If it has invalid special characters but meets all other requirements
    if (hasLowercase && hasUppercase && hasNumber && !hasSpecialChar && hasMinLength) {
      specificError = req.t("auth:password.specialChar", { chars: allowedSpecialChars });
    } else {
      // For security, don't be too specific about what's wrong
      specificError = req.t("auth:password.requirements");
    }
    
    return res.status(400).json({ 
      error: specificError
    });
  }
  
  try {
    // Check if user already exists with email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: req.t("auth:register.emailExists") });
    }
    
    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhoneUser = await User.findOne({ where: { phoneNumber } });
      if (existingPhoneUser) {
        return res.status(409).json({ error: req.t("auth:register.phoneExists") });
      }
    }

    const bcryptSalt = authConfig.bcrypt.generateSalt();
    const userData = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
      userType: userType || 'client', // Default to client if not provided
      phoneNumber: phoneNumber || null, // Add phone number if provided
    });
    res.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      userType: userData.userType,
      phoneNumber: userData.phoneNumber
    });
  } catch (e) {
    res.status(422).json(e);
  }
};

/**
 * Login a user
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Check if required fields are provided
  if (!email || !password) {
    return res.status(422).json({ error: req.t("auth:login.required") });
  }
  
  // Validate email format
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    return res.status(422).json({ error: req.t("auth:validation.emailInvalid") });
  }
  
  try {
    // Update Mongoose query to Sequelize query
    const userData = await User.findOne({ where: { email } });
    if (userData) {
      const pass = bcrypt.compareSync(password, userData.password);
      if (pass) {
        jwt.sign(
          { email: userData.email, id: userData.id, userType: userData.userType },
          authConfig.jwt.secret,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token, authConfig.jwt.cookieOptions).json({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              userType: userData.userType
            });
          }
        );
      } else {
        // For security: don't specify if it's wrong password or user not found
        res.status(422).json({ error: req.t("auth:validation.invalidCredentials") });
      }
    } else {
      // For security: same message as wrong password
      res.status(422).json({ error: req.t("auth:validation.invalidCredentials") });
    }
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: req.t("auth:validation.loginFailed") });
  }
};

/**
 * Logout a user
 */
const logout = (req, res) => {
  // Get all cookies and clear them
  Object.keys(req.cookies).forEach(cookieName => {
    res.clearCookie(cookieName, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
  });
  
  // Clear the main token cookie
  res.clearCookie("token", {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  
  // Clear the session
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session during logout:', err);
      }
    });
  }
  
  res.json({ success: true, message: req.t("auth:logout.success") });
};

// In-memory storage for phone login sessions
// In production, use Redis or database
const phoneLoginSessions = new Map();

/**
 * Send phone login verification code
 */
const sendPhoneLoginCode = async (req, res) => {
  const { phoneNumber, language } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: req.t("auth:validation.phoneRequired") });
  }
  
  try {
    // Check if user exists with this phone number
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(404).json({ error: req.t("auth:errors.phoneNotFound") });
    }
    
    // Use language from request, fallback to user's preferred language, then to 'en'
    const userLanguage = language || user?.preferredLanguage || 'en';
    
    // Use the existing phone verification service with the approved message format
    const result = await phoneVerificationService.sendVerificationCode(phoneNumber, userLanguage);
    
    if (result.success) {
      // Store login session info
      phoneLoginSessions.set(result.sessionId, {
        phoneNumber,
        userId: user.id,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        verified: false
      });
      
      res.json({ 
        success: true, 
        sessionId: result.sessionId,
        message: req.t("auth:success.verificationCodeSent"),
        expiresIn: result.expiresIn
      });
    } else {
      res.status(500).json({ error: result.error || req.t("auth:errors.failedToSendCode") });
    }
  } catch (error) {
    console.error("Error sending phone login code:", error);
    res.status(500).json({ error: req.t("auth:errors.failedToSendCode") });
  }
};

/**
 * Verify phone login code and login user
 */
const verifyPhoneLoginCode = async (req, res) => {
  const { sessionId, code, language } = req.body;
  
  if (!sessionId || !code) {
    return res.status(400).json({ error: req.t("auth:errors.sessionRequired") });
  }
  
  try {
    // Use language from request body, fallback to middleware detected language
    const userLanguage = language || req.language || 'en';
    
    // Verify code using phone verification service
    const verificationResult = phoneVerificationService.verifyCode(sessionId, code, userLanguage);
    
    if (!verificationResult.success) {
      return res.status(400).json({ error: verificationResult.error });
    }
    
    // Get login session info
    const loginSession = phoneLoginSessions.get(sessionId);
    if (!loginSession) {
      return res.status(404).json({ error: req.t("auth:errors.invalidSession") });
    }
    
    // Check session expiration
    if (Date.now() > loginSession.expiresAt) {
      phoneLoginSessions.delete(sessionId);
      return res.status(400).json({ error: req.t("auth:errors.sessionExpiredLogin") });
    }
    
    // Get user data
    const userData = await User.findByPk(loginSession.userId);
    if (!userData) {
      phoneLoginSessions.delete(sessionId);
      return res.status(404).json({ error: req.t("auth:errors.userNotFound") });
    }
    
    // Clean up session
    phoneLoginSessions.delete(sessionId);
    
    // Generate JWT token and login user
    jwt.sign(
      { email: userData.email, id: userData.id, userType: userData.userType },
      authConfig.jwt.secret,
      {},
      (err, token) => {
        if (err) {
          console.error("JWT sign error:", err);
          return res.status(500).json({ error: req.t("auth:errors.failedToGenerateToken") });
        }
        
        res.cookie("token", token, authConfig.jwt.cookieOptions).json({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          userType: userData.userType,
          phoneNumber: userData.phoneNumber,
          loginMethod: 'phone'
        });
      }
    );
  } catch (error) {
    console.error("Error verifying phone login code:", error);
    res.status(500).json({ error: req.t("auth:errors.failedToVerifyCode") });
  }
};

/**
 * Test endpoint
 */
const test = (req, res) => {
  res.json("test ok");
};

module.exports = {
  getPasswordRequirements,
  checkUserExists,
  checkPhoneExists,
  register,
  login,
  logout,
  sendPhoneLoginCode,
  verifyPhoneLoginCode,
  test
};
