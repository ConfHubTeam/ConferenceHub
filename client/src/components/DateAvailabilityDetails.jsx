import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { 
  formatHourTo12, 
  getBookedTimeSlots, 
  getAvailableTimeSlots, 
  isTimeBlocked,
  isValidStartTimeEnhanced,
} from "../utils/TimeUtils";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

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
  placeDetail = {} 
}) {
  const { i18n } = useTranslation();

  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
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
    const dayName = format(dateObj, 'EEEE', { locale: getDateLocale() });
    
    // Use getAvailableTimeSlots to get the correct time range for this day
    const availableTimeSlots = getAvailableTimeSlots(date, weekdayTimeSlots, checkIn, checkOut);
    setTimeRange(availableTimeSlots);
  
    // Generate time slots for the day based on working hours, then filter out empty past hours in Uzbekistan timezone
    const startHour = parseInt(availableTimeSlots.start.split(":")[0], 10);
    const endHour = parseInt(availableTimeSlots.end.split(":")[0], 10);
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    // Safety check for NaN values
    if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
      setAllTimeSlots([]);
      return;
    }
    
    // Get current time in Uzbekistan timezone using utility function
    const uzbekistanNow = getCurrentDateObjectInUzbekistan();
    
    // Get the selected date as a proper date string (YYYY-MM-DD format)
    let selectedDateString;
    if (typeof date === "string") {
      // If it's already a string, check if it's in YYYY-MM-DD format
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        selectedDateString = date;
      } else {
        // Parse and reformat to ensure YYYY-MM-DD
        selectedDateString = format(parseISO(date), 'yyyy-MM-dd');
      }
    } else {
      // If it's a Date object, format it to YYYY-MM-DD
      selectedDateString = format(date, 'yyyy-MM-dd');
    }
    
    const uzbekistanDateString = format(uzbekistanNow, 'yyyy-MM-dd');
    const isToday = selectedDateString === uzbekistanDateString;
    
    // For agent/host view, hide the current hour completely if any part has passed
    // If it's 3:25 PM, hide 3:00 PM and only show 4:00 PM onwards
    // This is different from client booking view which may allow current hour bookings
    const currentHour = isToday ? uzbekistanNow.getHours() : -1;
    const currentMinutes = isToday ? uzbekistanNow.getMinutes() : 0;
    const effectiveCurrentHour = isToday ? currentHour + 1 : -1; // Always use next hour for agent/host view
    
    const slots = [];
    // Generate slots within the working hours range + end hour as "Day End"
    for (let hour = startHour; hour <= endHour; hour++) { // Include end hour as "Day End" slot
      const isPastHour = isToday && hour < effectiveCurrentHour;
      const isEndHour = hour === endHour;
      const timeSlot = {
        hour: hour,
        time24: `${hour.toString().padStart(2, "0")}:00`,
        display: formatHourTo12(`${hour.toString().padStart(2, "0")}:00`),
        isBooked: false,
        isInCooldown: false,
        isConflicted: false,
        isWorkingHoursEnd: isEndHour,
        isPast: isPastHour,
        booking: null
      };
      
      // Skip business logic for "Day End" slot - it's just for display
      if (isEndHour) {
        slots.push(timeSlot);
        continue;
      }
      
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
      
      // Check for conflicts - both booking conflicts AND end-of-day constraints
      let hasActualConflict = false;
      
      if (!booking && !isInCooldownPeriod && !timeSlot.isWorkingHoursEnd) {
        if (slotsForDate.length > 0) {
          // If there are existing bookings, check for conflicts including cooldown
          const isValidStart = isValidStartTimeEnhanced(
            date,
            timeSlot.time24,
            slotsForDate,
            placeDetail.minimumHours || 1,
            availableTimeSlots.end,
            cooldownMinutes
          );
          
          if (!isValidStart) {
            hasActualConflict = true;
          }
        } else {
          // If no existing bookings, only check end-of-day constraints without cooldown
          const startHour = parseInt(timeSlot.time24.split(':')[0], 10);
          const placeEndHour = parseInt(availableTimeSlots.end.split(':')[0], 10);
          const minimumHours = placeDetail.minimumHours || 1;
          
          // Check if there's enough time for minimum booking (without cooldown)
          const availableTimeBeforeClose = placeEndHour - startHour;
          if (availableTimeBeforeClose < minimumHours) {
            hasActualConflict = true;
          }
        }
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
    
    // Filter out past hours that are empty (not booked, not in cooldown, not conflicted)
    // Keep past hours only if they have important status information
    // Always show "Day End" slot
    const filteredSlots = slots.filter(slot => {
      // Always show "Day End" slot
      if (slot.isWorkingHoursEnd) {
        return true;
      }
      
      const isPastHour = isToday && slot.hour < effectiveCurrentHour;
      
      if (!isPastHour) {
        // Not a past hour, always show
        return true;
      }
      
      // Past hour - only show if it has important status (hide empty available past slots)
      return slot.isBooked || slot.isInCooldown || slot.isConflicted;
    });
    
    setAllTimeSlots(filteredSlots);
    
  }, [date, bookedTimeSlots, placeDetail]);

  if (!date) return null;
  
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy", { locale: getDateLocale() });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
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
                    p-3 rounded-lg flex items-center relative
                    ${slot.isPast ? 'opacity-60' : ''}
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
                  {/* X icon for past slots */}
                  {slot.isPast && (
                    <div className="absolute top-1 right-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  
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
                    <div className={`font-medium ${slot.isPast ? 'text-gray-500 line-through' : ''}`}>
                      {slot.display}
                    </div>
                    <div className="text-xs mt-0.5">
                      {slot.isBooked ? (
                        <span className={slot.isPast ? 'text-gray-500' : 'text-red-700'}>
                          Booked{slot.isPast ? ' (Past)' : ''}
                        </span>
                      ) : slot.isInCooldown ? (
                        <span className={slot.isPast ? 'text-gray-500' : 'text-orange-700'}>
                          Cooldown{slot.isPast ? ' (Past)' : ''}
                        </span>
                      ) : slot.isConflicted ? (
                        <span className={slot.isPast ? 'text-gray-500' : 'text-purple-700'}>
                          Conflicts{slot.isPast ? ' (Past)' : ''}
                        </span>
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
