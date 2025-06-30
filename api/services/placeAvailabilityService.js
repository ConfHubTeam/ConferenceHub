/**
 * Place Availability Service
 * 
 * Handles availability filtering for places based on date and time parameters
 * Follows Single Responsibility Principle by focusing only on availability logic
 */

const { Op, Sequelize } = require('sequelize');
const { Booking } = require('../models');
const { 
  validateBookingDateTimeUzbekistan, 
  isDateInPastUzbekistan 
} = require('../utils/uzbekistanTimezoneUtils');

/**
 * Service class for handling place availability filtering
 */
class PlaceAvailabilityService {
  
  /**
   * Parses date and time filter parameters from request query
   * 
   * @param {Object} query - Request query parameters
   * @returns {Object} Parsed filter parameters
   */
  static parseAvailabilityFilters(query) {
    const { dates, startTime, endTime } = query;
    
    // Parse dates parameter (comma-separated string)
    let selectedDates = [];
    if (dates && typeof dates === 'string') {
      selectedDates = dates.split(',')
        .map(dateStr => dateStr.trim())
        .filter(dateStr => dateStr.length > 0)
        .filter(dateStr => {
          // Validate date format and ensure it's not in the past
          const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
          const isNotPast = !isDateInPastUzbekistan(dateStr);
          return isValidFormat && isNotPast;
        });
    }
    
    // Parse and validate time range
    const timeRange = this._parseTimeRange(startTime, endTime);
    
    return {
      selectedDates,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      hasDateFilter: selectedDates.length > 0,
      hasTimeFilter: !!(timeRange.startTime && timeRange.endTime)
    };
  }
  
  /**
   * Filters places based on availability criteria
   * 
   * @param {Array} places - Array of place objects to filter
   * @param {Object} availabilityFilters - Parsed availability filters
   * @returns {Promise<Array>} Array of available place IDs
   */
  static async filterAvailablePlaces(places, availabilityFilters) {
    const { selectedDates, startTime, endTime, hasDateFilter, hasTimeFilter } = availabilityFilters;
    
    // If no date/time filters, return all place IDs
    if (!hasDateFilter && !hasTimeFilter) {
      return places.map(place => place.id);
    }
    
    // If only time filter without dates, return all place IDs (time filter needs dates)
    if (hasTimeFilter && !hasDateFilter) {
      return places.map(place => place.id);
    }
    
    const availablePlaceIds = [];
    
    // Check each place for availability
    for (const place of places) {
      try {
        const isAvailable = await this._checkPlaceAvailability(place, availabilityFilters);
        if (isAvailable) {
          availablePlaceIds.push(place.id);
        }
      } catch (error) {
        console.error(`Error checking availability for place ${place.id}:`, error);
        // On error, assume place is not available for safety
      }
    }
    return availablePlaceIds;
  }
  
  /**
   * Checks if a specific place is available for the given dates and time range
   * Now includes comprehensive place-level availability constraints
   * 
   * @private
   * @param {Object} place - Place object with availability data
   * @param {Object} filters - Availability filters
   * @returns {Promise<boolean>} True if place is available
   */
  static async _checkPlaceAvailability(place, filters) {
    const { selectedDates, startTime, endTime, hasTimeFilter } = filters;
    
    try {
      // Check each selected date
      for (const dateString of selectedDates) {
        const dateObj = new Date(dateString + 'T00:00:00.000Z');
        
        // 1. Check if date is within place's overall availability range
        if (place.startDate && new Date(dateString) < new Date(place.startDate)) {
          return false;
        }
        
        if (place.endDate && new Date(dateString) > new Date(place.endDate)) {
          return false;
        }
        
        // 2. Check if date is in blocked dates
        if (place.blockedDates && Array.isArray(place.blockedDates) && place.blockedDates.includes(dateString)) {
          return false;
        }
        
        // 3. Check if weekday is blocked
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
        if (place.blockedWeekdays && Array.isArray(place.blockedWeekdays) && place.blockedWeekdays.includes(dayOfWeek)) {
          return false;
        }
        
        // 4. Check if place has operating hours for this day of week
        if (place.weekdayTimeSlots && hasTimeFilter && startTime && endTime) {
          const daySlot = place.weekdayTimeSlots[dayOfWeek];
          if (daySlot && daySlot.start && daySlot.end) {
            // Place has specific hours for this day - check if requested time fits
            const placeStart = daySlot.start;
            const placeEnd = daySlot.end;
            
            // Check if requested time range overlaps with place operating hours
            if (startTime < placeStart || endTime > placeEnd) {
              return false;
            }
          } else if (place.checkIn && place.checkOut) {
            // Use default check-in/check-out times if no specific day slot
            if (startTime < place.checkIn || endTime > place.checkOut) {
              return false;
            }
          }
        }
        
        // 5. Check for booking conflicts (existing logic)
        if (hasTimeFilter && startTime && endTime) {
          const hasConflict = await this._hasBookingConflict(place.id, dateString, startTime, endTime);
          if (hasConflict) {
            return false;
          }
        }
      }
      
      return true; // Available if all checks pass
    } catch (error) {
      return false; // Consider unavailable if error occurs
    }
  }
  
