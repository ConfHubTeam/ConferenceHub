const express = require('express');
const router = express.Router();
const telegramAuthController = require('../controllers/telegramAuth');
const { isAuthenticated } = require('../middleware/auth');

// Check ability to send verification code
router.post('/check-ability', telegramAuthController.checkSendAbility);

// Send verification code
router.post('/send-code', telegramAuthController.sendVerificationCode);

// Verify code and complete registration/login
router.post('/verify', telegramAuthController.verifyCode);

// Handle Telegram Login Widget callback - support both GET and POST methods
router.get('/callback', telegramAuthController.handleCallback);
router.post('/callback', telegramAuthController.handleCallback);

// Complete Telegram login with user type
router.post('/complete-login', telegramAuthController.completeLogin);

// Handle Telegram logout (requires authentication)
router.post('/logout', isAuthenticated, telegramAuthController.logoutTelegram);

module.exports = router;