import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { formatCurrency, getCurrencySymbol, convertCurrency } from "../utils/currencyUtils";
import { useCurrency } from "./CurrencyContext";

/**
 * Context for price range filtering
 * Follows Single Responsibility principle by focusing only on price filter state
 * Follows Open/Closed principle - extensible for future price filter features
 * Follows Interface Segregation - provides only price-related functionality
 */
const PriceFilterContext = createContext();

/**
 * Custom hook to use the PriceFilter context
 * @returns {Object} PriceFilter context values and methods
 * @throws {Error} If used outside of PriceFilterProvider
 */
export const usePriceFilter = () => {
  const context = useContext(PriceFilterContext);
  if (context === undefined) {
    throw new Error("usePriceFilter must be used within a PriceFilterProvider");
  }
  return context;
};

/**
 * Provider component for price range filtering functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Provider component
 */
export const PriceFilterProvider = ({ children }) => {
  // State for price range (null values indicate no limit set)
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Get currency context for conversion utilities
  const { selectedCurrency: contextCurrency, convertToSelectedCurrency } = useCurrency();

  /**
   * Updates the price range
   * @param {number|null} min - Minimum price value or null for no minimum
   * @param {number|null} max - Maximum price value or null for no maximum
   * @param {Object|null} currency - Currency object or null to use context currency
   */
  const updatePriceRange = useCallback((min, max, currency = null) => {
    // Validate and sanitize input values
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseFloat(min)) 
      ? parseFloat(min) 
      : null;
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseFloat(max)) 
      ? parseFloat(max) 
      : null;

    // Ensure min is not greater than max
    if (sanitizedMin !== null && sanitizedMax !== null && sanitizedMin > sanitizedMax) {
      return;
    }

    setMinPrice(sanitizedMin);
    setMaxPrice(sanitizedMax);
    setSelectedCurrency(currency || contextCurrency);
  }, [contextCurrency]);

  /**
   * Updates only the minimum price
   * @param {number|null} min - Minimum price value or null for no minimum
   */
  const updateMinPrice = useCallback((min) => {
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseFloat(min)) 
      ? parseFloat(min) 
      : null;

    // Validate against existing max price
    if (sanitizedMin !== null && maxPrice !== null && sanitizedMin > maxPrice) {
      return;
    }

    setMinPrice(sanitizedMin);
    setSelectedCurrency(selectedCurrency || contextCurrency);
  }, [maxPrice, selectedCurrency, contextCurrency]);

  /**
   * Updates only the maximum price
   * @param {number|null} max - Maximum price value or null for no maximum
   */
  const updateMaxPrice = useCallback((max) => {
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseFloat(max)) 
      ? parseFloat(max) 
      : null;

    // Validate against existing min price
    if (sanitizedMax !== null && minPrice !== null && sanitizedMax < minPrice) {
      return;
    }

    setMaxPrice(sanitizedMax);
    setSelectedCurrency(selectedCurrency || contextCurrency);
  }, [minPrice, selectedCurrency, contextCurrency]);

  /**
   * Clears all price range selections
   */
  const clearPriceFilter = useCallback(() => {
    setMinPrice(null);
    setMaxPrice(null);
    setSelectedCurrency(null);
  }, []);

  /**
   * Formats the price range for display using the selected currency
   * @returns {string} Formatted price range string or empty if no range set
   */
  const getFormattedPriceRange = useCallback(() => {
    const currency = selectedCurrency || contextCurrency;
    
    if (!currency) return "";

    const symbol = getCurrencySymbol(currency);
    const hasMin = minPrice !== null && minPrice !== undefined;
    const hasMax = maxPrice !== null && maxPrice !== undefined;

    if (!hasMin && !hasMax) return "";

    if (hasMin && hasMax) {
      const formattedMin = formatCurrency(minPrice, currency);
      const formattedMax = formatCurrency(maxPrice, currency);
      
      // Format based on currency conventions
      if (currency.charCode === "USD") {
        return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
      } else {
        return `${formattedMin} - ${formattedMax} ${symbol}`;
      }
    } else if (hasMin) {
      const formattedMin = formatCurrency(minPrice, currency);
      
      if (currency.charCode === "USD") {
        return `${symbol}${formattedMin}+`;
      } else {
        return `${formattedMin}+ ${symbol}`;
      }
    } else if (hasMax) {
      const formattedMax = formatCurrency(maxPrice, currency);
      
      if (currency.charCode === "USD") {
        return `Up to ${symbol}${formattedMax}`;
      } else {
        return `Up to ${formattedMax} ${symbol}`;
      }
    }

    return "";
  }, [minPrice, maxPrice, selectedCurrency, contextCurrency]);

  /**
   * Checks if any price filter is active
   * @returns {boolean} True if any price filter is active
   */
  const hasActivePriceFilter = useMemo(() => {
    return (minPrice !== null && minPrice !== undefined) || 
           (maxPrice !== null && maxPrice !== undefined);
  }, [minPrice, maxPrice]);

  /**
   * Gets the current price filter values for API queries
   * @returns {Object} Object with min, max prices and currency
   */
  const getPriceFilterValues = useCallback(() => {
    return {
      minPrice: minPrice,
      maxPrice: maxPrice,
      currency: selectedCurrency || contextCurrency
    };
  }, [minPrice, maxPrice, selectedCurrency, contextCurrency]);

  /**
   * Converts current price range to a specific currency
   * @param {Object} targetCurrency - Target currency object
   * @returns {Promise<Object>} Converted price range object
   */
  const convertPriceRangeToCurrency = useCallback(async (targetCurrency) => {
    if (!hasActivePriceFilter || !selectedCurrency || !targetCurrency) {
      return { minPrice: null, maxPrice: null, currency: targetCurrency };
    }

    try {
      const convertedMin = minPrice !== null 
        ? await convertCurrency(minPrice, selectedCurrency.charCode, targetCurrency.charCode)
        : null;
      
      const convertedMax = maxPrice !== null 
        ? await convertCurrency(maxPrice, selectedCurrency.charCode, targetCurrency.charCode)
        : null;

      return {
        minPrice: convertedMin,
        maxPrice: convertedMax,
        currency: targetCurrency
      };
    } catch (error) {
      return { minPrice, maxPrice, currency: selectedCurrency };
    }
  }, [minPrice, maxPrice, selectedCurrency, hasActivePriceFilter]);

  /**
   * Serializes price filter for URL parameters
   * @returns {Object} Object with serialized price filter values
   */
  const getSerializedValues = useCallback(() => {
    const result = {};
    
    if (minPrice !== null && minPrice !== undefined) {
      result.minPrice = minPrice.toString();
    }
    
    if (maxPrice !== null && maxPrice !== undefined) {
      result.maxPrice = maxPrice.toString();
    }
    
    if (selectedCurrency) {
      result.priceCurrency = selectedCurrency.charCode;
    }
    
    return result;
  }, [minPrice, maxPrice, selectedCurrency]);

  /**
   * Deserializes price filter from URL parameters
   * @param {Object} params - URL parameters object
   */
  const setFromSerializedValues = useCallback((params) => {
    let parsedMin = null;
    let parsedMax = null;
    let parsedCurrency = null;

    // Parse minimum price
    if (params.minPrice) {
      const min = parseFloat(params.minPrice);
      if (!isNaN(min) && min >= 0) {
        parsedMin = min;
      }
    }

    // Parse maximum price
    if (params.maxPrice) {
      const max = parseFloat(params.maxPrice);
      if (!isNaN(max) && max >= 0) {
        parsedMax = max;
      }
    }

    // Parse currency - would need to be resolved against available currencies
    if (params.priceCurrency) {
      // In a real implementation, you'd look this up from available currencies
      // For now, we'll store the currency code and let the component resolve it
      parsedCurrency = { charCode: params.priceCurrency };
    }

    // Validate that min is not greater than max
    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      return;
    }

    setMinPrice(parsedMin);
    setMaxPrice(parsedMax);
    setSelectedCurrency(parsedCurrency);
  }, []);

  // Create value object with all context data and methods
  // Following Dependency Inversion principle - depend on abstractions, not concretions
  const value = useMemo(() => ({
    // State
    minPrice,
    maxPrice,
    selectedCurrency: selectedCurrency || contextCurrency,
    
    // State update methods
    updatePriceRange,
    updateMinPrice,
    updateMaxPrice,
    clearPriceFilter,
    
    // Formatting and utility methods
    getFormattedPriceRange,
    getPriceFilterValues,
    convertPriceRangeToCurrency,
    
    // Helper methods
    hasActivePriceFilter,
    getSerializedValues,
    setFromSerializedValues
  }), [
    minPrice, maxPrice, selectedCurrency, contextCurrency,
    updatePriceRange, updateMinPrice, updateMaxPrice, clearPriceFilter,
    getFormattedPriceRange, getPriceFilterValues, convertPriceRangeToCurrency,
    hasActivePriceFilter, getSerializedValues, setFromSerializedValues
  ]);

  return (
    <PriceFilterContext.Provider value={value}>
      {children}
    </PriceFilterContext.Provider>
  );
};
