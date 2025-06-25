/**
 * Time and date utility functions for availability calendar
 */

// Helper function to safely format date to YYYY-MM-DD without timezone issues
const formatDateSafely = (date) => {
  if (typeof date === 'string') return date;
  // Use local date methods to avoid timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert hour string to 24-hour format
export const formatHourTo24 = (hour) => {
  if (!hour || hour === "") return "09:00";
  
  // If it's already in HH:MM format, return as is
  if (hour.includes(":")) {
    return hour;
  }
  
  // If it's just a number, pad it and add :00
  const hourNum = parseInt(hour, 10);
  if (isNaN(hourNum)) return "09:00";
  
  return hourNum.toString().padStart(2, "0") + ":00";
};

// Convert 24-hour format to 12-hour format for display
export const formatHourTo12 = (hour24) => {
  if (!hour24) return "";
  const [hours] = hour24.split(":");
  const hourNum = parseInt(hours, 10);
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  const amPm = hourNum < 12 ? "AM" : "PM";
  return `${displayHour}:00 ${amPm}`;
};

// Generate time options for select dropdowns
export const generateTimeOptions = (startHour, endHour, minimumHours = 1, cooldownMinutes = 0) => {
  const options = [];
  const start = parseInt(startHour.split(":")[0], 10);
  const end = parseInt(endHour.split(":")[0], 10);
  
  // Generate all time slots from start to end for visual display and end time selection
  for (let i = start; i <= end; i++) {
    const hour24 = i.toString().padStart(2, "0") + ":00";
    const hour12 = formatHourTo12(hour24);
    options.push({ value: hour24, label: hour12 });
  }
  
  return options;
};

// Generate start time options specifically (limited by cooldown and minimum duration)
export const generateStartTimeOptions = (startHour, endHour, minimumHours = 1, cooldownMinutes = 0) => {
  const options = [];
  const start = parseInt(startHour.split(":")[0], 10);
  const end = parseInt(endHour.split(":")[0], 10);
  
  // Calculate cooldown in hours (convert minutes to hours)
  const cooldownHours = cooldownMinutes / 60;
  
  // Calculate the effective end time considering cooldown
  // For fractional cooldowns, we need to be more precise
  const effectiveEndHour = end - cooldownHours;
  
  // Calculate the latest possible start time considering minimum booking duration + cooldown
  // The latest start time is when start + minimum duration + cooldown <= end time
  const latestStartHour = Math.floor(effectiveEndHour - minimumHours);
  
  for (let i = start; i <= latestStartHour; i++) {
    const hour24 = i.toString().padStart(2, "0") + ":00";
    const hour12 = formatHourTo12(hour24);
    options.push({ value: hour24, label: hour12 });
  }
  
  return options;
};

// Get available time slots for a specific day
export const getAvailableTimeSlots = (dateString, weekdayTimeSlots, checkIn, checkOut) => {
  if (!dateString) {
    return { start: checkIn || "09:00", end: checkOut || "17:00" };
  }
  
  // Ensure date is properly parsed
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
  
  // Check if there are specific time slots for this weekday
  if (weekdayTimeSlots && weekdayTimeSlots[dayOfWeek]) {
    const timeSlot = weekdayTimeSlots[dayOfWeek];
    if (timeSlot.start && timeSlot.end && timeSlot.start !== "" && timeSlot.end !== "") {
      const result = {
        start: formatHourTo24(timeSlot.start),
        end: formatHourTo24(timeSlot.end)
      };
      return result;
    }
  }
  
  // Fallback to general check-in/check-out times
  const fallback = { start: checkIn || "09:00", end: checkOut || "17:00" };
  return fallback;
};

// Check if a specific time is blocked based on existing bookings and cooldown constraints
export const isTimeBlocked = (date, hour, blockedTimeSlots = [], minimumHours = 1, placeEndTime = "19:00", cooldownMinutes = 0) => {
  if (!date || !hour) return false;
  
  // Format should match what is stored in blockedTimeSlots - avoid timezone issues
  const dateString = formatDateSafely(date);
  
  const checkHour = parseInt(hour.split(':')[0], 10);
  
  // Only check for actual booking conflicts and their cooldown periods
  // Do NOT block end-of-day slots here - that should be handled in start time options only
  return blockedTimeSlots.some(slot => {
    if (slot.date !== dateString) return false;
    
    const startHour = parseInt(slot.startTime.split(':')[0], 10);
    const endHour = parseInt(slot.endTime.split(':')[0], 10);
    
    // Calculate cooldown period after the booking
    const cooldownHoursDecimal = cooldownMinutes / 60;
    const cooldownEndHour = endHour + cooldownHoursDecimal;
    
    // If the hour falls within the booked range (including start, excluding end), it's blocked
    if (checkHour >= startHour && checkHour < endHour) {
      return true;
    }
    
    // If the hour falls within the cooldown period after the booking, it's blocked
    if (checkHour >= endHour && checkHour < cooldownEndHour) {
      return true;
    }
    
    return false;
  });
};

/**
 * Enhanced conflict detection that considers both backward and forward conflicts
 * This addresses the issue where a booking might be valid in isolation but creates
 * conflicts with existing bookings due to cooldown requirements
 */
export const hasConflictWithExistingBookings = (
  date, 
  proposedStartTime, 
  proposedEndTime, 
  blockedTimeSlots = [], 
  cooldownMinutes = 0,
  minimumHours = 1
) => {
  if (!date || !proposedStartTime || !proposedEndTime) return true;
  
  const dateString = formatDateSafely(date);
  const proposedStart = parseInt(proposedStartTime.split(':')[0], 10);
  const proposedEnd = parseInt(proposedEndTime.split(':')[0], 10);
  const cooldownHours = cooldownMinutes / 60;
  
  // Get all bookings for this date
  const bookedSlotsForDate = blockedTimeSlots.filter(slot => slot.date === dateString);
  
  // If no existing bookings, no conflict
  if (bookedSlotsForDate.length === 0) {
    return false;
  }
  
  return bookedSlotsForDate.some(existingBooking => {
    const existingStart = parseInt(existingBooking.startTime.split(':')[0], 10);
    const existingEnd = parseInt(existingBooking.endTime.split(':')[0], 10);
    const existingCooldownEnd = existingEnd + cooldownHours;
    
    // Case 1: Direct overlap with existing booking
    if (proposedStart < existingEnd && proposedEnd > existingStart) {
      return true;
    }
    
    // Case 2: Proposed booking overlaps with existing booking's cooldown period
    if (proposedStart < existingCooldownEnd && proposedEnd > existingEnd) {
      return true;
    }
    
    // Case 3: FORWARD CONFLICT - Proposed booking would need cooldown that overlaps with existing booking
    // This is the key fix for the reported issue
    const proposedCooldownEnd = proposedEnd + cooldownHours;
    if (proposedCooldownEnd > existingStart && proposedEnd <= existingStart) {
      return true;
    }
    
    // Case 4: Check if there's enough gap between bookings for both cooldowns
    if (proposedEnd <= existingStart) {
      // Proposed booking ends before existing starts - check cooldown gap
      const gapBetweenBookings = existingStart - proposedEnd;
      if (gapBetweenBookings < cooldownHours) {
        return true;
      }
    }
    
    if (existingEnd <= proposedStart) {
      // Existing booking ends before proposed starts - check cooldown gap
      const gapBetweenBookings = proposedStart - existingEnd;
      if (gapBetweenBookings < cooldownHours) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Enhanced validation for start times that considers forward conflicts
 * This replaces isValidStartTime with more comprehensive conflict checking
 */
export const isValidStartTimeEnhanced = (
  date, 
  startTime, 
  blockedTimeSlots = [], 
  minimumHours = 1, 
  placeEndTime = "19:00", 
  cooldownMinutes = 0
) => {
  if (!date || !startTime) return false;
  
  const startHour = parseInt(startTime.split(':')[0], 10);
  const placeEndHour = parseInt(placeEndTime.split(':')[0], 10);
  const cooldownHours = cooldownMinutes / 60;
  
  // First check: is this the last hour of operation? If so, it's always invalid for booking start
  if (startHour >= placeEndHour) {
    return false;
  }
  
  // Second check: is there enough time for minimum booking + cooldown before place closes?
  const requiredTimeBeforeClose = minimumHours + cooldownHours;
  const availableTimeBeforeClose = placeEndHour - startHour;
  
  if (availableTimeBeforeClose < requiredTimeBeforeClose) {
    return false;
  }
  
  // If there are no existing bookings, and we pass the above checks, it's valid
  if (!blockedTimeSlots || blockedTimeSlots.length === 0) {
    return true;
  }
  
  // Calculate the minimum end time for this start time
  const minimumEndTime = `${(startHour + minimumHours).toString().padStart(2, '0')}:00`;
  
  // Check for conflicts with existing bookings using enhanced conflict detection
  return !hasConflictWithExistingBookings(
    date, 
    startTime, 
    minimumEndTime, 
    blockedTimeSlots, 
    cooldownMinutes, 
    minimumHours
  );
};

/**
 * Enhanced validation for complete time ranges
 * This replaces isTimeRangeAvailable with more comprehensive conflict checking
 */
export const isTimeRangeAvailableEnhanced = (
  date, 
  startTime, 
  endTime, 
  blockedTimeSlots = [], 
  cooldownMinutes = 0
) => {
  if (!date || !startTime || !endTime) return false;
  
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  
  // Basic validation - end must be after start
  if (endHour <= startHour) return false;
  
  // Use enhanced conflict detection
  return !hasConflictWithExistingBookings(
    date, 
    startTime, 
    endTime, 
    blockedTimeSlots, 
    cooldownMinutes
  );
};

/**
 * Get all valid start time options considering enhanced conflict resolution
 */
export const getValidStartTimeOptions = (
  date,
  startHour, 
  endHour, 
  blockedTimeSlots = [],
  minimumHours = 1, 
  cooldownMinutes = 0
) => {
  const options = [];
  const start = parseInt(startHour.split(":")[0], 10);
  const end = parseInt(endHour.split(":")[0], 10);
  
  for (let i = start; i < end; i++) {
    const timeOption = `${i.toString().padStart(2, "0")}:00`;
    
    if (isValidStartTimeEnhanced(
      date,
      timeOption,
      blockedTimeSlots,
      minimumHours,
      endHour,
      cooldownMinutes
    )) {
      options.push({
        value: timeOption,
        label: formatHourTo12(timeOption)
      });
    }
  }
  
  return options;
};

/**
 * Get valid end time options for a given start time
 */
export const getValidEndTimeOptions = (
  date,
  startTime,
  placeEndTime,
  blockedTimeSlots = [],
  minimumHours = 1,
  cooldownMinutes = 0
) => {
  if (!startTime) return [];
  
  const options = [];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const placeEndHour = parseInt(placeEndTime.split(':')[0], 10);
  const cooldownHours = cooldownMinutes / 60;
  
  // Calculate the latest possible end time considering cooldown
  const maxEndHour = Math.floor(placeEndHour - cooldownHours);
  
  // Start from minimum booking duration
  for (let i = startHour + minimumHours; i <= maxEndHour; i++) {
    const endTimeOption = `${i.toString().padStart(2, "0")}:00`;
    
    if (isTimeRangeAvailableEnhanced(
      date,
      startTime,
      endTimeOption,
      blockedTimeSlots,
      cooldownMinutes
    )) {
      options.push({
        value: endTimeOption,
        label: formatHourTo12(endTimeOption)
      });
    }
  }
  
  return options;
};

// Get all booked time slots for a specific date
export const getBookedTimeSlots = (date, bookedTimeSlots = []) => {
  if (!date) return [];
  
  const dateString = formatDateSafely(date);
  
  return bookedTimeSlots.filter(slot => slot.date === dateString);
};

// Calculate booking percentage for a specific date (including cooldown periods and unbookable slots)
export const calculateBookingPercentage = (date, bookedTimeSlots = [], weekdayTimeSlots, checkIn, checkOut, cooldownMinutes = 0, minimumHours = 1) => {
  if (!date) return 0;
  
  // Get the available time slots for this date
  const availableTimeRange = getAvailableTimeSlots(date, weekdayTimeSlots, checkIn, checkOut);
  const startHour = parseInt(availableTimeRange.start.split(':')[0], 10);
  const endHour = parseInt(availableTimeRange.end.split(':')[0], 10);
  
  // Calculate total available hours
  const totalHours = endHour - startHour;
  
  if (totalHours <= 0) return 0;
  
  // Get all bookings for this date
  const bookingsForDate = getBookedTimeSlots(date, bookedTimeSlots);
  
  // Create an array to track which hours are unavailable (booked, cooldown, or conflicted)
  const hourOccupancy = Array(24).fill(false);
  
  // First, mark directly booked hours and cooldown hours
  bookingsForDate.forEach(booking => {
    const bookingStartHour = parseInt(booking.startTime.split(':')[0], 10);
    const bookingEndHour = parseInt(booking.endTime.split(':')[0], 10);
    
    // Mark actual booking hours
    for (let hour = bookingStartHour; hour < bookingEndHour; hour++) {
      if (hour >= startHour && hour < endHour) {
        hourOccupancy[hour] = true;
      }
    }
    
    // Mark cooldown hours (only after actual bookings)
    const cooldownHours = cooldownMinutes / 60;
    const cooldownEndHour = bookingEndHour + cooldownHours;
    
    for (let hour = bookingEndHour; hour < cooldownEndHour; hour++) {
      const hourIndex = Math.floor(hour);
      if (hourIndex >= startHour && hourIndex < endHour) {
        hourOccupancy[hourIndex] = true;
      }
    }
  });
  
  // Second, mark hours that are unbookable due to conflicts or insufficient time
  // Only do this if there are existing bookings
  if (bookingsForDate.length > 0) {
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip if already marked as occupied
      if (hourOccupancy[hour]) continue;
      
      // Check if this hour is unbookable due to conflicts or time constraints
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const isValidStart = isValidStartTimeEnhanced(
        date,
        timeSlot,
        bookingsForDate,
        minimumHours,
        availableTimeRange.end,
        cooldownMinutes
      );
      
      // If it's not a valid start time due to conflicts (not just end-of-day constraints),
      // mark it as occupied
      if (!isValidStart) {
        // Additional check: only mark as occupied if there's an actual conflict with existing bookings
        const testEndTime = `${(hour + minimumHours).toString().padStart(2, '0')}:00`;
        const hasActualConflict = hasConflictWithExistingBookings(
          date,
          timeSlot,
          testEndTime,
          bookingsForDate,
          cooldownMinutes,
          minimumHours
        );
        
        if (hasActualConflict) {
          hourOccupancy[hour] = true;
        }
      }
    }
  }
  
  // Count unavailable hours within operating hours
  let unavailableHours = 0;
  for (let hour = startHour; hour < endHour; hour++) {
    if (hourOccupancy[hour]) {
      unavailableHours++;
    }
  }
  
  // Calculate percentage
  return Math.round((unavailableHours / totalHours) * 100);
};

// Fetch booked time slots from the API for a specific place
export const fetchBookedTimeSlots = async (placeId, date = null, api) => {
  try {
    let url = `/bookings/availability?placeId=${placeId}`;
    if (date) {
      url += `&date=${date}`;
    }
    
    const response = await api.get(url);
    if (response.data && response.data.bookedTimeSlots) {
      return response.data.bookedTimeSlots;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return [];
  }
};

// Validate if a time slot is available (not overlapping with any booked slots or cooldown periods)
export const validateTimeSlot = (timeSlot, bookedSlots = [], cooldownMinutes = 0) => {
  if (!bookedSlots || bookedSlots.length === 0) return true;
  
  // Filter for booked slots on the same date
  const bookedSlotsForDate = bookedSlots.filter(slot => slot.date === timeSlot.date);
  if (bookedSlotsForDate.length === 0) return true;
  
  // Parse times as hours for comparison
  const [startHour] = timeSlot.startTime.split(':').map(Number);
  const [endHour] = timeSlot.endTime.split(':').map(Number);
  
  // Check for overlap with each booked slot (including cooldown periods)
  return !bookedSlotsForDate.some(booked => {
    const [bookedStart] = booked.startTime.split(':').map(Number);
    const [bookedEnd] = booked.endTime.split(':').map(Number);
    
    // Calculate cooldown period after the booking
    const cooldownHours = cooldownMinutes / 60;
    const cooldownEnd = bookedEnd + cooldownHours;
    
    // Check for overlap with the actual booking
    const hasBookingOverlap = (startHour < bookedEnd && endHour > bookedStart);
    
    // Check for overlap with the cooldown period
    const hasCooldownOverlap = (startHour < cooldownEnd && endHour > bookedEnd);
    
    return hasBookingOverlap || hasCooldownOverlap;
  });
};

// Import timezone utilities for Uzbekistan-aware validation
import { getTimezoneAwareAvailability, generateTimezoneAwareTimeOptions, getCurrentDateObjectInUzbekistan } from './uzbekistanTimezoneUtils';

/**
 * Main availability check function - now timezone-aware by default
 * This function checks if a time range is available considering:
 * 1. Uzbekistan timezone constraints (past times are not available)
 * 2. Existing bookings and conflicts
 * 3. Cooldown periods
 * 4. Working hours
 */
export const isTimeRangeAvailable = async (
  date,
  startTime,
  endTime,
  placeId,
  blockedTimeSlots = [],
  cooldownMinutes = 0
) => {
  if (!startTime || !endTime || !date || !placeId) {
    return false;
  }

  try {
    // Get timezone-aware availability from backend
    const availability = await getTimezoneAwareAvailability(placeId, formatDateSafely(date));
    
    // Check if the date is available
    if (!availability.availableDates.includes(formatDateSafely(date))) {
      return false;
    }
    
    // Check if start time is in available time slots
    if (!availability.availableTimeSlots.includes(startTime)) {
      return false;
    }
    
    // Use existing enhanced validation for additional checks
    return isTimeRangeAvailableEnhanced(
      date,
      startTime,
      endTime,
      blockedTimeSlots,
      cooldownMinutes
    );
  } catch (error) {
    console.error('Error checking timezone-aware availability:', error);
    // Fallback to existing validation
    return isTimeRangeAvailableEnhanced(
      date,
      startTime,
      endTime,
      blockedTimeSlots,
      cooldownMinutes
    );
  }
};

/**
 * Legacy local-time validation function - kept for backward compatibility
 * NOTE: This should only be used for internal calculations, not for user-facing availability
 */
export const isTimeRangeAvailableLocal = isTimeRangeAvailableEnhanced;

// Generate timezone-aware time options for a specific date
export const generateTimezoneAwareStartTimeOptions = async (
  date,
  placeId,
  minimumHours = 1,
  cooldownMinutes = 0
) => {
  try {
    const availability = await getTimezoneAwareAvailability(placeId, formatDateSafely(date));
    
    return generateTimezoneAwareTimeOptions(
      availability.availableTimeSlots,
      minimumHours,
      cooldownMinutes
    );
  } catch (error) {
    console.error('Error generating timezone-aware time options:', error);
    return [];
  }
};

// Maintain backward compatibility
export const isValidStartTime = isValidStartTimeEnhanced;

/**
 * Determines if a date is completely unbookable (no valid start times available)
 * This is used to show dates as red instead of orange when they have no available slots
 * due to minimum booking requirements, day end constraints, cooldown periods, conflicts, or past times
 */
export const isDateCompletelyUnbookable = (date, bookedTimeSlots = [], weekdayTimeSlots, checkIn, checkOut, cooldownMinutes = 0, minimumHours = 1) => {
  if (!date) return true;
  
  // Get the available time slots for this date
  const availableTimeRange = getAvailableTimeSlots(date, weekdayTimeSlots, checkIn, checkOut);
  const startHour = parseInt(availableTimeRange.start.split(':')[0], 10);
  const endHour = parseInt(availableTimeRange.end.split(':')[0], 10);
  
  // If no working hours defined, date is unbookable
  if (startHour >= endHour) return true;
  
  // Get current time in Uzbekistan timezone
  const uzbekistanNow = getCurrentDateObjectInUzbekistan();
  
  // Get the selected date as a proper date string (YYYY-MM-DD format)
  let selectedDateString;
  if (typeof date === "string") {
    // If it's already a string, check if it's in YYYY-MM-DD format
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      selectedDateString = date;
    } else {
      // Parse and reformat to ensure YYYY-MM-DD
      const tempDate = new Date(date);
      selectedDateString = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    }
  } else {
    // If it's a Date object, format it to YYYY-MM-DD
    selectedDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  
  const uzbekistanDateString = `${uzbekistanNow.getFullYear()}-${String(uzbekistanNow.getMonth() + 1).padStart(2, '0')}-${String(uzbekistanNow.getDate()).padStart(2, '0')}`;
  const isToday = selectedDateString === uzbekistanDateString;
  const currentHourUzbekistan = isToday ? uzbekistanNow.getHours() : -1;
  
  // Get all bookings for this date
  const bookingsForDate = getBookedTimeSlots(date, bookedTimeSlots);
  
  // Count total hours in the working day
  const totalWorkingHours = endHour - startHour;
  let unbookableHours = 0;
  
  // Check each hour within working hours
  for (let hour = startHour; hour < endHour; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    let isHourUnbookable = false;
    
    // Check if this hour is in the past (in Uzbekistan timezone)
    if (isToday && hour <= currentHourUzbekistan) {
      isHourUnbookable = true; // Past hours are unbookable
    } else {
      // Check if this hour can be a valid start time for future hours
      const isValidStart = isValidStartTimeEnhanced(
        date,
        timeSlot,
        bookingsForDate,
        minimumHours,
        availableTimeRange.end,
        cooldownMinutes
      );
      
      // If it's not a valid start time, it's unbookable
      if (!isValidStart) {
        isHourUnbookable = true;
      }
    }
    
    if (isHourUnbookable) {
      unbookableHours++;
    }
  }
  
  // If ALL hours in the working day are unbookable, the date is completely unbookable
  return unbookableHours >= totalWorkingHours;
};
