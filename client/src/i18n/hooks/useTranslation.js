import { useTranslation as useI18nextTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { getCurrentLanguage, getAvailableLanguages } from "../config";

/**
 * Enhanced useTranslation hook with additional functionality
 * @param {string|string[]} ns - Namespace(s) to use
 * @param {Object} options - Additional options
 * @returns {Object} Translation utilities
 */
export const useTranslation = (ns = "common", options = {}) => {
  const { t, i18n, ready } = useI18nextTranslation(ns, {
    useSuspense: true,
    ...options
  });

  // Get current language info
  const currentLanguage = useMemo(() => {
    const currentLng = getCurrentLanguage();
    const languages = getAvailableLanguages();
    return languages.find(lang => lang.code === currentLng) || languages[0];
  }, [i18n.language]);

  // Enhanced translation function with fallback and formatting
  const translate = useCallback((key, options = {}) => {
    const { 
      defaultValue = key, 
      count, 
      context, 
      returnObjects = false,
      ...interpolationOptions 
    } = options;

    try {
      const result = t(key, {
        defaultValue,
        count,
        context,
        returnObjects,
        ...interpolationOptions
      });

      // Return key if translation is missing and not in production
      if (result === key && process.env.NODE_ENV === "development") {
        console.warn(`Missing translation: ${key} in namespace: ${ns}`);
      }

      return result;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return defaultValue || key;
    }
  }, [t, ns]);

  // Language switching with callback support
  const changeLanguage = useCallback(async (lng, callback) => {
    try {
      await i18n.changeLanguage(lng);
      if (callback && typeof callback === "function") {
        callback(lng);
      }
    } catch (error) {
      console.error("Error changing language:", error);
      throw error;
    }
  }, [i18n]);

  // Format numbers according to current locale
  const formatNumber = useCallback((number, options = {}) => {
    const locale = currentLanguage.code === "uz" ? "uz-UZ" : 
                   currentLanguage.code === "ru" ? "ru-RU" : "en-US";
    return new Intl.NumberFormat(locale, options).format(number);
  }, [currentLanguage]);

  // Format currency according to current locale
  const formatCurrency = useCallback((amount, currency = "USD") => {
    const locale = currentLanguage.code === "uz" ? "uz-UZ" : 
                   currentLanguage.code === "ru" ? "ru-RU" : "en-US";
    const currencyCode = currentLanguage.code === "uz" && currency === "USD" ? "UZS" : 
                        currentLanguage.code === "ru" && currency === "USD" ? "RUB" : currency;
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }, [currentLanguage]);

  // Format dates according to current locale
  const formatDate = useCallback((date, options = {}) => {
    const locale = currentLanguage.code === "uz" ? "uz-UZ" : 
                   currentLanguage.code === "ru" ? "ru-RU" : "en-US";
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options
    };
    
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  }, [currentLanguage]);

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback((date) => {
    const locale = currentLanguage.code === "uz" ? "uz-UZ" : 
                   currentLanguage.code === "ru" ? "ru-RU" : "en-US";
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((targetDate - now) / 1000);
    
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 }
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return rtf.format(diffInSeconds < 0 ? -count : count, interval.label);
      }
    }
    
    return rtf.format(0, "second");
  }, [currentLanguage]);

  // Get direction for RTL/LTR support (Uzbek is LTR)
  const direction = useMemo(() => {
    return "ltr"; // Both English and Uzbek are left-to-right
  }, [currentLanguage]);

  // Check if namespace is loaded
  const isNamespaceLoaded = useCallback((namespace) => {
    return i18n.hasResourceBundle(currentLanguage.code, namespace);
  }, [i18n, currentLanguage]);

  // Load additional namespaces dynamically
  const loadNamespaces = useCallback(async (namespaces) => {
    try {
      await i18n.loadNamespaces(namespaces);
      return true;
    } catch (error) {
      console.error("Error loading namespaces:", error);
      return false;
    }
  }, [i18n]);

  return {
    // Core translation utilities
    t: translate,
    i18n,
    ready,
    
    // Language information
    currentLanguage,
    availableLanguages: getAvailableLanguages(),
    direction,
    
    // Language management
    changeLanguage,
    
    // Formatting utilities
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    
    // Namespace management
    isNamespaceLoaded,
    loadNamespaces,
    
    // Utility functions
    isRTL: direction === "rtl",
    isReady: ready
  };
};

export default useTranslation;
