const Currency = require('../models/currency');
const currencyExchangeService = require('../services/currencyExchangeService');

const createCurrency = async (req, res) => {
  const { name, code, charCode } = req.body;

  if (!name || !code || !charCode) {
    return res.status(400).json({ error: "Name, code and char-code are required" });
  }

  try {
     // Process numeric fields
    const currency = await Currency.create({
      name: name,
      code: code,
      charCode: charCode
    });
    res.json(currency);
  } catch (error) {
    console.error("Error:", error);
    res.status(422).json({ error: error.message });
  }
};

const updateCurrency = async (req, res) => {
  const { id } = req.params;
  const { name, code, charCode } = req.body;

  try {
    const currency = await Currency.findByPk(id);
    if (!currency) {
      return res.status(404).json({ error: "Currency not found" });
    }

    currency.name = name || currency.name;
    currency.code = code || currency.code;
    currency.charCode = charCode || currency.charCode;

    await currency.save();
    res.json(currency);
  } catch (error) {
    console.error("Error:", error);
    res.status(422).json({ error: error.message });
  }
};

const getAllCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.findAll();
    res.json(currencies);
  } catch (error) {
    console.error("Error:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get exchange rates for a specific base currency
 */
const getExchangeRates = async (req, res) => {
  const { baseCurrency } = req.params;
  
  if (!baseCurrency) {
    return res.status(400).json({ error: "Base currency is required" });
  }

  try {
    const rates = await currencyExchangeService.getExchangeRates(baseCurrency);
    res.json({ baseCurrency, rates });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Convert an amount from one currency to another
 */
const convertCurrency = async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.query;
  
  if (!amount || !fromCurrency || !toCurrency) {
    return res.status(400).json({ 
      error: "Amount, source currency, and target currency are required" 
    });
  }

  try {
    const convertedAmount = await currencyExchangeService.convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );
    
    res.json({
      original: { amount: parseFloat(amount), currency: fromCurrency },
      converted: { amount: convertedAmount, currency: toCurrency }
    });
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCurrency,
  updateCurrency,
  getAllCurrencies,
  getExchangeRates,
  convertCurrency
};