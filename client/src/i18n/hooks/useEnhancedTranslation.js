import { useTranslation } from "react-i18next";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { formatters } from "../formatters";

/**
 * Enhanced useTranslation hook with common functionality
 * Provides additional utilities for component-level translations
 */
export const useEnhancedTranslation = (namespace = "common", options = {}) => {
  const { t, i18n } = useTranslation(namespace, options);
  const { currentLanguageObject } = useLanguageContext();
  
  // Enhanced translation function with fallback and interpolation
  const translate = (key, interpolationValues = {}, fallback = key) => {
    try {
      const translated = t(key, interpolationValues);
      // Return fallback if translation is missing or equals the key
      return translated === key ? fallback : translated;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback;
    }
  };

  // Translation with pluralization support
  const translatePlural = (key, count, interpolationValues = {}) => {
    return t(key, { count, ...interpolationValues });
  };

  // Translation with context (for gender, formal/informal, etc.)
  const translateWithContext = (key, context, interpolationValues = {}) => {
    return t(`${key}_${context}`, interpolationValues) || t(key, interpolationValues);
  };

  // Get formatted date/time/currency based on current locale
  const formatValue = (type, value, options = {}) => {
    const locale = currentLanguageObject.code;
    return formatters[type] ? formatters[type](value, locale, options) : value;
  };

  // Check if translation exists
  const hasTranslation = (key) => {
    return i18n.exists(key, { ns: namespace });
  };

  // Get raw translation key (useful for debugging)
  const getTranslationKey = (key) => {
    return `${namespace}:${key}`;
  };

  // Check if current language is RTL
  const isRTL = () => {
    const rtlLanguages = ["ar", "he", "fa", "ur"];
    return rtlLanguages.includes(currentLanguageObject.code);
  };

  // Get language direction
  const getDirection = () => {
    return isRTL() ? "rtl" : "ltr";
  };

  // Get language-specific class names
  const getLanguageClasses = (baseClasses = "") => {
    const direction = getDirection();
    const langCode = currentLanguageObject.code;
    return `${baseClasses} ${direction} lang-${langCode}`.trim();
  };

  return {
    // Original react-i18next functions
    t,
    i18n,
    
    // Enhanced functions
    translate,
    translatePlural,
    translateWithContext,
    formatValue,
    hasTranslation,
    getTranslationKey,
    
    // Language utilities
    isRTL,
    getDirection,
    getLanguageClasses,
    currentLanguage: currentLanguageObject,
    
    // Convenience methods
    currency: (value, options) => formatValue("currency", value, options),
    date: (value, options) => formatValue("date", value, options),
    time: (value, options) => formatValue("time", value, options),
    number: (value, options) => formatValue("number", value, options),
    percentage: (value, options) => formatValue("percentage", value, options),
  };
};

export default useEnhancedTranslation;
