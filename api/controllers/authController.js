const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const authConfig = require("../config/auth");

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
    res.status(500).json({ error: "Failed to check if user exists" });
  }
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  const { name, email, password, userType } = req.body;
  
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
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: req.t("auth:register.emailExists") });
    }
    
    const bcryptSalt = authConfig.bcrypt.generateSalt();
    const userData = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
      userType: userType || 'client', // Default to client if not provided
    });
    res.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      userType: userData.userType
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

/**
 * Test endpoint
 */
const test = (req, res) => {
  res.json("test ok");
};

module.exports = {
  getPasswordRequirements,
  checkUserExists,
  register,
  login,
  logout,
  test
};
