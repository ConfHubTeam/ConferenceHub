/**
 * Time and date utility functions for availability calendar
 */

// Convert hour string to 24-hour format
export const formatHourTo24 = (hour) => {
  if (!hour) return "09:00";
  return hour.padStart(2, "0") + ":00";
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
  if (!dateString) return { start: checkIn || "09:00", end: checkOut || "17:00" };
  
  // Ensure date is properly parsed
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
  
  // Check if there are specific time slots for this weekday
  if (weekdayTimeSlots && weekdayTimeSlots[dayOfWeek]) {
    const timeSlot = weekdayTimeSlots[dayOfWeek];
    if (timeSlot.start && timeSlot.end) {
      const result = {
        start: formatHourTo24(timeSlot.start),
        end: formatHourTo24(timeSlot.end)
      };
      return result;
    }
  }
  
  // Fallback to general check-in/check-out times
 return { start: checkIn || "09:00", end: checkOut || "17:00" };
};

// Check if a specific time is blocked based on existing bookings and cooldown constraints
export const isTimeBlocked = (date, hour, blockedTimeSlots = [], minimumHours = 1, placeEndTime = "19:00", cooldownMinutes = 0) => {
  if (!date || !hour) return false;
  
  // Format should match what is stored in blockedTimeSlots
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
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

// Check if a specific time can be used as a start time (considering end-of-day cooldown restrictions)
export const isValidStartTime = (date, hour, blockedTimeSlots = [], minimumHours = 1, placeEndTime = "19:00", cooldownMinutes = 0) => {
  if (!date || !hour) return false;
  
  const checkHour = parseInt(hour.split(':')[0], 10);
  const placeEndHour = parseInt(placeEndTime.split(':')[0], 10);
  
  // Calculate cooldown constraint for end-of-day bookings
  const cooldownHours = cooldownMinutes / 60;
  const effectiveEndHour = placeEndHour - cooldownHours;
  
  // Check if there's enough time left to meet minimum booking duration before effective end time
  const remainingHours = effectiveEndHour - checkHour;
  if (remainingHours < minimumHours) {
    return false; // Not enough time left for minimum booking considering cooldown
  }
  
  // Also check if this time is blocked by actual bookings
  return !isTimeBlocked(date, hour, blockedTimeSlots, minimumHours, placeEndTime, cooldownMinutes);
};

// Get all booked time slots for a specific date
export const getBookedTimeSlots = (date, bookedTimeSlots = []) => {
  if (!date) return [];
  
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return bookedTimeSlots.filter(slot => slot.date === dateString);
};

// Calculate booking percentage for a specific date (including cooldown periods)
export const calculateBookingPercentage = (date, bookedTimeSlots = [], weekdayTimeSlots, checkIn, checkOut, cooldownMinutes = 0) => {
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
  
  if (bookingsForDate.length === 0) return 0;
  
  // Calculate booked hours including cooldown periods (only for actual bookings)
  let bookedHours = 0;
  
  // Create an array to track which hours are booked (including cooldown)
  const hourOccupancy = Array(24).fill(false);
  
  // Mark booked hours and cooldown hours in the array (only for actual bookings)
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
  
  // Count booked hours within operating hours
  for (let hour = startHour; hour < endHour; hour++) {
    if (hourOccupancy[hour]) {
      bookedHours++;
    }
  }
  
  // Calculate percentage
  return Math.round((bookedHours / totalHours) * 100);
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

// Check if a time range is completely available for booking
export const isTimeRangeAvailable = (date, startTime, endTime, blockedTimeSlots = [], cooldownMinutes = 0) => {
  if (!date || !startTime || !endTime) return false;
  
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  
  // Find all booked slots for this date
  const bookedSlotsForDate = blockedTimeSlots.filter(slot => slot.date === dateString);
  
  // Check if the requested range overlaps with any existing booking or their cooldown periods
  return !bookedSlotsForDate.some(slot => {
    const bookedStart = parseInt(slot.startTime.split(':')[0], 10);
    const bookedEnd = parseInt(slot.endTime.split(':')[0], 10);
    
    // Calculate cooldown period after the booking
    const cooldownHoursDecimal = cooldownMinutes / 60;
    const cooldownEnd = bookedEnd + cooldownHoursDecimal;
    
    // Check for overlap with the actual booking
    const hasBookingOverlap = (startHour < bookedEnd && endHour > bookedStart);
    
    // Check for overlap with the cooldown period
    const hasCooldownOverlap = (startHour < cooldownEnd && endHour > bookedEnd);
    
    return hasBookingOverlap || hasCooldownOverlap;
  });
};
