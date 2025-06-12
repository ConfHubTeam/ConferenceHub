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
    return res.status(400).json({ error: "Email is required" });
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
    return res.status(400).json({ error: "Invalid email format" });
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
    
    let specificError = "Password must be at least 8 characters with uppercase, lowercase, number and special character";
    
    // If it has invalid special characters but meets all other requirements
    if (hasLowercase && hasUppercase && hasNumber && !hasSpecialChar && hasMinLength) {
      specificError = `Password must include at least one of these special characters: ${allowedSpecialChars}`;
    }
    
    return res.status(400).json({ 
      error: specificError,
      allowedSpecialChars: allowedSpecialChars
    });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "This email is already registered" });
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
    return res.status(422).json({ error: "Email and password are required" });
  }
  
  // Validate email format
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    return res.status(422).json({ error: "Invalid email format" });
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
        const allowedSpecialChars = "@$!%*?&";
        // Check if password might be failing due to special characters
        const hasSpecialChar = new RegExp(`[${allowedSpecialChars}]`).test(password);
        if (!hasSpecialChar && password.length >= 8) {
          res.status(422).json({ 
            error: "Password must include at least one special character",
            allowedSpecialChars: allowedSpecialChars
          });
        } else {
          res.status(422).json({ error: "Password is incorrect" });
        }
      }
    } else {
      res.status(422).json({ error: "User not found" });
    }
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed. Please try again." });
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
  
  res.json({ success: true, message: "Logged out successfully" });
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
