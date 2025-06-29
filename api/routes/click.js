const express = require("express");
const router = express.Router();
const clickController = require("../controllers/clickController");

router.post("/prepare", clickController.prepare);
router.post("/complete", clickController.complete);
router.post("/checkout", clickController.checkout);

module.exports = router;
