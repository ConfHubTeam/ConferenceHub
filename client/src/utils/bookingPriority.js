/**
 * Booking Priority Utility Functions
 * Handles calculation of booking hours and priority logic
 */

/**
 * Calculate total hours from time slots
 * @param {Array} timeSlots - Array of time slot objects with startTime and endTime
 * @returns {number} Total hours
 */
export const calculateTotalHours = (timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) return 0;
  
  return timeSlots.reduce((total, slot) => {
    const [startHour] = slot.startTime.split(':').map(Number);
    const [endHour] = slot.endTime.split(':').map(Number);
    return total + (endHour - startHour);
  }, 0);
};

/**
 * Calculate hours for a specific date from time slots
 * @param {Array} timeSlots - Array of time slot objects
 * @param {string} targetDate - Date to calculate hours for
 * @returns {number} Hours for the specific date
 */
export const calculateHoursForDate = (timeSlots, targetDate) => {
  if (!timeSlots || timeSlots.length === 0) return 0;
  
  return timeSlots
    .filter(slot => slot.date === targetDate)
    .reduce((total, slot) => {
      const [startHour] = slot.startTime.split(':').map(Number);
      const [endHour] = slot.endTime.split(':').map(Number);
      return total + (endHour - startHour);
    }, 0);
};

/**
 * Check if current booking has highest hours on any of its dates compared to competitors
 * Uses date-specific comparison - only bookings with highest hours per date get priority
 * @param {Object} currentBooking - Current booking object
 * @param {Array} competingBookings - Array of competing booking objects
 * @returns {Object} Priority info object
 */
export const getPriorityInfo = (currentBooking, competingBookings = []) => {
  const currentHours = calculateTotalHours(currentBooking.timeSlots);
  const hasCompetitors = competingBookings.length > 0;
  
  if (!hasCompetitors || currentHours === 0) {
    return {
      hasCompetitors: false,
      isHighestHours: false,
      currentHours,
      competitorCount: 0
    };
  }
  
  // Get dates from current booking
  const currentDates = currentBooking.timeSlots?.map(slot => slot.date) || [];
  
  // Filter competitors to only those that overlap with current booking dates
  const overlappingCompetitors = competingBookings.filter(competitor => {
    const competitorDates = competitor.timeSlots?.map(slot => slot.date) || [];
    return competitorDates.some(date => currentDates.includes(date));
  });
  
  if (overlappingCompetitors.length === 0) {
    return {
      hasCompetitors: false,
      isHighestHours: false,
      currentHours,
      competitorCount: 0
    };
  }
  
  // Check if current booking has highest hours on any of its dates
  let isHighestOnAnyDate = false;
  
  for (const date of currentDates) {
    const currentHoursForDate = calculateHoursForDate(currentBooking.timeSlots, date);
    
    // Get max hours for this date from all competitors
    const competitorHoursForDate = overlappingCompetitors.map(competitor => 
      calculateHoursForDate(competitor.timeSlots, date)
    ).filter(hours => hours > 0); // Only consider competitors that actually have slots on this date
    
    if (competitorHoursForDate.length === 0) {
      // No competitors on this date, so current booking is not competing
      continue;
    }
    
    const maxCompetitorHoursForDate = Math.max(...competitorHoursForDate);
    
    if (currentHoursForDate > maxCompetitorHoursForDate) {
      isHighestOnAnyDate = true;
      break;
    }
  }
  
  return {
    hasCompetitors: true,
    isHighestHours: isHighestOnAnyDate,
    currentHours,
    competitorCount: overlappingCompetitors.length
  };
};
