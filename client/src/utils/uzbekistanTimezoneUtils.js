/**
 * Frontend timezone utilities for Uzbekistan-aware booking validation
 * Uses date-fns for date manipulation to match existing frontend patterns
 */

import { format, parseISO, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import api from './api';

const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent';

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
  cooldownMinutes = 0
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
    
    options.push({
      value: timeSlot,
      label: label,
      isAvailable: isAvailable,
      isDisabled: !isAvailable // Mark as disabled if not available due to timezone
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
  UZBEKISTAN_TIMEZONE
};
