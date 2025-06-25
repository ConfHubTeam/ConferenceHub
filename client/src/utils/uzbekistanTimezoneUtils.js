/**
 * Frontend timezone utilities for Uzbekistan-aware booking validation
 * Uses date-fns for date manipulation to match existing frontend patterns
 */

import { format, parseISO, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import api from './api';

const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent';

/**
 * Get the current date in Uzbekistan timezone
 */
export const getCurrentDateInUzbekistan = () => {
  const now = new Date();
  const uzbekistanTime = new Date(now.toLocaleString("en-US", { timeZone: UZBEKISTAN_TIMEZONE }));
  return format(uzbekistanTime, 'yyyy-MM-dd');
};

/**
 * Get the current Date object in Uzbekistan timezone
 */
export const getCurrentDateObjectInUzbekistan = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: UZBEKISTAN_TIMEZONE }));
};

/**
 * Check if a date is in the past according to Uzbekistan timezone
 * Returns true only if the date is BEFORE today (not including today)
 */
export const isDateInPastUzbekistan = (dateString) => {
  const targetDate = parseISO(dateString);
  const currentDateUzbekistan = getCurrentDateObjectInUzbekistan();
  // Use strict less than comparison - today should NOT be considered past
  return isBefore(startOfDay(targetDate), startOfDay(currentDateUzbekistan));
};

/**
 * Get minimum date for calendar (today in Uzbekistan timezone)
 * Returns a Date object set to start of day to avoid time-based issues
 */
export const getMinimumBookingDate = (providedStartDate = null) => {
  if (providedStartDate) {
    const date = new Date(providedStartDate);
    date.setHours(0, 0, 0, 0); // Set to start of day
    return date;
  }
  const uzbekistanToday = getCurrentDateObjectInUzbekistan();
  uzbekistanToday.setHours(0, 0, 0, 0); // Set to start of day to avoid time comparison issues
  return uzbekistanToday;
};

/**
 * Get the first available hour for a given date, considering timezone and working hours
 */
export const getFirstAvailableHour = (dateString, workingHours = { start: "09:00", end: "17:00" }) => {
  const now = new Date();
  const uzbekistanNow = new Date(now.toLocaleString("en-US", { timeZone: UZBEKISTAN_TIMEZONE }));
  
  const targetDate = parseISO(dateString);
  const uzbekistanToday = format(uzbekistanNow, 'yyyy-MM-dd');
  const targetDateString = format(targetDate, 'yyyy-MM-dd');
  
  const startHour = parseInt(workingHours.start.split(':')[0], 10);
  const endHour = parseInt(workingHours.end.split(':')[0], 10);
  
  // If it's not today in Uzbekistan, return the working hours start time
  if (targetDateString !== uzbekistanToday) {
    return workingHours.start;
  }
  
  // For today, find the first non-past hour
  const currentHour = uzbekistanNow.getHours();
  const currentMinute = uzbekistanNow.getMinutes();
  
  // Calculate the earliest available hour (accounting for current minute > 0)
  let earliestHour = Math.max(startHour, currentHour);
  if (currentMinute > 0) {
    earliestHour = Math.max(startHour, currentHour + 1);
  }
  
  // Make sure the earliest hour is within working hours
  if (earliestHour >= endHour) {
    // If no time is available today, return the start of working hours anyway
    // The calling code should handle this case
    return workingHours.start;
  }
  
  return `${earliestHour.toString().padStart(2, '0')}:00`;
};

/**
 * Check if a specific time on a specific date is in the past according to Uzbekistan timezone
 */
export const isTimeInPastUzbekistan = (dateString, timeString) => {
  // Validate input parameters
  if (!dateString || !timeString) {
    console.warn('isTimeInPastUzbekistan: Invalid parameters', { dateString, timeString });
    return false;
  }
  
  // Validate time string format
  if (typeof timeString !== 'string' || !timeString.includes(':')) {
    console.warn('isTimeInPastUzbekistan: Invalid time format', { timeString });
    return false;
  }
  
  try {
    const now = new Date();
    const uzbekistanNow = new Date(now.toLocaleString("en-US", { timeZone: UZBEKISTAN_TIMEZONE }));
    
    const targetDate = parseISO(dateString);
    
    // Validate the parsed date
    if (isNaN(targetDate.getTime())) {
      console.warn('isTimeInPastUzbekistan: Invalid date string', { dateString });
      return false;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validate hour and minute values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('isTimeInPastUzbekistan: Invalid time values', { hours, minutes, timeString });
      return false;
    }
    
    // Set target time
    const targetDateTime = new Date(targetDate);
    targetDateTime.setHours(hours, minutes || 0, 0, 0);
    
    // Check if target date is today in Uzbekistan
    const uzbekistanToday = format(uzbekistanNow, 'yyyy-MM-dd');
    const targetDateString = format(targetDate, 'yyyy-MM-dd');
    
    if (targetDateString !== uzbekistanToday) {
      return false; // Not today, so time is not in past
    }
    
    // For today, check if the time has passed
    const currentHour = uzbekistanNow.getHours();
    const currentMinute = uzbekistanNow.getMinutes();
    
    if (hours < currentHour) {
      return true;
    } else if (hours === currentHour && (minutes || 0) <= currentMinute) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('isTimeInPastUzbekistan: Error processing time validation', { 
      dateString, 
      timeString, 
      error: error.message 
    });
    return false; // Default to not past if there's an error
  }
};

/**
 * Get timezone-aware availability from backend
 */
