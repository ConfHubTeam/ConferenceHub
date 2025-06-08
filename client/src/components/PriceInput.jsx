import { useEffect, useState } from "react";
import { getCurrencySymbol } from "../utils/currencyUtils";

export default function PriceInput({ value, onChange, currency, label = null }) {
  const [inputValue, setInputValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
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
    
    // Remove all non-numeric characters except decimal point
    const cleanValue = newValue.replace(/[^\d.]/g, "");
    
    // Only allow numbers (including decimal point)
    if (/^$|^[0-9]*\.?[0-9]*$/.test(cleanValue)) {
      setInputValue(cleanValue);
      
      // Convert to float for the parent component
      const numValue = cleanValue === "" ? 0 : parseFloat(cleanValue);
      
      // Update parent component
      onChange(numValue);
    }
  };

  // Handle focus to show raw value for editing
  const handleFocus = () => {
    // Show raw value when user focuses on input
    setIsEditing(true);
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

  return (
    <div className="w-full">
        
      <div className="relative w-full">
        {label && (
            <label htmlFor="price-input" className="block mb-2 text-sm font-medium text-gray-700">
              {label} {getCurrencyDisplay()}
            </label>
        )}
        <input
          id="price-input"
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={isEditing ? inputValue : formattedValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full border py-2 px-3 rounded-xl text-base"
          style={{ minWidth: "200px" }}
          maxLength={20}
          aria-label={`Price in ${currency?.charCode || "UZS"}`}
        />
      </div>
    </div>
  );
}
