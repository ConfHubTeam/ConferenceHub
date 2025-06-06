const Currency = require('../models/currency');

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

module.exports = {
  createCurrency,
  updateCurrency,
  getAllCurrencies
};