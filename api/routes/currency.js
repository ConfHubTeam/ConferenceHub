const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// create new currency
router.post('/', currencyController.createCurrency);

// update currency by ID
router.put('/:id', currencyController.updateCurrency);

// get all currencies
router.get('/', currencyController.getAllCurrencies);

module.exports = router;