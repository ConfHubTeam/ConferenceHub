/**
 * Cached exchange rates
 * Structure: { baseCurrency: { toCurrency: rate, ... }, ... }
 */
const exchangeRatesCache = {};

/**
 * Time when each rate was last fetched (in milliseconds)
 */
const rateLastFetched = {};

/**
 * Cache duration in milliseconds (1 hour)
 */
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Fetches exchange rates for a given base currency
 * @param {string} baseCurrency - Base currency code (e.g., USD, UZS, RUB)
 * @returns {Promise<Object>} - Exchange rates object
 */
export async function getExchangeRates(baseCurrency) {
  // Check if we have unexpired rates in the cache
  const now = Date.now();
  if (
    exchangeRatesCache[baseCurrency] && 
    rateLastFetched[baseCurrency] && 
    (now - rateLastFetched[baseCurrency] < CACHE_DURATION)
  ) {
    return exchangeRatesCache[baseCurrency];
  }

  try {
    // Import api utility for proper URL configuration
    const api = (await import("./api")).default;
    const response = await api.get(`/currency/rates/${baseCurrency}`);
    
    const data = response.data;
    
    if (!data.rates) {
      throw new Error(`Invalid exchange rate data for ${baseCurrency}`);
    }
    
    // Store in cache
    exchangeRatesCache[baseCurrency] = data.rates;
    rateLastFetched[baseCurrency] = now;
    
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    
    // Provide fallback rates for common conversions if API fails
    // This ensures basic functionality even when the API is unavailable
    if (!exchangeRatesCache[baseCurrency]) {
      const fallbackRates = {
        'UZS': { 'USD': 0.000082, 'RUB': 0.0076 },
        'USD': { 'UZS': 12195.50, 'RUB': 92.38 },
        'RUB': { 'UZS': 132.02, 'USD': 0.0108 }
      };
      
      if (fallbackRates[baseCurrency]) {
        console.log(`Using fallback rates for ${baseCurrency}`);
        exchangeRatesCache[baseCurrency] = fallbackRates[baseCurrency];
        rateLastFetched[baseCurrency] = now;
        return fallbackRates[baseCurrency];
      }
    }
    
    throw error;
  }
}

/**
 * Converts an amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} - Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  // If currencies are the same or amount is invalid, no conversion needed
  if (
    fromCurrency === toCurrency || 
    amount === null || 
    amount === undefined ||
    isNaN(parseFloat(amount))
  ) {
    return parseFloat(amount) || 0;
  }
  
  try {
    // Handle case where currency codes aren't provided as strings
    const fromCode = fromCurrency?.charCode || fromCurrency;
    const toCode = toCurrency?.charCode || toCurrency;
    
    if (!fromCode || !toCode) {
      console.error("Invalid currency format:", { fromCurrency, toCurrency });
      return parseFloat(amount) || 0;
    }
    
    // Get rates with fromCurrency as base
    const rates = await getExchangeRates(fromCode);
    
    if (!rates[toCode]) {
      throw new Error(`Exchange rate not available for ${toCode}`);
    }
    
    // Apply conversion
    return parseFloat(amount) * rates[toCode];
  } catch (error) {
    console.error(`Error converting from ${fromCurrency} to ${toCurrency}:`, error);
    return parseFloat(amount) || 0; // Return original amount on error
  }
}

/**
 * Formats a numeric value according to the specified currency format
 * @param {number|string} value - The numeric value to format
 * @param {Object} currency - Currency object with charCode property
 * @returns {string} - Formatted currency value as string
 */
export function formatCurrency(value, currency) {
  if (value === null || value === undefined || value === "") return "";
  
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  
  // Get currency code from currency object
  const currencyCode = currency?.charCode || "UZS";
  
  switch (currencyCode) {
    case "UZS":
      // UZS: No decimal digits (e.g., 150,000)
      return Math.round(num).toLocaleString("en-US", {
        maximumFractionDigits: 0,
        useGrouping: true
      });
    case "USD":
      // USD: Two decimals (e.g., 1,000.50)
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      });
    case "RUB":
      // RUB: Two decimals with space as thousand separator (e.g., 1 000,50)
      return num.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      });
    default:
      // Default format
      return num.toLocaleString("en-US");
  }
}

/**
 * Returns the appropriate symbol for a given currency
 * @param {Object} currency - Currency object with charCode property
 * @returns {string} - Currency symbol
 */
export function getCurrencySymbol(currency) {
  if (!currency) return "";
  
  const currencyCode = currency.charCode;
  switch (currencyCode) {
    case "USD": return "$";
    case "RUB": return "₽";
    case "UZS": return "UZS";
    default: return currencyCode;
  }
}

/**
 * Formats a price with its currency symbol according to local conventions
 * @param {number|string} value - The numeric value to format
 * @param {Object} currency - Currency object with charCode property
 * @returns {string} - Fully formatted price with symbol
 */
export function formatPriceWithSymbol(value, currency) {
  if (value === null || value === undefined || value === "") return "";
  
  const formattedValue = formatCurrency(value, currency);
  const symbol = getCurrencySymbol(currency);
  
  if (!currency) return formattedValue;
  
  switch (currency.charCode) {
    case "USD": 
      return `${symbol}${formattedValue}`;
    case "RUB":
      return `${formattedValue} ${symbol}`;
    case "UZS":
    default:
      return `${formattedValue} ${symbol}`;
  }
}

/**
 * Removes all formatting from a currency string to get the numeric value
 * @param {string} formattedValue - The formatted currency string
 * @returns {string} - Clean numeric string suitable for parsing
 */
export function unformatCurrency(formattedValue) {
  if (!formattedValue) return "";
  
  // Remove all non-numeric characters except decimal point
  return formattedValue.replace(/[^\d.]/g, "");
}

/**
 * Determines if the currency symbol should be shown as a prefix
 * @param {Object} currency - Currency object with charCode property
 * @returns {boolean} - True if symbol should be prefix
 */
export function shouldShowPrefix(currency) {
  return currency?.charCode === "USD";
}

/**
 * Determines if the currency symbol should be shown as a suffix
 * @param {Object} currency - Currency object with charCode property
 * @returns {boolean} - True if symbol should be suffix
 */
export function shouldShowSuffix(currency) {
  return currency?.charCode !== "USD";
}

/**
 * Returns maximum number of decimals for a currency
 * @param {Object} currency - Currency object with charCode property
 * @returns {number} - Maximum number of decimal places
 */
export function getDecimalPlaces(currency) {
  if (!currency) return 2;
  
  switch (currency.charCode) {
    case "UZS": return 0;  // No decimals
    case "USD": return 2;  // Two decimals
    case "RUB": return 2;  // Two decimals
    default: return 2;     // Default to 2 decimals
  }
}
