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
        console.log("Updating currency to match database ID:", matchingCurrency);
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

  // Get currency flag emoji (simplified version)
  const getCurrencyFlag = (charCode) => {
    switch(charCode) {
      case "UZS": return "🇺🇿";
      case "USD": return "🇺🇸";
      case "RUB": return "🇷🇺";
      default: return "";
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`flex items-center justify-between w-full ${compact ? 'p-1 sm:p-1.5' : 'p-2'} border rounded-xl cursor-pointer ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:border-gray-400'
        }`}
        style={{ minWidth: compact ? '60px' : 'auto' }}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="currency-listbox"
        aria-label="Select currency"
      >
        <div className="flex items-center overflow-hidden">
          {selectedCurrency && (
            <span className={`flex-shrink-0 ${compact ? 'mr-1 text-base' : 'mr-2 text-lg'}`}>
              {getCurrencyFlag(selectedCurrency.charCode)}
            </span>
          )}
          <span className="font-medium truncate">
            {selectedCurrency ? selectedCurrency.charCode : "Select"}
          </span>
        </div>
        {/* Subtle indicator without arrow */}
        {!compact && (
          <div className="flex items-center text-gray-500 flex-shrink-0 ml-1">
            <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" fill="none" 
                   viewBox="0 0 24 24" stroke="currentColor"
                   style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        )}
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div 
          id="currency-listbox"
          role="listbox"
          className={`absolute z-50 mt-1 ${compact ? 'min-w-[100px] w-auto' : 'w-full'} bg-white border rounded-md shadow-lg max-h-60 overflow-auto`}
          style={{ 
            borderRadius: "0.75rem",
            right: compact ? '0' : 'auto'
          }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading currencies...</div>
          ) : (
            currencies.map((currency) => (
              <div
                key={currency.id}
                role="option"
                aria-selected={selectedCurrency?.id === currency.id}
                className={`p-2.5 hover:bg-gray-100 cursor-pointer flex items-center whitespace-nowrap ${
                  selectedCurrency && selectedCurrency.id === currency.id ? 'bg-blue-50 font-medium' : ''
                }`}
                onClick={() => handleSelect(currency)}
              >
                <span className="mr-2 text-lg flex-shrink-0">{getCurrencyFlag(currency.charCode)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{currency.charCode}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
