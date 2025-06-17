import React from "react";
import PhoneInput, { isPossiblePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

/**
 * Custom Phone Input Component
 * 
 * A wrapper around react-phone-number-input with custom styling
 * to match the application's design system
 */
export default function CustomPhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  defaultCountry = "UZ", // Set Uzbekistan as default
  disabled = false,
  required = false,
  className = "",
  error = null,
  ...props
}) {
  // Style to match the name input field exactly
  const baseInputClass = `
    w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-colors
    ${error 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : ""
    }
    ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}
  `.trim();

  return (
    <div className={`relative ${className}`}>
      <PhoneInput
        value={value}
        onChange={onChange}
        defaultCountry={defaultCountry}
        placeholder={placeholder}
        disabled={disabled}
        international
        countryCallingCodeEditable={false}
        className={baseInputClass}
        numberInputProps={{
          className: "flex-1 pl-2 border-none outline-none bg-transparent text-gray-900 placeholder-gray-500",
          required: required,
          "aria-label": "Phone number",
          autoComplete: "tel"
        }}
        countrySelectProps={{
          "aria-label": "Country",
          className: "border-none outline-none bg-transparent mr-1"
        }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Export validation functions for convenience
export { isPossiblePhoneNumber, isValidPhoneNumber };
