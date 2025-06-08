import { useState, useEffect, useCallback } from "react";
import { useCurrency } from "../contexts/CurrencyContext";
import { convertCurrency } from "../utils/currencyUtils";

/**
 * Custom hook for handling currency conversion
 * @param {number} amount - Original amount to convert
 * @param {Object} originalCurrency - Original currency object
 * @returns {Object} - Converted amount, loading state, and error
 */
export default function useCurrencyConversion(amount, originalCurrency) {
  const { selectedCurrency } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const performConversion = useCallback(async () => {
    // Don't convert if we don't have necessary data
    if (
      !amount || 
      !originalCurrency?.charCode || 
      !selectedCurrency?.charCode
    ) {
      setConvertedAmount(amount);
      return;
    }

    // No need to convert if currencies are the same
    if (originalCurrency.charCode === selectedCurrency.charCode) {
      setConvertedAmount(amount);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await convertCurrency(
        amount,
        originalCurrency.charCode,
        selectedCurrency.charCode
      );
      setConvertedAmount(result);
    } catch (error) {
      console.error("Currency conversion error:", error);
      setError(error.message);
      // Return original amount on error
      setConvertedAmount(amount);
    } finally {
      setIsLoading(false);
    }
  }, [amount, originalCurrency, selectedCurrency]);

  useEffect(() => {
    performConversion();
  }, [performConversion]);

  return {
    convertedAmount,
    isLoading,
    error,
    originalAmount: amount,
    targetCurrency: selectedCurrency,
    originalCurrency
  };
}
