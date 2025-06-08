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
