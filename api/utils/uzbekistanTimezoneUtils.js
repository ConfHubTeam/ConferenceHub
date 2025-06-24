/**
 * Uzbekistan timezone-aware time validation utilities
 * All hosts are in Uzbekistan (Asia/Tashkent timezone)
 */

const moment = require('moment-timezone');

const UZBEKISTAN_TIMEZONE = 'Asia/Tashkent';

/**
 * Get the current time in Uzbekistan timezone
 */
const getCurrentTimeInUzbekistan = () => {
  return moment().tz(UZBEKISTAN_TIMEZONE);
};

/**
 * Get the current date in Uzbekistan timezone (YYYY-MM-DD format)
 */
const getCurrentDateInUzbekistan = () => {
  return moment().tz(UZBEKISTAN_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Check if a date is in the past in Uzbekistan timezone
 */
const isDateInPastUzbekistan = (dateString) => {
  const targetDate = moment.tz(dateString, UZBEKISTAN_TIMEZONE).startOf('day');
  const currentDate = moment().tz(UZBEKISTAN_TIMEZONE).startOf('day');
  return targetDate.isBefore(currentDate);
};

/**
 * Check if a specific time on a date has passed in Uzbekistan timezone
 */
const isTimeInPastUzbekistan = (dateString, timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const targetDateTime = moment.tz(dateString, UZBEKISTAN_TIMEZONE)
    .hour(hours)
    .minute(minutes || 0)
    .second(0);
  
  const currentDateTime = moment().tz(UZBEKISTAN_TIMEZONE);
  return targetDateTime.isBefore(currentDateTime);
};

/**
 * Get available time slots for a date considering Uzbekistan timezone and current time
 */
const getUzbekistanAwareAvailableSlots = (dateString, workingHours, minimumHours = 1, cooldownMinutes = 0) => {
  const { start: startTime, end: endTime } = workingHours;
  const currentMoment = moment().tz(UZBEKISTAN_TIMEZONE);
  const targetDate = moment.tz(dateString, UZBEKISTAN_TIMEZONE);
  
  // If it's not today in Uzbekistan, return all working hours
  if (!targetDate.isSame(currentMoment, 'day')) {
    return generateTimeSlots(startTime, endTime, minimumHours, cooldownMinutes);
  }

  // For today in Uzbekistan, filter out past hours
  const currentHour = currentMoment.hour();
  const currentMinute = currentMoment.minute();
  
  // Convert start and end times to hours
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  
  // Calculate the earliest available hour (accounting for cooldown if current minute > 0)
  let earliestHour = Math.max(startHour, currentHour);
  if (currentMinute > 0) {
    earliestHour = Math.max(startHour, currentHour + 1);
  }
  
  // If no time slots are available today, return empty array
  if (earliestHour + minimumHours > endHour) {
    return [];
  }
  
  // Generate available time slots from earliest available hour
  const adjustedStartTime = `${earliestHour.toString().padStart(2, '0')}:00`;
  return generateTimeSlots(adjustedStartTime, endTime, minimumHours, cooldownMinutes);
};

/**
 * Generate time slots within working hours
 */
const generateTimeSlots = (startTime, endTime, minimumHours = 1, cooldownMinutes = 0) => {
  const slots = [];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const cooldownHours = cooldownMinutes / 60;
  
  // Calculate the latest possible start time
  const latestStartHour = Math.floor(endHour - minimumHours - cooldownHours);
  
  for (let hour = startHour; hour <= latestStartHour; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    slots.push(timeSlot);
  }
  
  return slots;
};

/**
 * Validate if a booking date and time is valid considering Uzbekistan timezone
 */
const validateBookingDateTimeUzbekistan = (dateString, timeString, workingHours) => {
  // Check if the date is in the past in Uzbekistan
  if (isDateInPastUzbekistan(dateString)) {
    return {
      isValid: false,
      message: "Cannot book for past dates"
    };
  }
  
  // Check if the time is in the past for today's bookings in Uzbekistan
  if (isTimeInPastUzbekistan(dateString, timeString)) {
    return {
      isValid: false,
      message: "Cannot book for past time slots"
    };
  }
  
  // Check if the time is within working hours
  const { start: startTime, end: endTime } = workingHours;
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const bookingHour = parseInt(timeString.split(':')[0], 10);
  
  if (bookingHour < startHour || bookingHour >= endHour) {
    return {
      isValid: false,
      message: "Booking time is outside working hours"
    };
  }
  
  return { isValid: true };
};

/**
 * Get available dates excluding past dates in Uzbekistan timezone
 */
const getAvailableDatesFromUzbekistan = (startDate, endDate, blockedDates = [], blockedWeekdays = []) => {
  const availableDates = [];
  const currentDate = getCurrentDateInUzbekistan();
  const start = moment.tz(startDate, UZBEKISTAN_TIMEZONE);
  const end = moment.tz(endDate, UZBEKISTAN_TIMEZONE);
  
  let currentDateIterator = start.clone();
  
  while (currentDateIterator.isSameOrBefore(end, 'day')) {
    const dateString = currentDateIterator.format('YYYY-MM-DD');
    const dayOfWeek = currentDateIterator.day();
    
    // Skip past dates
    if (currentDateIterator.isBefore(moment.tz(currentDate, UZBEKISTAN_TIMEZONE), 'day')) {
      currentDateIterator.add(1, 'day');
      continue;
    }
    
    // Skip blocked dates
    if (blockedDates.includes(dateString)) {
      currentDateIterator.add(1, 'day');
      continue;
    }
    
    // Skip blocked weekdays
    if (blockedWeekdays.includes(dayOfWeek)) {
      currentDateIterator.add(1, 'day');
      continue;
    }
    
    availableDates.push(dateString);
    currentDateIterator.add(1, 'day');
  }
  
  return availableDates;
};

module.exports = {
  getCurrentTimeInUzbekistan,
  getCurrentDateInUzbekistan,
  isDateInPastUzbekistan,
  isTimeInPastUzbekistan,
  getUzbekistanAwareAvailableSlots,
  validateBookingDateTimeUzbekistan,
  getAvailableDatesFromUzbekistan,
  generateTimeSlots,
  UZBEKISTAN_TIMEZONE
};
