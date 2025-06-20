import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { 
  formatHourTo12, 
  getBookedTimeSlots, 
  getAvailableTimeSlots, 
  isTimeBlocked,
  hasConflictWithExistingBookings,
  isValidStartTimeEnhanced 
} from "../utils/TimeUtils";

/**
 * DateAvailabilityDetails Component
 * 
 * Shows detailed time slot availability for a specific date
 * Used by hosts and agents to check booking status
 */
export default function DateAvailabilityDetails({ 
  date, 
  onClose, 
  bookedTimeSlots = [],
  placeDetail
}) {
  const [bookings, setBookings] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [timeRange, setTimeRange] = useState({ start: "09:00", end: "17:00" });
  
  useEffect(() => {
    // Get all bookings for this date
    const slotsForDate = getBookedTimeSlots(date, bookedTimeSlots);
    setBookings(slotsForDate);
    
    // Get place details
    const { checkIn, checkOut, weekdayTimeSlots } = placeDetail;
    
    // Ensure date is properly parsed
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const dayOfWeek = dateObj.getDay(); // 0-6 (Sunday-Saturday)
    const dayName = format(dateObj, 'EEEE');
    
    // Use getAvailableTimeSlots to get the correct time range for this day
    const availableTimeSlots = getAvailableTimeSlots(date, weekdayTimeSlots, checkIn, checkOut);
    setTimeRange(availableTimeSlots);
  
    // Generate all possible time slots for the day using the correct time range
    const startHour = parseInt(availableTimeSlots.start.split(":")[0], 10);
    const endHour = parseInt(availableTimeSlots.end.split(":")[0], 10);
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const timeSlot = {
        hour: hour,
        time24: `${hour.toString().padStart(2, "0")}:00`,
        display: formatHourTo12(`${hour.toString().padStart(2, "0")}:00`),
        isBooked: false,
        isInCooldown: false,
        isConflicted: false, // New field for enhanced conflict detection
        isWorkingHoursEnd: hour === endHour,
        booking: null
      };
      
      // Check if this time slot is blocked by actual bookings or cooldown (legacy check)
      const isBlocked = isTimeBlocked(
        date,
        timeSlot.time24,
        slotsForDate,
        placeDetail.minimumHours || 1,
        availableTimeSlots.end,
        cooldownMinutes
      );
      
      // Check if this hour is directly booked
      const booking = slotsForDate.find(booking => {
        const bookingStartHour = parseInt(booking.startTime.split(":")[0], 10);
        const bookingEndHour = parseInt(booking.endTime.split(":")[0], 10);
        return hour >= bookingStartHour && hour < bookingEndHour;
      });
      
      // Check if this hour is in a cooldown period
      const isInCooldownPeriod = slotsForDate.some(slot => {
        const bookedEndHour = parseInt(slot.endTime.split(':')[0], 10);
        const cooldownHours = cooldownMinutes / 60;
        const cooldownEndHour = bookedEndHour + cooldownHours;
        return hour >= bookedEndHour && hour < cooldownEndHour;
      });
      
      // Only check for booking conflicts if this slot is not already booked or in cooldown
      let hasActualConflict = false;
      
      if (!booking && !isInCooldownPeriod && !timeSlot.isWorkingHoursEnd && slotsForDate.length > 0) {
        const minEndHour = hour + (placeDetail.minimumHours || 1);
        const cooldownEndHour = minEndHour + (cooldownMinutes / 60);
        
        // Only check for actual booking conflicts, not time constraints
        hasActualConflict = slotsForDate.some(existingSlot => {
          const existingStart = parseInt(existingSlot.startTime.split(':')[0], 10);
          const existingEnd = parseInt(existingSlot.endTime.split(':')[0], 10);
          
          // Would the proposed booking + cooldown overlap with existing booking?
          return (minEndHour > existingStart && hour < existingEnd) || 
                 (cooldownEndHour > existingStart && minEndHour <= existingStart);
        });
      }
      
      if (booking) {
        timeSlot.isBooked = true;
        timeSlot.booking = booking;
      } else if (isInCooldownPeriod) {
        timeSlot.isInCooldown = true;
      } else if (hasActualConflict) {
        // Mark as conflicted only when there's an actual scheduling conflict
        timeSlot.isConflicted = true;
      }
      
      slots.push(timeSlot);
    }
    
    setAllTimeSlots(slots);
    
  }, [date, bookedTimeSlots, placeDetail]);

  if (!date) return null;
  
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy");
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0121 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Daily Schedule
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900 font-medium">
            {formattedDate}
          </p>
          <div className="flex items-center mt-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-700">
              Operating Hours: <strong>{formatHourTo12(timeRange.start)} - {formatHourTo12(timeRange.end)}</strong>
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Time Slot Availability</h4>
          
          {allTimeSlots.length === 0 ? (
            <p className="text-gray-500 italic">No time slots available for this date.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allTimeSlots.map((slot, index) => (
                <div 
                  key={slot.time24} 
                  className={`
                    p-3 rounded-lg flex items-center
                    ${slot.isBooked 
                      ? 'bg-red-50 border border-red-200' 
                      : slot.isInCooldown
                        ? 'bg-orange-50 border border-orange-200'
                        : slot.isConflicted
                          ? 'bg-purple-50 border border-purple-200'
                          : slot.isWorkingHoursEnd
                            ? 'bg-gray-50 border border-gray-200'
                            : 'bg-green-50 border border-green-200'
                    }
                  `}
                >
                  <div className={`w-2 h-8 rounded-full mr-3 ${
                    slot.isBooked 
                      ? 'bg-red-500' 
                      : slot.isInCooldown
                        ? 'bg-orange-500'
                        : slot.isConflicted
                          ? 'bg-purple-500'
                          : slot.isWorkingHoursEnd
                            ? 'bg-gray-500'
                            : 'bg-green-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{slot.display}</div>
                    <div className="text-xs mt-0.5">
                      {slot.isBooked ? (
                        <span className="text-red-700">Booked</span>
                      ) : slot.isInCooldown ? (
                        <span className="text-orange-700">Cooldown</span>
                      ) : slot.isConflicted ? (
                        <span className="text-purple-700">Conflicts</span>
                      ) : slot.isWorkingHoursEnd ? (
                        <span className="text-gray-700">Day End</span>
                      ) : (
                        <span className="text-green-700">Available</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Legend for time slot colors */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Legend</h5>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-red-500 rounded mr-1"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-orange-500 rounded mr-1"></div>
                <span>Cooldown</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-purple-500 rounded mr-1"></div>
                <span>Not bookable</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-gray-500 rounded mr-1"></div>
                <span>Day End</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-500 rounded mr-1"></div>
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cooldown information */}
        {placeDetail.cooldown && placeDetail.cooldown > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">
                <strong>Cooldown period:</strong> {placeDetail.cooldown >= 60 ? `${Math.floor(placeDetail.cooldown / 60)}h ${placeDetail.cooldown % 60 > 0 ? `${placeDetail.cooldown % 60}min` : ''}`.trim() : `${placeDetail.cooldown} min`} after each booking
              </p>
            </div>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-2">Bookings</h4>
            <div className="space-y-3">
              {bookings.map((booking, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-900">
                        {formatHourTo12(booking.startTime)} - {formatHourTo12(booking.endTime)}
                      </p>
                      {booking.userName && (
                        <p className="text-sm text-blue-800 mt-1">
                          Booked by: {booking.userName}
                        </p>
                      )}
                    </div>
                    
                    {booking.status && (
                      <span className={`
                        text-xs px-2 py-1 rounded-full font-medium uppercase
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {booking.status}
                      </span>
                    )}
                  </div>
                  
                  {booking.notes && (
                    <p className="mt-3 text-sm text-gray-600 bg-white p-2 rounded">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
