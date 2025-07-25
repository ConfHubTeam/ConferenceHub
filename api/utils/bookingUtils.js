/**
 * Enhanced booking conflict detection utilities
 */

const { 
  validateBookingDateTimeUzbekistan, 
  isDateInPastUzbekistan,
  isTimeInPastUzbekistan
} = require('./uzbekistanTimezoneUtils');
const { Booking } = require('../models');
const { Op } = require('sequelize');

/**
 * Automatic cleanup of expired pending/selected bookings
 * Removes bookings in "pending" or "selected" status where all time slots are in the past
 */
const cleanupExpiredBookings = async () => {
  try {
    // Get all pending and selected bookings
    const expiredCandidates = await Booking.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'selected']
        }
      },
      attributes: ['id', 'timeSlots', 'checkInDate', 'checkOutDate']
    });

    const expiredBookingIds = [];

    for (const booking of expiredCandidates) {
      let isExpired = false;

      if (booking.timeSlots && booking.timeSlots.length > 0) {
        // For time slot bookings, check if all slots are in the past
        const allSlotsExpired = booking.timeSlots.every(slot => {
          // Check if the date is in the past
          if (isDateInPastUzbekistan(slot.date)) {
            return true;
          }
          
          // If it's today, check if the end time has passed
          const currentDate = require('moment-timezone')().tz('Asia/Tashkent').format('YYYY-MM-DD');
          if (slot.date === currentDate) {
            return isTimeInPastUzbekistan(slot.date, slot.endTime);
          }
          
          return false;
        });

        if (allSlotsExpired) {
          isExpired = true;
        }
      } else if (booking.checkInDate && booking.checkOutDate) {
        // For full-day bookings, check if checkout date is in the past
        if (isDateInPastUzbekistan(booking.checkOutDate)) {
          isExpired = true;
        }
      }

      if (isExpired) {
        expiredBookingIds.push(booking.id);
      }
    }

    // Delete expired bookings (they are not counted as rejected, just removed)
    if (expiredBookingIds.length > 0) {
      await Booking.destroy({
        where: {
          id: {
            [Op.in]: expiredBookingIds
          }
        }
      });
    }

    return expiredBookingIds.length;
  } catch (error) {
    console.error('Error during booking cleanup:', error);
    return 0;
  }
};

/**
 * Check if two time slots have conflicts considering cooldown periods
 */
const hasTimeSlotConflict = (slot1, slot2, cooldownMinutes = 0) => {
  if (slot1.date !== slot2.date) return false;
  
  const slot1Start = parseInt(slot1.startTime.split(':')[0], 10);
  const slot1End = parseInt(slot1.endTime.split(':')[0], 10);
  const slot2Start = parseInt(slot2.startTime.split(':')[0], 10);
  const slot2End = parseInt(slot2.endTime.split(':')[0], 10);
  
  const cooldownHours = cooldownMinutes / 60;
  
  // Direct overlap
  if (slot1Start < slot2End && slot1End > slot2Start) {
    return true;
  }
  
  // Slot1 cooldown overlaps with slot2
  const slot1CooldownEnd = slot1End + cooldownHours;
  if (slot1CooldownEnd > slot2Start && slot1End <= slot2Start) {
    return true;
  }
  
  // Slot2 cooldown overlaps with slot1
  const slot2CooldownEnd = slot2End + cooldownHours;
  if (slot2CooldownEnd > slot1Start && slot2End <= slot1Start) {
    return true;
  }
  
  return false;
};

/**
 * Validate booking time slots against existing CONFIRMED bookings only
 * This allows multiple pending requests to compete for the same time slots
 * Now includes Uzbekistan timezone-aware validation
 */
