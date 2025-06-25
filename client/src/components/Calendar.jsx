import { useState, useEffect, useCallback, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isBefore,
  isAfter,
  isWithinInterval,
  addMonths,
  parseISO
} from "date-fns";
import { getCurrentDateInUzbekistan, getCurrentDateObjectInUzbekistan, isDateInPastUzbekistan } from "../utils/uzbekistanTimezoneUtils";

export default function Calendar({ 
  startDate, 
  endDate, 
  onDateChange, 
  minDate, 
  maxDate,
  blockedDates = [],
  blockedWeekdays = [],
  onBlockedDateClick = null,
  selectedIndividualDates = [], // New prop for individual date selection
  onIndividualDateClick = null, // New prop for individual date selection handler
  individualDateMode = false, // New prop to enable individual date selection mode
  bookingPercentages = {}, // New prop for booking percentages by date
  completelyUnbookableDates = {}, // New prop for dates that are completely unbookable
  availableDatesUzbekistan = [], // New prop for timezone-aware available dates
  useTimezoneValidation = false // New prop to enable Uzbekistan timezone validation
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Initialize current month based on Uzbekistan timezone when timezone validation is enabled
    if (useTimezoneValidation) {
      return getCurrentDateObjectInUzbekistan();
    }
    return new Date();
  });
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingStart, setSelectingStart] = useState(!startDate);
  
  // Refs for touch events
  const calendarRef = useRef(null);
  const touchStartX = useRef(null);
  
  // Parse string dates into Date objects
  const start = startDate ? (typeof startDate === "string" ? parseISO(startDate) : startDate) : null;
  const end = endDate ? (typeof endDate === "string" ? parseISO(endDate) : endDate) : null;
  const min = minDate ? (typeof minDate === "string" ? parseISO(minDate) : minDate) : null;
  const max = maxDate ? (typeof maxDate === "string" ? parseISO(maxDate) : maxDate) : null;

  // Generate calendar days for the current month
  const generateDays = useCallback(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);
  
  // Reset selection state when external dates change
  useEffect(() => {
    if (!startDate && !endDate) {
      setSelectingStart(true);
    } else if (startDate && !endDate) {
      setSelectingStart(false);
    }
    
    // If both dates are set, prioritize showing the start date's month
    if (startDate) {
      setCurrentMonth(typeof startDate === "string" ? parseISO(startDate) : startDate);
    }
  }, [startDate, endDate]);

  // Handle date click
  const handleDateClick = (day) => {
    // Get formatted date for easier handling
    const formattedDate = format(day, "yyyy-MM-dd");
    
    // Check if the date is blocked
    const isBlockedDate = blockedDates.some(blockedDate => {
      if (typeof blockedDate === "string") {
        // Compare as YYYY-MM-DD strings for reliability
        return formattedDate === blockedDate;
      } else {
        return isSameDay(day, blockedDate);
      }
    });
    
    const isBlockedWeekday = blockedWeekdays.includes(day.getDay());
    
    // Handle past dates and min/max date restrictions for all calendars
    if ((min && isBefore(day, min)) || (max && isAfter(day, max))) {
      return;
    }
    
    // Special handling for individual date selection mode
    if (individualDateMode && onIndividualDateClick) {
      // In individual date mode, don't allow selecting blocked dates or weekdays
      if (isBlockedDate || isBlockedWeekday) {
        return;
      }
      onIndividualDateClick(formattedDate);
      return;
    }
    
    // Special handling for the date blocking calendar mode
    if (onBlockedDateClick) {
      // In date blocking mode, we allow clicking both blocked and unblocked dates
      onBlockedDateClick(formattedDate);
      return;
    }
    
    // For the regular calendar (date selection), don't allow choosing blocked dates
    if (isBlockedDate || isBlockedWeekday) {
      return;
    }
    
    // Normal date selection behavior for the main calendar
    if (selectingStart) {
      onDateChange(formattedDate, null);
      setSelectingStart(false);
    } else {
      // If clicked date is before start date, swap them
      if (start && isBefore(day, start)) {
        onDateChange(formattedDate, format(start, "yyyy-MM-dd"));
      } else {
        onDateChange(startDate, formattedDate);
      }
      setSelectingStart(true);
    }
  };
  
  // Handle hover effect for range selection
  const handleDateHover = (day) => {
    if (!selectingStart && start) {
      setHoverDate(day);
    }
  };
  
  // Navigate to next/previous month
  const handleMonthNavigation = (increment) => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, increment));
  };
  
  // Handle touch events for swiping
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;
    
    // Swipe threshold of 50px
    if (Math.abs(diffX) > 50) {
      // Swipe left (next month)
      if (diffX > 0) {
        handleMonthNavigation(1);
      } 
      // Swipe right (previous month)
      else {
        handleMonthNavigation(-1);
      }
    }
    
    touchStartX.current = null;
  };
  
  // Check if a date is within the selected range (or hovered range)
  const isInRange = (day) => {
    if (!start) return false;
    if (end) {
      return isWithinInterval(day, { start, end });
    }
    if (hoverDate && !selectingStart) {
      const rangeStart = isBefore(start, hoverDate) ? start : hoverDate;
      const rangeEnd = isBefore(start, hoverDate) ? hoverDate : start;
      return isWithinInterval(day, { start: rangeStart, end: rangeEnd });
    }
    return false;
  };
  
  // Check if a date is the start or end of the selected range
  const isStartOrEnd = (day) => {
    if (!day) return false;
    return (start && isSameDay(day, start)) || (end && isSameDay(day, end));
  };

  // Check if a date is individually selected
  const isIndividuallySelected = (day) => {
    if (!individualDateMode || !selectedIndividualDates.length) return false;
    const formattedDay = format(day, "yyyy-MM-dd");
    return selectedIndividualDates.some(selectedDate => {
      // Handle both string dates and objects with date property
      const dateStr = typeof selectedDate === "string" ? selectedDate : selectedDate.date;
      return dateStr === formattedDay;
    });
  };
  
  // Check if a date is disabled (past dates, outside min/max range, blocked dates or weekdays)
  const isDisabled = (day) => {
    // Format the current day to string format for reliable comparison
    const formattedDay = format(day, "yyyy-MM-dd");
    
    // If using timezone validation, check against Uzbekistan timezone availability
    if (useTimezoneValidation && availableDatesUzbekistan && availableDatesUzbekistan.length > 0) {
      // Date is disabled if it's not in the available dates from Uzbekistan timezone
      if (!availableDatesUzbekistan.includes(formattedDay)) {
        return true;
      }
    } else if (useTimezoneValidation) {
      // Use Uzbekistan timezone for past date validation when timezone validation is enabled
      if (isDateInPastUzbekistan(formattedDay)) {
        return true;
      }
    } else {
      // Fallback to local time validation if timezone validation is not enabled
      const today = getCurrentDateObjectInUzbekistan(); // Use Uzbekistan time as default
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      if (isBefore(day, today)) {
        return true;
      }
    }
    
    // Check if the date is blocked by weekday
    const isBlockedWeekday = blockedWeekdays.includes(day.getDay());
    
    // Check if the date is explicitly blocked
    const isBlockedDate = blockedDates.some(blockedDate => {
      if (typeof blockedDate === "string") {
        return formattedDay === blockedDate;
      } else {
        return isSameDay(day, blockedDate);
      }
    });
    
    // Special case for the date blocking calendar - don't disable blocked dates
    // Also allow selecting today when in date blocking mode
    if (onBlockedDateClick) {
      return (min && isBefore(day, min)) || 
             (max && isAfter(day, max)) ||
             isBlockedWeekday;
    }
    
    // For regular calendar, disable blocked dates and apply min/max constraints
    return (min && isBefore(day, min)) || 
           (max && isAfter(day, max)) ||
           isBlockedWeekday || 
           isBlockedDate;
  };

  // Get class names for a calendar day
  const getDayClass = (day) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    
    // Determine if today based on timezone validation setting
    let isToday, isPastDate;
    if (useTimezoneValidation) {
      const currentDateUzbekistan = getCurrentDateInUzbekistan();
      isToday = formattedDay === currentDateUzbekistan;
      isPastDate = isDateInPastUzbekistan(formattedDay);
    } else {
      const today = getCurrentDateObjectInUzbekistan(); // Use Uzbekistan time as default
      isToday = isSameDay(day, today);
      isPastDate = isBefore(day, today) && day.getDate() !== today.getDate();
    }
    
    const isStartDate = start && isSameDay(day, start);
    const isEndDate = end && isSameDay(day, end);
    const isWithinRange = isInRange(day);
    const isDisabledDate = isDisabled(day);
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
    const isIndividualSelected = isIndividuallySelected(day);
    
    // Check if this date is blocked (for visual indication in blocking calendar)
    // formattedDay is already declared above
    const isDateBlocked = blockedDates.some(blockedDate => {
      if (typeof blockedDate === "string") {
        return formattedDay === blockedDate;
      } else {
        return isSameDay(day, blockedDate);
      }
    });
    
    // Check booking percentage for this date
    const bookingPercentage = bookingPercentages[formattedDay] || 0;
    const isCompletelyUnbookable = completelyUnbookableDates[formattedDay] || false;
    
    let classNames = "h-10 w-10 relative flex items-center justify-center transition-all duration-200 ";
    
    // Use rounded rectangles instead of circles for better modern look
    classNames += "rounded-lg ";
    
    if (!isCurrentMonth) {
      classNames += "text-gray-300 ";
    } else if (isDisabledDate) {
      classNames += "text-gray-300 cursor-not-allowed ";
    } else {
      classNames += "cursor-pointer hover:scale-105 ";
      
      // Individual date selection styling (highest priority)
      if (individualDateMode && isIndividualSelected) {
        classNames += "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg z-20 ";
      }
      // Range selection styling
      else if (isStartDate || isEndDate) {
        classNames += "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg z-20 ";
      } else if (isWithinRange && !individualDateMode) {
        classNames += "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 ";
      } else {
        // Apply color coding based on booking percentage and unbookability
        if (!onBlockedDateClick && isCurrentMonth) {
          if (isCompletelyUnbookable || bookingPercentage === 100) {
            // Red: completely unbookable due to constraints OR 100% booked
            classNames += "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200 ";
          } else if (bookingPercentage === 0) {
            // Green: 0% booked and has available slots
            classNames += "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 ";
          } else if (bookingPercentage > 0) {
            // Orange: partially booked but still has available slots
            classNames += "bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200 ";
          } else {
            classNames += "hover:bg-blue-50 hover:border hover:border-blue-200 ";
          }
        } else {
          classNames += "hover:bg-blue-50 hover:border hover:border-blue-200 ";
        }
      }
      
      // For the date blocking calendar, highlight blocked dates
      if (onBlockedDateClick && isDateBlocked && isCurrentMonth) {
        classNames += "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 ";
      }
      
      if (isToday && !isStartDate && !isEndDate && !isIndividualSelected) {
        classNames += "ring-2 ring-blue-400 ring-offset-1 ";
      }
    }
    
    return classNames;
  };

  // Generate horizontal connection line between start and end dates
  const renderDateRangeConnection = (day, idx) => {
    if (!start || (!end && !hoverDate) || isDisabled(day)) return null;
    
    // Skip rendering connections in individual date mode or date blocking calendar
    if (individualDateMode || onBlockedDateClick) return null;
    
    const isStartDate = start && isSameDay(day, start);
    const isEndDate = end ? isSameDay(day, end) : hoverDate && isSameDay(day, hoverDate);
    const isWithinRange = isInRange(day);
    
    // Only render connections for visible range dates in current month
    if ((isStartDate || isEndDate || isWithinRange) && day.getMonth() === currentMonth.getMonth()) {
      return (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {/* Left connecting line - enhanced styling */}
          {(isStartDate || isWithinRange) && !isEndDate && (
            <div className="h-8 w-1/2 absolute right-0 bg-gradient-to-r from-blue-100 to-blue-200 opacity-60"></div>
          )}
          
          {/* Right connecting line - enhanced styling */}
          {(isEndDate || isWithinRange) && !isStartDate && (
            <div className="h-8 w-1/2 absolute left-0 bg-gradient-to-l from-blue-100 to-blue-200 opacity-60"></div>
          )}
          
          {/* Full cell background for range dates (not start or end) - enhanced styling */}
          {isWithinRange && !isStartDate && !isEndDate && (
            <div className="h-8 w-full absolute bg-gradient-to-r from-blue-100 via-blue-150 to-blue-100 opacity-60 rounded-md"></div>
          )}
        </div>
      );
    }
    return null;
  };

  const days = generateDays();
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div 
      ref={calendarRef}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar header with month navigation - improved styling */}
      <div className="flex items-center justify-between mb-6">
        <button 
          type="button"
          onClick={() => handleMonthNavigation(-1)} 
          className="p-2 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 border border-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <button 
          type="button"
          onClick={() => handleMonthNavigation(1)} 
          className="p-2 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 border border-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Weekday headers - improved styling */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((day) => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-semibold text-gray-600 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid - improved spacing */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const formattedDay = format(day, "yyyy-MM-dd");
          const isDateBlocked = blockedDates.some(blockedDate => {
            if (typeof blockedDate === "string") {
              return formattedDay === blockedDate;
            } else {
              return isSameDay(day, blockedDate);
            }
          });
          
          // Determine isToday based on timezone validation setting
          let isToday;
          if (useTimezoneValidation) {
            const formattedDay = format(day, "yyyy-MM-dd");
            const currentDateUzbekistan = getCurrentDateInUzbekistan();
            isToday = formattedDay === currentDateUzbekistan;
          } else {
            isToday = isSameDay(day, getCurrentDateObjectInUzbekistan()); // Use Uzbekistan time as default
          }
          
          return (
            <div
              key={idx}
              className={getDayClass(day)}
              onClick={() => !isDisabled(day) && day.getMonth() === currentMonth.getMonth() && handleDateClick(day)}
              onMouseEnter={() => handleDateHover(day)}
              aria-disabled={isDisabled(day)}
            >
              {/* Date range connection background */}
              {renderDateRangeConnection(day, idx)}
              
              {/* Show square indicators for start/end dates */}
              {isStartOrEnd(day) && !individualDateMode && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="h-8 w-8 rounded-lg bg-blue-600 shadow-lg border-2 border-white"></span>
                </span>
              )}

              {/* Show indicators for individually selected dates */}
              {individualDateMode && isIndividuallySelected(day) && day.getMonth() === currentMonth.getMonth() && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="h-8 w-8 rounded-lg bg-green-600 shadow-lg border-2 border-white"></span>
                </span>
              )}
              
              {/* Show blocked indicator for blocked dates in the blocking calendar */}
              {onBlockedDateClick && isDateBlocked && day.getMonth() === currentMonth.getMonth() && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="h-8 w-8 rounded-lg bg-red-100 border-2 border-red-400 shadow-sm"></span>
                </span>
              )}
              
              <span className="text-sm relative z-10 font-medium">{format(day, "d")}</span>
              
              {/* Display X for disabled dates with improved styling */}
              {isDisabled(day) && day.getMonth() === currentMonth.getMonth() && !onBlockedDateClick && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 opacity-60" viewBox="0 0 20 20" fill="currentColor" style={{ zIndex: 5 }}>
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              
              {/* Special indicator for blocked dates in the blocking calendar with improved styling */}
              {onBlockedDateClick && isDateBlocked && day.getMonth() === currentMonth.getMonth() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 z-10 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selection guidance text - improved styling */}
      <div className="mt-5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-sm text-gray-600 text-center font-medium">
          {onBlockedDateClick ? 
            "✨ Click dates to toggle blocked/unblocked status" : 
            individualDateMode ?
              "🎯 Select individual dates for booking" :
              selectingStart ? 
                "📅 Select your start date" : 
                "📅 Select your end date (hover to preview range)"
          }
        </p>
      </div>

      {/* Color coding legend */}
      {!onBlockedDateClick && (Object.keys(bookingPercentages).length > 0 || Object.keys(completelyUnbookableDates).length > 0) && (
        <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-600 mb-2 font-medium">Availability Legend:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-100 border border-green-200 rounded mr-1"></div>
              <span className="text-xs text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-orange-100 border border-orange-200 rounded mr-1"></div>
              <span className="text-xs text-gray-600">Partially Booked</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-100 border border-red-200 rounded mr-1"></div>
              <span className="text-xs text-gray-600">Fully Booked / Unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
