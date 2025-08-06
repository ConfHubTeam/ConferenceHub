import { format, parseISO } from "date-fns";
import { enUS, ru } from "date-fns/locale";

/**
 * Get date-fns locale based on i18n language
 * @param {string} language - Current language (en, ru, uz)
 * @returns {object} date-fns locale object
 */
const getDateLocale = (language) => {
  switch (language) {
    case 'ru':
      return ru;
    case 'en':
    case 'uz':
    default:
      return enUS;
  }
};

/**
 * Format date range for notification display
 * @param {string} checkInDate - Check-in date (ISO string)
 * @param {string} checkOutDate - Check-out date (ISO string) 
 * @param {boolean} isDateRange - Whether it's a date range
 * @param {string} language - Current language
 * @returns {string} Formatted date range
 */
export const formatNotificationDateRange = (checkInDate, checkOutDate, isDateRange, language = 'en') => {
  if (!checkInDate) return '';
  
  try {
    const checkIn = parseISO(checkInDate);
    
    // Use language-specific date format
    let dateFormat;
    switch (language) {
      case 'ru':
        dateFormat = "d MMM yyyy"; // 22 авг 2025
        break;
      case 'uz':
        dateFormat = "d'-'MMM yyyy"; // 22-avg 2025 (using custom separator)
        break;
      case 'en':
      default:
        dateFormat = "MMM d, yyyy"; // Aug 22, 2025
        break;
    }
    
    const locale = getDateLocale(language);
    const formattedCheckIn = format(checkIn, dateFormat, { locale });
    
    if (!isDateRange || !checkOutDate) {
      return formattedCheckIn;
    }
    
    const checkOut = parseISO(checkOutDate);
    const formattedCheckOut = format(checkOut, dateFormat, { locale });
    
    return `${formattedCheckIn} - ${formattedCheckOut}`;
  } catch (error) {
    console.error('Error formatting notification date range:', error);
    return checkInDate;
  }
};

/**
 * Format time range for notification display
 * @param {object} timeSlots - Time slots object with startTime and endTime
 * @param {function} t - Translation function
 * @returns {string} Formatted time range with translation
 */
export const formatNotificationTimeRange = (timeSlots, t) => {
  if (!timeSlots || !timeSlots.startTime || !timeSlots.endTime) {
    return '';
  }
  
  try {
    // Format time to 24-hour format
    const startTime = timeSlots.startTime;
    const endTime = timeSlots.endTime;
    
    // Get translated "from" and "to"
    const fromText = t('time.from', { defaultValue: 'from' });
    const toText = t('time.to', { defaultValue: 'to' });
    
    return ` ${fromText} ${startTime} ${toText} ${endTime}`;
  } catch (error) {
    console.error('Error formatting notification time range:', error);
    return '';
  }
};

/**
 * Process translation variables for notifications
 * Handles date/time formatting for the new raw data structure
 * @param {object} variables - Translation variables from backend
 * @param {function} t - Translation function
 * @param {string} language - Current language
 * @returns {object} Processed variables with formatted dates/times
 */
export const processNotificationVariables = (variables, t, language = 'en') => {
  if (!variables) return {};
  
  const processed = { ...variables };
  
  // Format date range if we have raw date data
  if (variables.checkInDate) {
    processed.dateRange = formatNotificationDateRange(
      variables.checkInDate,
      variables.checkOutDate,
      variables.isDateRange,
      language
    );
  }
  
  // Format time range if we have raw time slot data
  if (variables.timeSlots) {
    processed.timeRange = formatNotificationTimeRange(variables.timeSlots, t);
  } else {
    processed.timeRange = '';
  }
  
  return processed;
};
