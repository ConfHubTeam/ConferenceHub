import { useEffect, useState, useRef } from "react";
import api from "../utils/api";

export default function CurrencySelector({ selectedCurrency, onChange, availableCurrencies, compact = false }) {
  const [currencies, setCurrencies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Default currencies if API fails
  const defaultCurrencies = [
    { id: 1, name: "Uzbekistan Som", code: "860", charCode: "UZS" },
    { id: 2, name: "United States Dollar", code: "840", charCode: "USD" },
    { id: 3, name: "Russian Ruble", code: "643", charCode: "RUB" }
  ];

  // Use currencies from parent if available, otherwise fetch from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoading(true);
      
      // Use parent's availableCurrencies if provided
      if (availableCurrencies && availableCurrencies.length > 0) {
        setCurrencies(availableCurrencies);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await api.get("/currency");
        if (response.data && response.data.length > 0) {
          setCurrencies(response.data);
        } else {
          try {
            // Create UZS currency
            await api.post("/currency", { name: "Uzbekistan Som", code: "860", charCode: "UZS" });
            // Create USD currency
            await api.post("/currency", { name: "United States Dollar", code: "840", charCode: "USD" });
            // Create RUB currency
            await api.post("/currency", { name: "Russian Ruble", code: "643", charCode: "RUB" });
            
            // Fetch again after creation
            const newResponse = await api.get("/currency");
            if (newResponse.data && newResponse.data.length > 0) {
              setCurrencies(newResponse.data);
            } else {
              setCurrencies(defaultCurrencies);
            }
          } catch (createError) {
            setCurrencies(defaultCurrencies);
          }
        }
      } catch (error) {
        setCurrencies(defaultCurrencies);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, [availableCurrencies]);

  // Set UZS as default if not already selected
  useEffect(() => {
    if ((!selectedCurrency || !selectedCurrency.id) && currencies.length > 0) {
      // Find UZS in currencies
      const uzsDefault = currencies.find(c => c.charCode === "UZS");
      if (uzsDefault) {
        onChange(uzsDefault);
      }
    } else if (selectedCurrency && currencies.length > 0) {
      // Make sure we're using a currency that actually exists in the database
      // Instead of the hardcoded default currency objects
      const matchingCurrency = currencies.find(c => c.charCode === selectedCurrency.charCode);
      if (matchingCurrency && matchingCurrency.id !== selectedCurrency.id) {
        onChange(matchingCurrency);
      }
    }
  }, [selectedCurrency, currencies, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        // Navigation would be implemented here
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (currency) => {
    onChange(currency);
    setIsOpen(false);
  };

  // Get currency info for professional financial app display
  const getCurrencyInfo = (charCode) => {
    switch(charCode) {
      case "UZS": 
        return { 
          symbol: "soʻm", 
          name: "Uzbek Som",
          displayCode: "UZS",
          symbolPosition: "after"
        };
      case "USD": 
        return { 
          symbol: "$", 
          name: "US Dollar", 
          displayCode: "USD",
          symbolPosition: "before"
        };
      case "RUB": 
        return { 
          symbol: "₽", 
          name: "Russian Ruble",
          displayCode: "RUB",
          symbolPosition: "after"
        };
      case "EUR": 
        return { 
          symbol: "€", 
          name: "Euro",
          displayCode: "EUR", 
          symbolPosition: "before"
        };
      default: 
        return { 
          symbol: charCode, 
          name: charCode,
          displayCode: charCode,
          symbolPosition: "before"
        };
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`flex items-center justify-between w-full ${
          compact 
            ? 'px-2 py-1 text-sm' 
            : 'px-4 py-3 text-base'
        } bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm ${
          isOpen 
            ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20 shadow-sm' 
            : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="currency-listbox"
        aria-label="Select currency"
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedCurrency && (
            <>
              {compact ? (
                // Professional compact mode: clean, inline layout
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-700 text-sm">
                    {getCurrencyInfo(selectedCurrency.charCode).symbol}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">
                    {getCurrencyInfo(selectedCurrency.charCode).displayCode}
                  </span>
                </div>
              ) : (
                // Full mode: professional layout with icon
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-200">
                    <span className="font-semibold text-gray-700 text-sm">
                      {getCurrencyInfo(selectedCurrency.charCode).symbol}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 ml-3">
                    <span className="font-medium text-gray-900 text-base">
                      {getCurrencyInfo(selectedCurrency.charCode).displayCode}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {getCurrencyInfo(selectedCurrency.charCode).name}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          {!selectedCurrency && (
            <span className="text-gray-400 font-medium text-sm">Select Currency</span>
          )}
        </div>
      </div>
      
      {/* Professional dropdown menu - positioned below */}
      {isOpen && (
        <div 
          id="currency-listbox"
          role="listbox"
          className={`absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto ${
            compact ? 'min-w-[200px]' : ''
          }`}
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            top: '100%',
            left: '0'
          }}
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading currencies...</span>
              </div>
            </div>
          ) : (
            <div className="py-1">
              {currencies.map((currency, index) => {
                const currencyInfo = getCurrencyInfo(currency.charCode);
                const isSelected = selectedCurrency?.id === currency.id;
                
                return (
                  <div
                    key={currency.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                      isSelected 
                        ? 'bg-blue-50 border-r-2 border-blue-500' 
                        : 'hover:bg-gray-50'
                    } ${index !== currencies.length - 1 ? 'border-b border-gray-100' : ''}`}
                    onClick={() => handleSelect(currency)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Currency symbol in circle */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isSelected ? 'bg-blue-100 border-2 border-blue-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <span className={`font-bold ${
                          isSelected ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {currencyInfo.symbol}
                        </span>
                      </div>
                      
                      {/* Currency details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {currencyInfo.displayCode}
                          </span>
                          {isSelected && (
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className={`text-sm ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {currencyInfo.name}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
