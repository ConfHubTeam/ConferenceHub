const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const ClickMerchantApiService = require("../services/clickMerchantApiService");
const PaymentStatusPoller = require("../services/paymentStatusPoller");

/**
 * Test Click.uz Merchant API connection
 * GET /api/click/test-merchant-api?merchantTransId=REQ-MDEKEZCM-PL1R2
 */
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
    
    // Test single date check
    const result = await clickApi.checkPaymentStatusByMerchantTransId(
      merchantTransId, 
      paymentDate
    );
    
    // Also test multiple dates check
    const multiDateResult = await clickApi.checkPaymentStatusMultipleDates(
      merchantTransId, 
      3
    );

    res.json({
      success: true,
      merchantTransId,
      singleDateCheck: result,
      multipleDateCheck: multiDateResult,
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

/**
 * Force payment status check for a booking
 * POST /api/click/force-payment-check
 * Body: { bookingId: 28 }
 */
router.post("/force-payment-check", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ 
        error: "bookingId is required" 
      });
    }

    console.log(`🔄 Force checking payment status for booking: ${bookingId}`);
    
    const result = await PaymentStatusPoller.checkPaymentStatus(bookingId);
    
    res.json({
      success: true,
      bookingId,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Force payment check error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
