import { useEffect, useState, useRef } from "react";
import { getCurrencySymbol, formatCurrencyWhileTyping, unformatCurrency } from "../utils/currencyUtils";

export default function PriceInput({ value, onChange, currency, label = null, isRequired = false }) {
  const [inputValue, setInputValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  
  // Format value according to currency
  const formatValueForCurrency = (numValue, currencyType) => {
    if (numValue === null || numValue === undefined || numValue === "") return "";
    
    const num = parseFloat(numValue);
    if (isNaN(num)) return "";
    
    // Get currency code from currency object
    const currencyCode = currencyType?.charCode || "UZS";
    
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
  };

  // Get currency symbol based on currency type
  // Update formatted display value when external value or currency changes
  useEffect(() => {
    if (!isEditing && (value || value === 0)) {
      const formatted = formatValueForCurrency(value, currency);
      setFormattedValue(formatted);
    } else if (!isEditing) {
      setFormattedValue("");
    }
  }, [value, currency, isEditing]);
  
  // Update raw input value when external value changes
  useEffect(() => {
    setInputValue(value || value === 0 ? value.toString() : "");
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Remove all formatting characters to get clean numeric value
    const cleanValue = unformatCurrency(newValue);
    
    // Only allow numbers (including decimal point)
    if (/^$|^[0-9]*\.?[0-9]*$/.test(cleanValue)) {
      // Store the clean numeric value for database logic (UNCHANGED)
      setInputValue(cleanValue);
      
      // Convert to float for the parent component (UNCHANGED DATABASE LOGIC)
      const numValue = cleanValue === "" ? 0 : parseFloat(cleanValue);
      
      // Update parent component with clean numeric value (UNCHANGED)
      onChange(numValue);
      
      // Update the display value with live formatting while editing
      if (isEditing) {
        const liveFormatted = formatCurrencyWhileTyping(cleanValue, currency);
        setFormattedValue(liveFormatted);
        
        // Calculate proper cursor position
        setTimeout(() => {
          if (inputRef.current) {
            // Count digits before cursor in original string
            const digitsBeforeCursor = newValue.slice(0, cursorPosition).replace(/[^\d]/g, "").length;
            
            // Find position in formatted string where we have the same number of digits
            let newCursorPos = 0;
            let digitCount = 0;
            
            for (let i = 0; i < liveFormatted.length; i++) {
              if (/\d/.test(liveFormatted[i])) {
                digitCount++;
                if (digitCount >= digitsBeforeCursor) {
                  newCursorPos = i + 1;
                  break;
                }
              }
            }
            
            // Ensure cursor doesn't go beyond string length
            newCursorPos = Math.min(newCursorPos, liveFormatted.length);
            
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
  };

  // Handle focus to show raw value for editing
  const handleFocus = () => {
    // Show live formatted value when user focuses on input
    setIsEditing(true);
    
    // If we have a clean input value, format it for live editing
    if (inputValue) {
      const liveFormatted = formatCurrencyWhileTyping(inputValue, currency);
      setFormattedValue(liveFormatted);
    }
  };

  // Handle blur to show formatted value
  const handleBlur = () => {
    // Show formatted value when user leaves input
    setIsEditing(false);
    const numValue = inputValue === "" ? 0 : parseFloat(inputValue);
    const formatted = formatValueForCurrency(numValue, currency);
    setFormattedValue(formatted);
  };

  // Get currency symbol for label
  const getCurrencyDisplay = () => {
    return getCurrencySymbol(currency);
  };

  // Create a unique ID for each input to ensure proper label association
  const inputId = `price-input-${label ? label.toLowerCase().replace(/\s+/g, '-') : 'default'}`;

  return (
    <div className="w-full">
        
      <div className="relative w-full">      {label && (
          <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-gray-700 break-words">
            <span className="inline-block mr-1">{label}</span>
            {isRequired && <span className="text-red-500">*</span>}
            <span className="inline-block ml-1">{getCurrencyDisplay()}</span>
          </label>
      )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={isEditing ? formattedValue || inputValue : formattedValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border py-2 px-3 rounded-xl text-base"
          maxLength={20}
          aria-label={`Price in ${currency?.charCode || "UZS"}`}
        />
      </div>
    </div>
  );
}