const validateBookingTimeSlots = async (timeSlots, placeId, cooldownMinutes = 0) => {
  try {
    // Get place details for working hours validation
    const { Place } = require("../models");
    const place = await Place.findByPk(placeId);
    if (!place) {
      return {
        isValid: false,
        message: "Place not found"
      };
    }

    // Validate each time slot against Uzbekistan timezone
    for (const timeSlot of timeSlots) {
      const { date, startTime, endTime } = timeSlot;
      
      // Check if date is in the past in Uzbekistan
      if (isDateInPastUzbekistan(date)) {
        return {
          isValid: false,
          message: `Cannot book for past date: ${date} (based on Uzbekistan time)`,
          conflictingSlot: timeSlot
        };
      }
      
      // Check if start time is in the past for today's bookings in Uzbekistan
      if (isTimeInPastUzbekistan(date, startTime)) {
        return {
          isValid: false,
          message: `Cannot book for past time: ${startTime} on ${date} (based on Uzbekistan time)`,
          conflictingSlot: timeSlot
        };
      }

      // Validate against working hours
      const workingHours = place.weekdayTimeSlots ? 
        place.weekdayTimeSlots[new Date(date).getDay()] : 
        { start: place.checkIn || "09:00", end: place.checkOut || "17:00" };
      
      const validation = validateBookingDateTimeUzbekistan(date, startTime, workingHours);
      if (!validation.isValid) {
        return {
          isValid: false,
          message: validation.message,
          conflictingSlot: timeSlot
        };
      }
    }

    // Get only CONFIRMED/PAID bookings for this place (not pending requests)
    const existingBookings = await Booking.findAll({
      where: {
        placeId: placeId,
        status: ['approved'] // Only check against confirmed bookings, allow competing pending requests
      }
    });
    
    // Check each proposed time slot against existing CONFIRMED bookings only
    for (const proposedSlot of timeSlots) {
      for (const existingBooking of existingBookings) {
        if (!existingBooking.timeSlots) continue;
        
        for (const existingSlot of existingBooking.timeSlots) {
          if (hasTimeSlotConflict(proposedSlot, existingSlot, cooldownMinutes)) {
            return {
              isValid: false,
              message: `Time slot ${proposedSlot.startTime}-${proposedSlot.endTime} on ${proposedSlot.date} conflicts with confirmed booking`,
              conflictingSlot: proposedSlot
            };
          }
        }
      }
    }
    
    return { isValid: true };
  } catch (error) {
    console.error("Error validating booking time slots:", error);
    return {
      isValid: false,
      message: "Error validating time slots"
    };
  }
};

/**
 * Find conflicting bookings when approving a booking
 */
const findConflictingBookings = (approvedBooking, pendingBookings, cooldownMinutes = 0) => {
  const conflictingBookings = [];
  
  if (!approvedBooking.timeSlots) return conflictingBookings;
  
  for (const pendingBooking of pendingBookings) {
    if (!pendingBooking.timeSlots) continue;
    
    const hasConflict = pendingBooking.timeSlots.some(pendingSlot => 
      approvedBooking.timeSlots.some(approvedSlot => 
        hasTimeSlotConflict(pendingSlot, approvedSlot, cooldownMinutes)
      )
    );
    
    if (hasConflict) {
      conflictingBookings.push(pendingBooking);
    }
  }
  
  return conflictingBookings;
};

/**
 * Find competing pending and selected bookings for the same time slots
 * Used by hosts to see competing requests for selection
 */
const findCompetingBookings = async (timeSlots, placeId, excludeBookingId = null) => {
  try {
    // Clean up expired bookings before finding competing ones
    await cleanupExpiredBookings();
    
    const competingBookings = await Booking.findAll({
      where: {
        placeId: placeId,
        status: { [Op.in]: ['pending', 'selected'] },
        ...(excludeBookingId && { id: { [Op.ne]: excludeBookingId } })
      },
      include: [
        {
          model: require("../models").User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    const conflictingBookings = [];
    
    // Find bookings that have overlapping time slots
    for (const booking of competingBookings) {
      if (!booking.timeSlots) continue;
      
      const hasOverlap = timeSlots.some(targetSlot => 
        booking.timeSlots.some(bookingSlot => 
          hasTimeSlotConflict(targetSlot, bookingSlot, 0) // No cooldown for competition check
        )
      );
      
      if (hasOverlap) {
        conflictingBookings.push(booking);
      }
    }
    
    return conflictingBookings;
  } catch (error) {
    console.error("Error finding competing bookings:", error);
    return [];
  }
};

module.exports = {
  hasTimeSlotConflict,
  validateBookingTimeSlots,
  findConflictingBookings,
  findCompetingBookings,
  cleanupExpiredBookings
};
