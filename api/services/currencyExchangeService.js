const axios = require("axios");
const NodeCache = require("node-cache");

/**
 * Service for handling currency exchange operations
 * Uses the Exchange Rate API: https://open.er-api.com/v6/latest/{baseCurrency}
 */
class CurrencyExchangeService {
  constructor() {
    // Cache exchange rates for 1 hour (3600 seconds)
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.supportedCurrencies = ["USD", "UZS", "RUB"];
  }

  /**
   * Get exchange rates for a specific base currency
   * @param {string} baseCurrency - Base currency code (e.g., USD, UZS, RUB)
   * @returns {Promise<Object>} - Exchange rates object
   */
  async getExchangeRates(baseCurrency) {
    // Validate base currency
    const normalizedBase = baseCurrency.toUpperCase();
    if (!this.supportedCurrencies.includes(normalizedBase)) {
      throw new Error(`Unsupported base currency: ${baseCurrency}`);
    }

    // Check if rates are in cache
    const cacheKey = `rates_${normalizedBase}`;
    const cachedRates = this.cache.get(cacheKey);

    if (cachedRates) {
      return cachedRates;
    }

    try {
      // Fetch fresh rates from the API
      const response = await axios.get(`https://open.er-api.com/v6/latest/${normalizedBase}`);
      
      if (response.data && response.data.result === "success") {
        // Store rates in cache
        this.cache.set(cacheKey, response.data.rates);
        return response.data.rates;
      } else {
        throw new Error("Failed to fetch exchange rates");
      }
    } catch (error) {
      console.error("Exchange rate API error:", error.message);
      throw new Error("Failed to fetch exchange rates");
    }
  }

  /**
   * Convert an amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<number>} - Converted amount
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      // Get rates with the source currency as base
      const rates = await this.getExchangeRates(fromCurrency);
      
      if (!rates[toCurrency]) {
        throw new Error(`Exchange rate not available for ${toCurrency}`);
      }

      // Apply conversion
      return amount * rates[toCurrency];
    } catch (error) {
      console.error("Currency conversion error:", error.message);
      throw error;
    }
  }
}

// Create singleton instance
const currencyExchangeService = new CurrencyExchangeService();

module.exports = currencyExchangeService;
