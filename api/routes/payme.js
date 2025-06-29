const express = require("express");
const router = express.Router();
const paymeController = require("../controllers/paymeController");

router.post("/pay", paymeController.pay);
router.post("/checkout", paymeController.checkout);

module.exports = router;