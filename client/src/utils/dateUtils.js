import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";

// Date-fns locale mapping
const localeMap = {
  en: enUS,
  ru: ru,
  uz: uz, // Uzbek Latin script
};

/**
 * Get date-fns locale object for the given language code
 * @param {string} languageCode - Language code (en, ru, uz)
 * @returns {object} Date-fns locale object
 */
export const getDateLocale = (languageCode = 'en') => {
  return localeMap[languageCode] || localeMap.en;
};

/**
 * Get appropriate time format based on language
 * For Russian and Uzbek: 24-hour format (HH:mm)
 * For English: 12-hour format (h:mm a)
 * @param {string} languageCode - Language code
 * @returns {string} Time format string
 */
export const getTimeFormat = (languageCode = 'en') => {
  return (languageCode === 'ru' || languageCode === 'uz') ? 'HH:mm' : 'h:mm a';
};

/**
 * Format date for display with localization
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: "MMM d, yyyy 'at' HH:mm")
 * @param {string} languageCode - Language code for localization
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = "MMM d, yyyy 'at' HH:mm", languageCode = 'en') => {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const locale = getDateLocale(languageCode);
    
    // Replace time format in the format string based on language
    let finalFormatStr = formatStr;
    if (formatStr.includes('HH:mm') || formatStr.includes('h:mm a')) {
      const timeFormat = getTimeFormat(languageCode);
      finalFormatStr = formatStr.replace(/HH:mm|h:mm a/g, timeFormat);
    }
    
    return format(dateObj, finalFormatStr, { locale });
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Format simple date with localization
 * @param {string|Date} date - Date to format
 * @param {string} languageCode - Language code for localization
 * @returns {string} Formatted date
 */
export const formatSimpleDate = (date, languageCode = 'en') => {
  return formatDate(date, "MMM d, yyyy", languageCode);
};

/**
 * Format date and time with localization
 * @param {string|Date} date - Date to format
 * @param {string} languageCode - Language code for localization
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date, languageCode = 'en') => {
  const timeFormat = getTimeFormat(languageCode);
  return formatDate(date, `MMM d, yyyy 'at' ${timeFormat}`, languageCode);
};

/**
 * Format time slots for display with localization
 * @param {Array} timeSlots - Array of time slot objects
 * @param {string} languageCode - Language code for localization
 * @returns {Array} Array of formatted time slot strings
 */
export const formatTimeSlots = (timeSlots, languageCode = 'en') => {
  if (!timeSlots || timeSlots.length === 0) {
    return ["Full day"];
  }
  
  return timeSlots.map(slot => {
    const date = formatSimpleDate(slot.date, languageCode);
    return `${date}: ${slot.startTime} - ${slot.endTime}`;
  });
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return dateObj < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "Unknown";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const now = new Date();
    const diffInMs = dateObj.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (Math.abs(diffInDays) >= 1) {
      return diffInDays > 0 ? `in ${diffInDays} days` : `${Math.abs(diffInDays)} days ago`;
    } else if (Math.abs(diffInHours) >= 1) {
      return diffInHours > 0 ? `in ${diffInHours} hours` : `${Math.abs(diffInHours)} hours ago`;
    } else {
      return diffInMs > 0 ? "in less than an hour" : "less than an hour ago";
    }
  } catch (error) {
    return "Unknown";
  }
};
