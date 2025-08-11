const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Test endpoint
router.get("/test", authController.test);

// Get password requirements
router.get("/password-requirements", authController.getPasswordRequirements);

// Check if user exists
router.post("/check-user", authController.checkUserExists);

// Check if phone number exists
router.post("/check-phone", authController.checkPhoneExists);

// Registration phone verification endpoints (no authentication required)
router.post("/registration/send-phone-code", authController.sendRegistrationPhoneCode);
router.post("/registration/verify-phone-code", authController.verifyRegistrationPhoneCode);

// Register a new user
router.post("/register", authController.register);

// Login a user
router.post("/login", authController.login);

// Phone login - send verification code
router.post("/phone-login/send-code", authController.sendPhoneLoginCode);

// Phone login - verify code and login
router.post("/phone-login/verify-code", authController.verifyPhoneLoginCode);

// Logout a user
router.post("/logout", authController.logout);

module.exports = router;
