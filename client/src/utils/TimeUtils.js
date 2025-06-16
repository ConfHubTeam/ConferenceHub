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
export const generateTimeOptions = (startHour, endHour) => {
  const options = [];
  const start = parseInt(startHour.split(":")[0], 10);
  const end = parseInt(endHour.split(":")[0], 10);
  
  for (let i = start; i <= end; i++) {
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

// Check if a specific time is blocked based on existing bookings
export const isTimeBlocked = (date, hour, blockedTimeSlots = []) => {
  if (!date || !hour) return false;
  
  // Format should match what is stored in blockedTimeSlots
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  // Check if there's any booking for this date and time
  return blockedTimeSlots.some(slot => {
    if (slot.date !== dateString) return false;
    
    const startHour = parseInt(slot.startTime.split(':')[0], 10);
    const endHour = parseInt(slot.endTime.split(':')[0], 10);
    const checkHour = parseInt(hour.split(':')[0], 10);
    
    // If the hour falls within the booked range (including start, excluding end), it's blocked
    // For example: if booked 9-17, hours 9,10,11,12,13,14,15,16 are blocked, but 17 is available
    // However, if you're checking if you can START a booking at hour 16, and the existing 
    // booking ends at 17, then hour 16 should be blocked because you can't start there
    return checkHour >= startHour && checkHour < endHour;
  });
};

// Get all booked time slots for a specific date
export const getBookedTimeSlots = (date, bookedTimeSlots = []) => {
  if (!date) return [];
  
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return bookedTimeSlots.filter(slot => slot.date === dateString);
};

// Calculate booking percentage for a specific date
export const calculateBookingPercentage = (date, bookedTimeSlots = [], weekdayTimeSlots, checkIn, checkOut) => {
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
  
  // Calculate booked hours
  let bookedHours = 0;
  
  // Create an array to track which hours are booked
  const hourOccupancy = Array(24).fill(false);
  
  // Mark booked hours in the array
  bookingsForDate.forEach(booking => {
    const bookingStartHour = parseInt(booking.startTime.split(':')[0], 10);
    const bookingEndHour = parseInt(booking.endTime.split(':')[0], 10);
    
    for (let hour = bookingStartHour; hour < bookingEndHour; hour++) {
      if (hour >= startHour && hour < endHour) {
        hourOccupancy[hour] = true;
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

// Validate if a time slot is available (not overlapping with any booked slots)
export const validateTimeSlot = (timeSlot, bookedSlots = []) => {
  if (!bookedSlots || bookedSlots.length === 0) return true;
  
  // Filter for booked slots on the same date
  const bookedSlotsForDate = bookedSlots.filter(slot => slot.date === timeSlot.date);
  if (bookedSlotsForDate.length === 0) return true;
  
  // Parse times as hours for comparison
  const [startHour] = timeSlot.startTime.split(':').map(Number);
  const [endHour] = timeSlot.endTime.split(':').map(Number);
  
  // Check for overlap with each booked slot
  return !bookedSlotsForDate.some(booked => {
    const [bookedStart] = booked.startTime.split(':').map(Number);
    const [bookedEnd] = booked.endTime.split(':').map(Number);
    
    // Check if there's overlap (return true if overlap exists)
    return (startHour < bookedEnd && endHour > bookedStart);
  });
};

// Check if a time range is completely available for booking
export const isTimeRangeAvailable = (date, startTime, endTime, blockedTimeSlots = []) => {
  if (!date || !startTime || !endTime) return false;
  
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  
  // Find all booked slots for this date
  const bookedSlotsForDate = blockedTimeSlots.filter(slot => slot.date === dateString);
  
  // Check if the requested range overlaps with any existing booking
  return !bookedSlotsForDate.some(slot => {
    const bookedStart = parseInt(slot.startTime.split(':')[0], 10);
    const bookedEnd = parseInt(slot.endTime.split(':')[0], 10);
    
    // Check for any overlap: requestedStart < bookedEnd AND requestedEnd > bookedStart
    return (startHour < bookedEnd && endHour > bookedStart);
  });
};
