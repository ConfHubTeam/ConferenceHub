const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/paymeController");
const { paymeCheckToken } = require("../middleware/payme");
const { authenticateToken } = require("../middleware/auth");

// Payme webhook endpoint (requires authentication)
router.post("/pay", paymeCheckToken, paymeController.pay);

// Payme payment form submission endpoint (no auth needed)
router.post("/checkout", paymeController.checkout);

// Payme payment status checking (requires user authentication)
router.get("/payment-status/:bookingId", authenticateToken, paymeController.checkPaymentStatus);

// Payme configuration
router.get("/config", paymeController.getConfig);

// User phone management for Payme
router.get("/user-phone", authenticateToken, paymeController.getUserPhone);
router.patch("/update-phone", authenticateToken, paymeController.updatePaymePhone);

module.exports = router;