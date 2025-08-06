import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { formatSimpleDate, formatDateTime, getDateLocale, getTimeFormat } from "../utils/dateUtils";

/**
 * Custom hook for localized date formatting
 * Provides easy access to localized date formatting functions
 */
export const useDateLocalization = () => {
  const { i18n } = useTranslation();
  
  /**
   * Format a simple date based on current language
   */
  const formatLocalizedDate = useCallback((date) => {
    return formatSimpleDate(date, i18n.language);
  }, [i18n.language]);
  
  /**
   * Format date and time based on current language
   */
  const formatLocalizedDateTime = useCallback((date) => {
    return formatDateTime(date, i18n.language);
  }, [i18n.language]);
  
  /**
   * Get the date locale for current language
   */
  const getCurrentDateLocale = useCallback(() => {
    return getDateLocale(i18n.language);
  }, [i18n.language]);
  
  /**
   * Get the time format for current language
   */
  const getCurrentTimeFormat = useCallback(() => {
    return getTimeFormat(i18n.language);
  }, [i18n.language]);
  
  return {
    formatLocalizedDate,
    formatLocalizedDateTime,
    getCurrentDateLocale,
    getCurrentTimeFormat,
    currentLanguage: i18n.language
  };
};
