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

// Register a new user
router.post("/register", authController.register);

// Login a user
router.post("/login", authController.login);

// Logout a user
router.post("/logout", authController.logout);

module.exports = router;
