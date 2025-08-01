import React, { forwardRef } from "react";
import { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";

/**
 * Translation-aware Button component
 * Automatically translates button text and handles loading states
 */
const TranslatedButton = forwardRef(({
  children,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  translationNamespace = "common",
  textKey,
  loadingTextKey = "forms.messages.loading",
  ...props
}, ref) => {
  const { translate, getDirection, getLanguageClasses } = useEnhancedTranslation(translationNamespace);
  
  // Get translated text
  const translatedText = textKey ? translate(textKey, {}, children) : children;
  const translatedLoadingText = translate(loadingTextKey, {}, "Loading...");
  
  // Language-aware classes
  const direction = getDirection();
  const langClasses = getLanguageClasses();
  
  // Base button classes
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${langClasses}
  `;
  
  // Variant classes
  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    success: "text-white bg-green-600 hover:bg-green-700 focus:ring-green-500",
    warning: "text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-blue-500",
    link: "text-blue-600 hover:text-blue-500 underline focus:ring-blue-500"
  };
  
  // Size classes
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base"
  };
  
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.medium}
    ${className}
  `.trim();

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      dir={direction}
      {...props}
    >
      {loading && (
        <svg 
          className={`w-4 h-4 animate-spin ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`}
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading ? translatedLoadingText : translatedText}
    </button>
  );
});

TranslatedButton.displayName = "TranslatedButton";

export default TranslatedButton;
