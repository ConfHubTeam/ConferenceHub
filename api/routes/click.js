const express = require("express");
const router = express.Router();
const clickController = require("../controllers/clickController");
const { authenticateToken } = require("../middleware/auth");
const ClickMerchantApiService = require("../services/clickMerchantApiService");

// Merchant API endpoints (requires authentication)
router.post("/create-invoice", authenticateToken, clickController.createPaymentInvoice);
router.post("/checkout", authenticateToken, clickController.createPaymentInvoice); // Alias for checkout
router.get("/payment-status/:bookingId", authenticateToken, clickController.checkPaymentStatus);
router.get("/payment-info/:bookingId", authenticateToken, clickController.getPaymentInfo);
router.get("/user-phone", authenticateToken, clickController.getUserPhoneForClick);

// Test Click.uz Merchant API connection
router.get("/test-merchant-api", authenticateToken, async (req, res) => {
  try {
    const { merchantTransId, paymentDate } = req.query;
    
    if (!merchantTransId) {
      return res.status(400).json({ 
        error: "merchantTransId parameter is required" 
      });
    }

    console.log(`🧪 Testing Click.uz Merchant API for: ${merchantTransId}`);
    
    const clickApi = new ClickMerchantApiService();
    const result = await clickApi.checkPaymentStatusMultipleDates(merchantTransId, 3);

    res.json({
      success: true,
      merchantTransId,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Click.uz Merchant API test error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
