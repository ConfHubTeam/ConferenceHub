const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/paymeController");
const { paymeCheckToken } = require('../middleware/payme');

router.post("/pay", paymeCheckToken, paymeController.pay);
router.post("/checkout", paymeController.checkout);

module.exports = router;