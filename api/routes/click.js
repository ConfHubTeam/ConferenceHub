const express = require("express");
const router = express.Router();
const clickController = require("../controllers/clickController");

router.group('/click', route => {
	route.post('/prepare', clickController.prepare)
	route.post('/complete', clickController.complete)
	route.post('/checkout', clickController.checkout)
});

module.exports = router;
