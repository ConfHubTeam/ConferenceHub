const express = require("express");
const router = express.Router();
const clickController = require("../controllers/clickController");
const { authenticateToken } = require("../middleware/auth");

// Click.uz webhook endpoints (no auth needed for external service calls)
router.post("/prepare", clickController.prepare);
router.post("/complete", clickController.complete);

// Client checkout endpoint (requires authentication)
router.post("/checkout", authenticateToken, clickController.checkout);

module.exports = router;
