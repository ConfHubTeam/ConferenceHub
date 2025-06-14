import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../utils/api";
import { getExchangeRates, convertCurrency } from "../utils/currencyUtils";

// Create the context
const CurrencyContext = createContext();
export { CurrencyContext };

// Default currencies if API fails
const defaultCurrencies = [
  { id: 1, name: "Uzbekistan Som", code: "860", charCode: "UZS" },
  { id: 2, name: "United States Dollar", code: "840", charCode: "USD" },
  { id: 3, name: "Russian Ruble", code: "643", charCode: "RUB" }
];

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);

  // Fetch currencies on component mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get("/currency");
        if (response.data && response.data.length > 0) {
          setAvailableCurrencies(response.data);
          
          // Set default currency to UZS if no currency is selected
          if (!selectedCurrency) {
            const uzsDefault = response.data.find(c => c.charCode === "UZS");
            if (uzsDefault) {
              setSelectedCurrency(uzsDefault);
            } else {
              setSelectedCurrency(response.data[0]);
            }
          }
        } else {
          setAvailableCurrencies(defaultCurrencies);
          setSelectedCurrency(defaultCurrencies[0]);
        }
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
        setAvailableCurrencies(defaultCurrencies);
        setSelectedCurrency(defaultCurrencies[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, []);
  
  // Fetch exchange rates when selected currency changes
  useEffect(() => {
    if (!selectedCurrency?.charCode) return;
    
    const fetchRates = async () => {
      setRatesLoading(true);
      setRatesError(null);
      
      try {
        const rates = await getExchangeRates(selectedCurrency.charCode);
        setExchangeRates(rates);
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        setRatesError("Failed to fetch exchange rates. Some prices may not convert correctly.");
      } finally {
        setRatesLoading(false);
      }
    };
    
    fetchRates();
  }, [selectedCurrency?.charCode]);

  // Store selected currency in localStorage when it changes
  useEffect(() => {
    if (selectedCurrency) {
      localStorage.setItem("selectedCurrency", JSON.stringify(selectedCurrency));
    }
  }, [selectedCurrency]);

  // Load selected currency from localStorage on component mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem("selectedCurrency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {
        console.error("Error parsing saved currency", e);
      }
    }
  }, []);

  // Convert a price from one currency to the selected currency
  const convertToSelectedCurrency = useCallback(async (amount, fromCurrencyCode) => {
    if (!selectedCurrency || !fromCurrencyCode || fromCurrencyCode === selectedCurrency.charCode) {
      return amount;
    }
    
    try {
      return await convertCurrency(amount, fromCurrencyCode, selectedCurrency.charCode);
    } catch (error) {
      console.error("Error converting to selected currency:", error);
      return amount;
    }
  }, [selectedCurrency]);

  // Function to update the selected currency
  const changeCurrency = (currency) => {
    setSelectedCurrency(currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        changeCurrency,
        availableCurrencies,
        isLoading,
        exchangeRates,
        ratesLoading,
        ratesError,
        convertToSelectedCurrency
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom hook to use the currency context
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