export const getTimezoneAwareAvailability = async (placeId, date = null) => {
  try {
    const params = new URLSearchParams({ placeId });
    if (date) {
      params.append('date', typeof date === 'string' ? date : format(date, 'yyyy-MM-dd'));
    }
    
    const response = await api.get(`/bookings/availability/uzbekistan?${params}`);
    
    // Add computed working hours for the date if not provided
    const data = response.data;
    if (date && data.operatingHours) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get working hours for this specific day
      const dayWorkingHours = data.operatingHours.weekdayTimeSlots && data.operatingHours.weekdayTimeSlots[dayOfWeek] 
        ? data.operatingHours.weekdayTimeSlots[dayOfWeek]
        : { start: data.operatingHours.checkIn, end: data.operatingHours.checkOut };
      
      data.workingHoursForDate = dayWorkingHours;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching timezone-aware availability:', error);
    throw error;
  }
};

/**
 * Check if a date is available for booking (not in past according to Uzbekistan time)
 */
export const isDateAvailableForBooking = (dateString, availableDates = []) => {
  return availableDates.includes(dateString);
};

/**
 * Filter time slots to show only available ones based on Uzbekistan timezone
 */
export const filterAvailableTimeSlots = (timeSlots, availableTimeSlots = []) => {
  return timeSlots.filter(slot => availableTimeSlots.includes(slot.value));
};

/**
 * Generate time options for a specific date with timezone awareness
 * Now includes ALL time slots with their availability status
 */
export const generateTimezoneAwareTimeOptions = (
  availableTimeSlots = [],
  allWorkingHours = { start: "09:00", end: "17:00" },
  minimumHours = 1,
  cooldownMinutes = 0,
  dateString = null // Add dateString parameter to check for past times
) => {
  const options = [];
  
  // Generate all time slots within working hours
  const startHour = parseInt(allWorkingHours.start.split(':')[0], 10);
  const endHour = parseInt(allWorkingHours.end.split(':')[0], 10);
  
  for (let hour = startHour; hour < endHour; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    const hourNum = hour;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    const label = `${displayHour}:00 ${amPm}`;
    
    const isAvailable = availableTimeSlots.includes(timeSlot);
    
    // Check if this time is in the past for the given date
    const isPastTime = dateString ? isTimeInPastUzbekistan(dateString, timeSlot) : false;
    
    // If the time is in the past OR not in available slots, it's disabled
    const isDisabled = isPastTime || !isAvailable;
    let disabledReason = null;
    
    if (isPastTime) {
      disabledReason = 'Past time (Uzbekistan timezone)';
    } else if (!isAvailable) {
      disabledReason = 'Not available for booking';
    }
    
    options.push({
      value: timeSlot,
      label: label,
      isAvailable: isAvailable && !isPastTime, // Available only if in slot list AND not past
      isDisabled: isDisabled,
      disabledReason: disabledReason
    });
  }
  
  return options;
};

/**
 * Generate end time options based on selected start time and available slots
 */
export const generateEndTimeOptions = (
  startTime,
  availableTimeSlots = [],
  minimumHours = 1,
  endOfWorkingHours = "17:00"
) => {
  if (!startTime) return [];
  
  const options = [];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endOfWorkingHours.split(':')[0], 10);
  
  // Generate end time options from minimum booking duration
  for (let i = startHour + minimumHours; i <= endHour; i++) {
    const timeSlot = `${i.toString().padStart(2, '0')}:00`;
    const hourNum = i;
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const amPm = hourNum < 12 ? 'AM' : 'PM';
    const label = `${displayHour}:00 ${amPm}`;
    
    options.push({
      value: timeSlot,
      label: label
    });
  }
  
  return options;
};

/**
 * Validate selected time slots against timezone-aware availability
 */
export const validateTimeSlotSelection = async (timeSlots, placeId) => {
  try {
    const response = await api.post('/bookings/validate-timeslots', {
      timeSlots,
      placeId
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        isValid: false,
        message: error.response.data.error || 'Validation failed',
        conflictingSlot: error.response.data.conflictingSlot
      };
    }
    
    return {
      isValid: false,
      message: 'Error validating time slots'
    };
  }
};

/**
 * Check if current date/time allows booking for a specific date
 */
export const canBookForDate = (dateString, availableDates = []) => {
  return availableDates.includes(dateString);
};

/**
 * Get display text for timezone information
 */
export const getTimezoneDisplayText = () => {
  return 'All times are shown in Uzbekistan timezone (UTC+5)';
};

/**
 * Format date for display with timezone context
 */
export const formatDateWithTimezone = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return `${format(date, 'MMM dd, yyyy')} (Uzbekistan time)`;
  } catch (error) {
    return dateString;
  }
};

/**
 * Get the next available booking date
 */
export const getNextAvailableDate = (availableDates = []) => {
  return availableDates.length > 0 ? availableDates[0] : null;
};

export default {
  getTimezoneAwareAvailability,
  isDateAvailableForBooking,
  filterAvailableTimeSlots,
  generateTimezoneAwareTimeOptions,
  generateEndTimeOptions,
  validateTimeSlotSelection,
  canBookForDate,
  getTimezoneDisplayText,
  formatDateWithTimezone,
  getNextAvailableDate,
  getCurrentDateInUzbekistan,
  getCurrentDateObjectInUzbekistan,
  isDateInPastUzbekistan,
  isTimeInPastUzbekistan,
  getMinimumBookingDate,
  getFirstAvailableHour,
  UZBEKISTAN_TIMEZONE
};
