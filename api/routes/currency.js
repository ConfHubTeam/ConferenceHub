const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// Create new currency
router.post('/', currencyController.createCurrency);

// Update currency by ID
router.put('/:id', currencyController.updateCurrency);

// Get all currencies
router.get('/', currencyController.getAllCurrencies);

// Get exchange rates for a specific base currency
router.get('/rates/:baseCurrency', currencyController.getExchangeRates);

// Convert currency amount
router.get('/convert', currencyController.convertCurrency);

module.exports = router;