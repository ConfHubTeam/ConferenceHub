const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/paymeController");
const { paymeCheckToken } = require("../middleware/payme");

// Payme webhook endpoint (requires authentication)
router.post("/pay", paymeCheckToken, paymeController.pay);

// Payme payment form submission endpoint (no auth needed)
router.post("/checkout", paymeController.checkout);

// Payme configuration
router.get("/config", paymeController.getConfig);

// User phone management for Payme
router.get("/user-phone", paymeController.getUserPhone);
router.patch("/update-phone", paymeController.updatePaymePhone);

module.exports = router;