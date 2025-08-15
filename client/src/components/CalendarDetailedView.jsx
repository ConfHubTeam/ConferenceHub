import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { 
  formatHourTo12, 
  getBookedTimeSlots, 
  getAvailableTimeSlots, 
  isTimeBlocked,
  isValidStartTimeEnhanced,
} from "../utils/TimeUtils";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * Calculate duration in hours from start and end hours
 * @param {number} startHour - Start hour (e.g., 9.5 for 9:30)
 * @param {number} endHour - End hour (e.g., 11.5 for 11:30)
 * @returns {string} - Formatted duration (e.g., "2h", "1h 30m", "30m")
 */
const calculateDuration = (startHour, endHour) => {
  const durationHours = endHour - startHour;
  const hours = Math.floor(durationHours);
  const minutes = Math.round((durationHours % 1) * 60);
  
  if (hours === 0 && minutes === 0) return "0m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

/**
 * CalendarDetailedView Component
 * 
 * Enhanced inline hourly availability view for the calendar page.
 * Shows detailed time slot availability for a specific date with excellent UX.
 * 
 * Single Responsibility: Display detailed hourly availability in an inline format
 * Open/Closed: Extensible for new availability features
 * DRY: Reuses existing time utilities and follows project patterns
 */
export default function CalendarDetailedView({ 
  date, 
  bookedTimeSlots = [],
  placeDetail = {} 
}) {
  const { t, i18n } = useTranslation("calendar");
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [timeRange, setTimeRange] = useState({ start: "09:00", end: "17:00" });

  // Helper function to format hour based on language preference
  const formatHourForDisplay = (hour) => {
    if (!hour) return "";
    
    const currentLanguage = i18n.language;
    const hourNum = parseInt(hour.split(':')[0], 10);
    
    // Use 24-hour format for Russian and Uzbek, 12-hour format for English
    if (currentLanguage === 'ru' || currentLanguage === 'uz') {
      return `${hourNum.toString().padStart(2, '0')}:00`;
    } else {
      return formatHourTo12(hour);
    }
  };

  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };

  // Generate time slots for the selected date
  useEffect(() => {
    if (!date) {
      setAllTimeSlots([]);
      return;
    }

    // Get all bookings for this date
    const slotsForDate = getBookedTimeSlots(date, bookedTimeSlots);
    
    // Get place details
    const { checkIn, checkOut, weekdayTimeSlots } = placeDetail;
    
    // Ensure date is properly parsed
    const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
    
    // Use getAvailableTimeSlots to get the correct time range for this day
    const availableTimeSlots = getAvailableTimeSlots(date, weekdayTimeSlots, checkIn, checkOut);
    setTimeRange(availableTimeSlots);

    // Generate time slots for the day based on working hours
    const startHour = parseInt(availableTimeSlots.start.split(":")[0], 10);
    const endHour = parseInt(availableTimeSlots.end.split(":")[0], 10);
    const cooldownMinutes = placeDetail.cooldown || 0;
    
    // Safety check for NaN values
    if (isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
      setAllTimeSlots([]);
      return;
    }
    
    // Get current time in Uzbekistan timezone
    const uzbekistanNow = getCurrentDateObjectInUzbekistan();
    
    // Get the selected date as a proper date string (YYYY-MM-DD format)
    let selectedDateString;
    if (typeof date === "string") {
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        selectedDateString = date;
      } else {
        selectedDateString = format(parseISO(date), 'yyyy-MM-dd');
      }
    } else {
      selectedDateString = format(date, 'yyyy-MM-dd');
    }
    
    const uzbekistanDateString = format(uzbekistanNow, 'yyyy-MM-dd');
    const isToday = selectedDateString === uzbekistanDateString;
    
    // For agent/host view, hide the current hour completely if any part has passed
    const currentHour = isToday ? uzbekistanNow.getHours() : -1;
    const effectiveCurrentHour = isToday ? currentHour + 1 : -1;
    
    // Create time ranges instead of individual hour slots
    const timeRanges = [];
    let currentSlotStart = startHour;
    
    // Sort bookings by start time to process them chronologically
    const sortedBookings = [...slotsForDate].sort((a, b) => {
      const aStart = parseInt(a.startTime.split(':')[0], 10);
      const bStart = parseInt(b.startTime.split(':')[0], 10);
      return aStart - bStart;
    });
    
    // Process each booking and create time ranges
    sortedBookings.forEach((booking) => {
      const bookingStartHour = parseInt(booking.startTime.split(":")[0], 10);
      const bookingEndHour = parseInt(booking.endTime.split(":")[0], 10);
      
      // Add available time before this booking (if any)
      if (currentSlotStart < bookingStartHour) {
        const isStartPast = isToday && currentSlotStart < effectiveCurrentHour;
        const isEndPast = isToday && bookingStartHour <= effectiveCurrentHour;
        const isCompletelyPast = isToday && bookingStartHour <= effectiveCurrentHour;
        
        // Only add available time ranges that are not completely in the past
        if (!isCompletelyPast) {
          // Check if this time slot is actually bookable considering cooldown and minimum hours
          const timeSlotStartTime = `${currentSlotStart.toString().padStart(2, "0")}:00`;
          const placeEndTime = `${endHour.toString().padStart(2, "0")}:00`;
          const minimumHours = placeDetail.minimumHours || 1;
          
          // Check if this time slot is actually bookable
          const isBookable = isValidStartTimeEnhanced(
            date,
            timeSlotStartTime,
            sortedBookings, // Use existing bookings as blocked time slots
            minimumHours,
            placeEndTime,
            cooldownMinutes
          );
          
          timeRanges.push({
            startHour: currentSlotStart,
            endHour: bookingStartHour,
            startTime: `${currentSlotStart.toString().padStart(2, "0")}:00`,
            endTime: `${bookingStartHour.toString().padStart(2, "0")}:00`,
            displayStart: formatHourForDisplay(`${currentSlotStart.toString().padStart(2, "0")}:00`),
            displayEnd: formatHourForDisplay(`${bookingStartHour.toString().padStart(2, "0")}:00`),
            status: isBookable ? 'available' : 'notBookable',
            bookingId: null,
            booking: null,
            isPast: isEndPast,
            isPartiallyPast: isStartPast && !isEndPast
          });
        }
      }
      
      // Add the booked time range
      const isBookingPast = isToday && bookingEndHour <= effectiveCurrentHour;
      const isBookingPartiallyPast = isToday && bookingStartHour < effectiveCurrentHour && bookingEndHour > effectiveCurrentHour;
      
      timeRanges.push({
        startHour: bookingStartHour,
        endHour: bookingEndHour,
        startTime: booking.startTime,
        endTime: booking.endTime,
        displayStart: formatHourForDisplay(booking.startTime),
        displayEnd: formatHourForDisplay(booking.endTime),
        status: 'booked',
        bookingId: booking.bookingId || booking.id,
        uniqueRequestId: booking.uniqueRequestId,
        booking: booking,
        isPast: isBookingPast,
        isPartiallyPast: isBookingPartiallyPast
      });
      
      // Add cooldown period after this booking (if any)
      if (cooldownMinutes > 0) {
        const cooldownHours = cooldownMinutes / 60;
        const cooldownEndHour = Math.min(bookingEndHour + cooldownHours, endHour);
        
        if (cooldownEndHour > bookingEndHour) {
          const isCooldownPast = isToday && cooldownEndHour <= effectiveCurrentHour;
          const isCooldownPartiallyPast = isToday && bookingEndHour < effectiveCurrentHour && cooldownEndHour > effectiveCurrentHour;
          
          timeRanges.push({
            startHour: bookingEndHour,
            endHour: cooldownEndHour,
            startTime: booking.endTime,
            endTime: `${Math.floor(cooldownEndHour).toString().padStart(2, "0")}:${((cooldownEndHour % 1) * 60).toString().padStart(2, "0")}`,
            displayStart: formatHourForDisplay(booking.endTime),
            displayEnd: formatHourForDisplay(`${Math.floor(cooldownEndHour).toString().padStart(2, "0")}:${((cooldownEndHour % 1) * 60).toString().padStart(2, "0")}`),
            status: 'cooldown',
            bookingId: null,
            booking: null,
            isPast: isCooldownPast,
            isPartiallyPast: isCooldownPartiallyPast
          });
        }
      }
      
      currentSlotStart = Math.max(currentSlotStart, bookingEndHour + (cooldownMinutes / 60));
    });
    
    // If no bookings, create a single available slot for the entire day
    if (sortedBookings.length === 0) {
      const isStartPast = isToday && startHour < effectiveCurrentHour;
      const isEndPast = isToday && endHour <= effectiveCurrentHour;
      const isCompletelyPast = isToday && endHour <= effectiveCurrentHour;
      
      // Only show the day as available if it's not completely in the past
      if (!isCompletelyPast) {
        // Even with no bookings, check if the time slots are bookable considering minimum hours and end time
        const timeSlotStartTime = `${startHour.toString().padStart(2, "0")}:00`;
        const placeEndTime = `${endHour.toString().padStart(2, "0")}:00`;
        const minimumHours = placeDetail.minimumHours || 1;
        
        // Check if this time slot is actually bookable
        const isBookable = isValidStartTimeEnhanced(
          date,
          timeSlotStartTime,
          [], // No existing bookings
          minimumHours,
          placeEndTime,
          cooldownMinutes
        );
        
        timeRanges.push({
          startHour: startHour,
          endHour: endHour,
          startTime: `${startHour.toString().padStart(2, "0")}:00`,
          endTime: `${endHour.toString().padStart(2, "0")}:00`,
          displayStart: formatHourForDisplay(`${startHour.toString().padStart(2, "0")}:00`),
          displayEnd: formatHourForDisplay(`${endHour.toString().padStart(2, "0")}:00`),
          status: isBookable ? 'available' : 'notBookable',
          bookingId: null,
          booking: null,
          isPast: isEndPast,
          isPartiallyPast: isStartPast && !isEndPast
        });
      }
    } else {
      // Add any remaining available time at the end (only if there were bookings)
      if (currentSlotStart < endHour) {
        const isStartPast = isToday && currentSlotStart < effectiveCurrentHour;
        const isEndPast = isToday && endHour <= effectiveCurrentHour;
        const isCompletelyPast = isToday && endHour <= effectiveCurrentHour;
        
        // Only add available time ranges that are not completely in the past
        if (!isCompletelyPast) {
          // Check if this time slot is actually bookable considering cooldown and minimum hours
          const timeSlotStartTime = `${Math.floor(currentSlotStart).toString().padStart(2, "0")}:${((currentSlotStart % 1) * 60).toString().padStart(2, "0")}`;
          const placeEndTime = `${endHour.toString().padStart(2, "0")}:00`;
          const minimumHours = placeDetail.minimumHours || 1;
          
          // Check if this time slot is actually bookable
          const isBookable = isValidStartTimeEnhanced(
            date,
            timeSlotStartTime,
            sortedBookings, // Use existing bookings as blocked time slots
            minimumHours,
            placeEndTime,
            cooldownMinutes
          );
          
          timeRanges.push({
            startHour: currentSlotStart,
            endHour: endHour,
            startTime: `${Math.floor(currentSlotStart).toString().padStart(2, "0")}:${((currentSlotStart % 1) * 60).toString().padStart(2, "0")}`,
            endTime: `${endHour.toString().padStart(2, "0")}:00`,
            displayStart: formatHourForDisplay(`${Math.floor(currentSlotStart).toString().padStart(2, "0")}:${((currentSlotStart % 1) * 60).toString().padStart(2, "0")}`),
            displayEnd: formatHourForDisplay(`${endHour.toString().padStart(2, "0")}:00`),
            status: isBookable ? 'available' : 'notBookable',
            bookingId: null,
            booking: null,
            isPast: isEndPast,
            isPartiallyPast: isStartPast && !isEndPast
          });
        }
      }
    }
    
    setAllTimeSlots(timeRanges);
    
  }, [date, bookedTimeSlots, placeDetail]);

  // Get bookings for the selected date
  const bookings = useMemo(() => {
    if (!date) return [];
    return getBookedTimeSlots(date, bookedTimeSlots);
  }, [date, bookedTimeSlots]);

  if (!date) return null;
  
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy", { locale: getDateLocale() });
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
      {/* Operating Hours Header */}
      <div className="mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center text-sm text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {t("detailedView.operatingHours", "Operating Hours")}: <strong>{formatHourForDisplay(timeRange.start)} - {formatHourForDisplay(timeRange.end)}</strong>
            </span>
          </div>
        </div>
      </div>
      
      {/* Time Slots Table */}
      <div className="mb-6">
        {allTimeSlots.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">
              {(() => {
                const isToday = format(parseISO(date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const currentHour = new Date().getHours();
                const endHour = parseInt(timeRange.end.split(':')[0], 10);
                
                if (isToday && currentHour >= endHour) {
                  return t("detailedView.dayComplete", "Operating hours have ended for today");
                } else {
                  return t("detailedView.noTimeSlots", "No time slots available for this date");
                }
              })()}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("detailedView.table.timeRange", "Time Range")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("detailedView.table.status", "Status")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("detailedView.table.hours", "Hours")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("detailedView.table.bookingId", "Booking ID")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allTimeSlots.map((slot, index) => (
                  <tr 
                    key={index} 
                    className={`
                      ${slot.isPast ? 'opacity-60 bg-gray-50' : ''}
                      ${slot.isPartiallyPast ? 'bg-yellow-50' : ''}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    {/* Time Range */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${slot.isPast ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {slot.displayStart}–{slot.displayEnd}
                      </div>
                      {slot.isPartiallyPast && (
                        <div className="text-xs text-yellow-600">
                          {t("detailedView.partiallyPast", "Partially past")}
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          slot.status === 'booked' 
                            ? 'bg-red-500' 
                            : slot.status === 'cooldown'
                              ? 'bg-orange-500'
                              : slot.status === 'notBookable'
                                ? 'bg-gray-400'
                                : 'bg-green-500'
                        }`}></div>
                        <span className={`text-sm font-medium capitalize ${
                          slot.status === 'booked' 
                            ? 'text-red-700' 
                            : slot.status === 'cooldown'
                              ? 'text-orange-700'
                              : slot.status === 'notBookable'
                                ? 'text-gray-600'
                                : 'text-green-700'
                        }`}>
                          {t(`detailedView.status.${slot.status}`, slot.status)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Hours */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {calculateDuration(slot.startHour, slot.endHour)}
                      </span>
                    </td>
                    
                    {/* Booking ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {slot.bookingId ? (
                        <Link 
                          to={`/account/bookings/${slot.bookingId}`}
                          className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-blue-50 px-2 py-1 rounded border border-blue-200"
                        >
                          {slot.uniqueRequestId || `REQ-${slot.bookingId}`}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-semibold text-gray-800 mb-3">{t("detailedView.legend.title", "Legend")}</h5>
        <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-700">{t("detailedView.legend.booked", "Booked")}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-gray-700">{t("detailedView.legend.cooldown", "Cooldown")}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-gray-700">{t("detailedView.legend.notBookable", "Not Bookable")}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-gray-700">{t("detailedView.legend.dayEnd", "Day End")}</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-700">{t("detailedView.legend.available", "Available")}</span>
          </div>
        </div>
      </div>

      {/* Cooldown information */}
      {placeDetail.cooldown && placeDetail.cooldown > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium">
                {t("detailedView.cooldown.title", "Cooldown Policy")}
              </p>
              <p className="text-xs mt-1">
                {t("detailedView.cooldown.description", "After each booking, there is a")} {Math.floor(placeDetail.cooldown / 60)}h {placeDetail.cooldown % 60}m {t("detailedView.cooldown.period", "cooldown period where no new bookings can be made.")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
