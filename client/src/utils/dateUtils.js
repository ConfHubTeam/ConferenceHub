import { format, parseISO } from "date-fns";

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: "MMM d, yyyy 'at' HH:mm")
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = "MMM d, yyyy 'at' HH:mm") => {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Format simple date
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatSimpleDate = (date) => {
  return formatDate(date, "MMM d, yyyy");
};

/**
 * Format time slots for display
 * @param {Array} timeSlots - Array of time slot objects
 * @returns {Array} Array of formatted time slot strings
 */
export const formatTimeSlots = (timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) {
    return ["Full day"];
  }
  
  return timeSlots.map(slot => {
    const date = formatSimpleDate(slot.date);
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
