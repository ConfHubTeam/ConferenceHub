/**
 * Enhanced booking conflict detection utilities
 */

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
 * Validate booking time slots against existing bookings
 */
const validateBookingTimeSlots = async (timeSlots, placeId, cooldownMinutes = 0) => {
  try {
    // Get all confirmed bookings for this place
    const { Booking } = require("../models");
    const existingBookings = await Booking.findAll({
      where: {
        placeId: placeId,
        status: 'approved'
      }
    });
    
    // Check each proposed time slot against existing bookings
    for (const proposedSlot of timeSlots) {
      for (const existingBooking of existingBookings) {
        if (!existingBooking.timeSlots) continue;
        
        for (const existingSlot of existingBooking.timeSlots) {
          if (hasTimeSlotConflict(proposedSlot, existingSlot, cooldownMinutes)) {
            return {
              isValid: false,
              message: `Time slot ${proposedSlot.startTime}-${proposedSlot.endTime} on ${proposedSlot.date} conflicts with existing booking`,
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

module.exports = {
  hasTimeSlotConflict,
  validateBookingTimeSlots,
  findConflictingBookings
};
