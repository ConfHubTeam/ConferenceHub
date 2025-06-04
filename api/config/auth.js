require('dotenv').config();
const bcrypt = require("bcryptjs");

// Authentication configuration
const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-strong-secret-key-here',
    options: {
      // Token expiration time (7 days in milliseconds)
      expiresIn: '7d'
    },
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  },
  
  // Password Hashing Configuration
  bcrypt: {
    saltRounds: 8,
    generateSalt: () => bcrypt.genSaltSync(8)
  },
  
  // Password Requirements
  passwordPolicy: {
    minLength: 8,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecialChar: true,
    allowedSpecialChars: "@$!%*?&",
    regex: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
  },
  
  // Session Configuration (for Telegram verification)
  session: {
    secret: process.env.SESSION_SECRET || 'telegram-verification-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    },
    unset: 'destroy' // Ensure session data is completely removed when destroyed
  }
};

module.exports = authConfig;
