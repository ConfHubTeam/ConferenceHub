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
  
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  
  // Check if there are specific time slots for this weekday
  if (weekdayTimeSlots && weekdayTimeSlots[dayOfWeek]) {
    const timeSlot = weekdayTimeSlots[dayOfWeek];
    if (timeSlot.start && timeSlot.end) {
      return {
        start: formatHourTo24(timeSlot.start),
        end: formatHourTo24(timeSlot.end)
      };
    }
  }
  
  // Fallback to general check-in/check-out times
  return { start: checkIn || "09:00", end: checkOut || "17:00" };
};