  /**
   * Checks for booking conflicts on a specific date and time range
   * 
   * @private
   * @param {number} placeId - Place ID
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {Promise<boolean>} True if there are conflicts
   */
  static async _hasBookingConflict(placeId, dateStr, startTime, endTime) {
    // Find all approved bookings for this place that might overlap
    const conflictingBookings = await Booking.findAll({
      where: {
        placeId: placeId,
        status: 'approved', // Only check approved bookings
        [Op.or]: [
          // Check time slot bookings using a more compatible approach
          {
            [Op.and]: [
              Sequelize.literal(`"timeSlots" IS NOT NULL`),
              Sequelize.literal(`JSONB_ARRAY_LENGTH("timeSlots") > 0`),
              Sequelize.literal(`EXISTS (
                SELECT 1 FROM JSONB_ARRAY_ELEMENTS("timeSlots") AS slot 
                WHERE slot->>'date' = '${dateStr}'
              )`)
            ]
          },
          // Check full-day bookings that include this date
          {
            checkInDate: {
              [Op.lte]: new Date(dateStr)
            },
            checkOutDate: {
              [Op.gte]: new Date(dateStr)
            },
            timeSlots: {
              [Op.or]: [
                { [Op.is]: null },
                { [Op.eq]: [] }
              ]
            }
          }
        ]
      },
      attributes: ['id', 'timeSlots', 'checkInDate', 'checkOutDate']
    });
    
    // Check each booking for time conflicts
    for (const booking of conflictingBookings) {
      if (this._hasTimeConflict(booking, dateStr, startTime, endTime)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Checks if a booking has time conflicts with the requested time range
   * 
   * @private
   * @param {Object} booking - Booking object
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @param {string} requestStartTime - Requested start time (HH:MM)
   * @param {string} requestEndTime - Requested end time (HH:MM)
   * @returns {boolean} True if there's a conflict
   */
  static _hasTimeConflict(booking, dateStr, requestStartTime, requestEndTime) {
    // Handle time slot bookings
    if (booking.timeSlots && booking.timeSlots.length > 0) {
      const slotsForDate = booking.timeSlots.filter(slot => slot.date === dateStr);
      
      for (const slot of slotsForDate) {
        if (this._timesOverlap(
          requestStartTime, 
          requestEndTime, 
          slot.startTime, 
          slot.endTime
        )) {
          return true;
        }
      }
    } else {
      // Handle full-day bookings - they conflict with any time request
      const bookingStart = new Date(booking.checkInDate);
      const bookingEnd = new Date(booking.checkOutDate);
      const requestDate = new Date(dateStr);
      
      if (requestDate >= bookingStart && requestDate <= bookingEnd) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Checks if two time ranges overlap
   * 
   * @private
   * @param {string} start1 - First range start time (HH:MM)
   * @param {string} end1 - First range end time (HH:MM)
   * @param {string} start2 - Second range start time (HH:MM)
   * @param {string} end2 - Second range end time (HH:MM)
   * @returns {boolean} True if times overlap
   */
  static _timesOverlap(start1, end1, start2, end2) {
    const start1Minutes = this._timeToMinutes(start1);
    const end1Minutes = this._timeToMinutes(end1);
    const start2Minutes = this._timeToMinutes(start2);
    const end2Minutes = this._timeToMinutes(end2);
    
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }
  
  /**
   * Converts time string to minutes since midnight
   * 
   * @private
   * @param {string} timeStr - Time string (HH:MM)
   * @returns {number} Minutes since midnight
   */
  static _timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Parses and validates time range parameters
   * 
   * @private
   * @param {string} startTime - Start time parameter
   * @param {string} endTime - End time parameter
   * @returns {Object} Validated time range
   */
  static _parseTimeRange(startTime, endTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    let validStartTime = null;
    let validEndTime = null;
    
    if (startTime && timeRegex.test(startTime)) {
      validStartTime = startTime;
    }
    
    if (endTime && timeRegex.test(endTime)) {
      validEndTime = endTime;
    }
    
    // Ensure end time is after start time
    if (validStartTime && validEndTime) {
      const startMinutes = this._timeToMinutes(validStartTime);
      const endMinutes = this._timeToMinutes(validEndTime);
      
      if (startMinutes >= endMinutes) {
        // Invalid time range - clear both
        validStartTime = null;
        validEndTime = null;
      }
    }
    
    return {
      startTime: validStartTime,
      endTime: validEndTime
    };
  }
}

module.exports = PlaceAvailabilityService;
