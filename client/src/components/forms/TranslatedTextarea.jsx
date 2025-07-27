import React, { forwardRef } from "react";
import { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";

/**
 * Translation-aware Textarea component
 * Automatically translates labels, placeholders, and validation messages
 */
const TranslatedTextarea = forwardRef(({
  name,
  label,
  placeholder,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className = "",
  labelClassName = "",
  textareaClassName = "",
  errorClassName = "",
  translationNamespace = "common",
  labelKey,
  placeholderKey,
  errorKey,
  ...props
}, ref) => {
  const { translate, getDirection, getLanguageClasses } = useEnhancedTranslation(translationNamespace);
  
  // Auto-generate translation keys if not provided
  const defaultLabelKey = labelKey || `forms.labels.${name}`;
  const defaultPlaceholderKey = placeholderKey || `forms.placeholders.${name}`;
  const defaultErrorKey = errorKey || `forms.validation.${error}`;
  
  // Get translated texts with fallbacks
  const translatedLabel = label || translate(defaultLabelKey, {}, name);
  const translatedPlaceholder = placeholder || translate(defaultPlaceholderKey, {}, `Enter ${name}`);
  const translatedError = error ? translate(defaultErrorKey, {}, error) : null;
  
  // Language-aware classes
  const direction = getDirection();
  const langClasses = getLanguageClasses();
  
  const baseTextareaClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm text-sm resize-y
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${direction === 'rtl' ? 'text-right' : 'text-left'}
    ${langClasses}
    ${textareaClassName}
  `.trim();

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
      
      {/* Textarea */}
      <textarea
        ref={ref}
        id={name}
        name={name}
        rows={rows}
        placeholder={translatedPlaceholder}
        disabled={disabled}
        className={baseTextareaClasses}
        dir={direction}
        {...props}
      />
      
      {/* Error Message */}
      {translatedError && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {translatedError}
        </p>
      )}
    </div>
  );
});

TranslatedTextarea.displayName = "TranslatedTextarea";

export default TranslatedTextarea;
