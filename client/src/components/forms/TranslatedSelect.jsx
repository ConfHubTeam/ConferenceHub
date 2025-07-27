import React, { forwardRef } from "react";
import { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";

/**
 * Translation-aware Select component
 * Automatically translates labels, options, and validation messages
 */
const TranslatedSelect = forwardRef(({
  name,
  label,
  placeholder,
  options = [],
  error,
  required = false,
  disabled = false,
  className = "",
  labelClassName = "",
  selectClassName = "",
  errorClassName = "",
  translationNamespace = "common",
  labelKey,
  placeholderKey,
  errorKey,
  translateOptions = true,
  optionTranslationPrefix,
  ...props
}, ref) => {
  const { translate, getDirection, getLanguageClasses } = useEnhancedTranslation(translationNamespace);
  
  // Auto-generate translation keys if not provided
  const defaultLabelKey = labelKey || `forms.labels.${name}`;
  const defaultPlaceholderKey = placeholderKey || `forms.placeholders.${name}`;
  const defaultErrorKey = errorKey || `forms.validation.${error}`;
  
  // Get translated texts with fallbacks
  const translatedLabel = label || translate(defaultLabelKey, {}, name);
  const translatedPlaceholder = placeholder || translate(defaultPlaceholderKey, {}, `Select ${name}`);
  const translatedError = error ? translate(defaultErrorKey, {}, error) : null;
  
  // Language-aware classes
  const direction = getDirection();
  const langClasses = getLanguageClasses();
  
  const baseSelectClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-white
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${direction === 'rtl' ? 'text-right' : 'text-left'}
    ${langClasses}
    ${selectClassName}
  `.trim();

  // Translate options if needed
  const translatedOptions = options.map(option => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: translateOptions 
          ? translate(`${optionTranslationPrefix || `forms.options.${name}`}.${option}`, {}, option)
          : option
      };
    }
    
    if (option.label && translateOptions) {
      return {
        ...option,
        label: translate(`${optionTranslationPrefix || `forms.options.${name}`}.${option.value}`, {}, option.label)
      };
    }
    
    return option;
  });

  return (
    <div className={`${className} ${langClasses}`} dir={direction}>
      {/* Label */}
      {translatedLabel && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {translatedLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Select */}
      <select
        ref={ref}
        id={name}
        name={name}
        disabled={disabled}
        className={baseSelectClasses}
        dir={direction}
        {...props}
      >
        {/* Placeholder option */}
        {translatedPlaceholder && (
          <option value="" disabled>
            {translatedPlaceholder}
          </option>
        )}
        
        {/* Options */}
        {translatedOptions.map((option, index) => (
          <option 
            key={option.value || index} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Error Message */}
      {translatedError && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {translatedError}
        </p>
      )}
    </div>
  );
});

TranslatedSelect.displayName = "TranslatedSelect";

export default TranslatedSelect;
