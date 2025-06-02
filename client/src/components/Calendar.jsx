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

export default function Calendar({ 
  startDate, 
  endDate, 
  onDateChange, 
  minDate, 
  maxDate,
  blockedDates = [],
  blockedWeekdays = [],
  onBlockedDateClick = null
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
  
  // Check if a date is disabled (past dates, outside min/max range, blocked dates or weekdays)
  const isDisabled = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Check if the date is blocked by weekday
    const isBlockedWeekday = blockedWeekdays.includes(day.getDay());
    
    // Check if the date is explicitly blocked
    // Format the current day to string format for reliable comparison
    const formattedDay = format(day, "yyyy-MM-dd");
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
      return (isBefore(day, today) && !isSameDay(day, today)) || 
             (min && isBefore(day, min)) || 
             (max && isAfter(day, max)) ||
             isBlockedWeekday;
    }
    
    // For regular calendar, disable blocked dates
    return isBefore(day, today) || 
           (min && isBefore(day, min)) || 
           (max && isAfter(day, max)) ||
           isBlockedWeekday || 
           isBlockedDate;
  };

  // Get class names for a calendar day
  const getDayClass = (day) => {
    const isToday = isSameDay(day, new Date());
    const isStartDate = start && isSameDay(day, start);
    const isEndDate = end && isSameDay(day, end);
    const isWithinRange = isInRange(day);
    const isDisabledDate = isDisabled(day);
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
    const isPastDate = isBefore(day, new Date()) && day.getDate() !== new Date().getDate();
    
    // Check if this date is blocked (for visual indication in blocking calendar)
    const formattedDay = format(day, "yyyy-MM-dd");
    const isDateBlocked = blockedDates.some(blockedDate => {
      if (typeof blockedDate === "string") {
        return formattedDay === blockedDate;
      } else {
        return isSameDay(day, blockedDate);
      }
    });
    
    let classNames = "h-10 w-10 relative flex items-center justify-center ";
    
    // Add special positioning class for range start/end to handle half backgrounds
    if (isStartDate) {
      classNames += "rounded-l-full ";
    } else if (isEndDate) {
      classNames += "rounded-r-full ";
    } else {
      classNames += "rounded-full ";
    }
    
    if (!isCurrentMonth) {
      classNames += "text-gray-300 ";
    } else if (isDisabledDate) {
      classNames += "text-gray-300 cursor-not-allowed ";
    } else {
      classNames += "cursor-pointer hover:bg-gray-100 ";
      
      if (isStartDate || isEndDate) {
        classNames += "bg-blue-600 text-white hover:bg-blue-700 z-10 ";
      } else if (isWithinRange) {
        classNames += "bg-blue-100 text-blue-800 hover:bg-blue-200 ";
      }
      
      // For the date blocking calendar, highlight blocked dates
      if (onBlockedDateClick && isDateBlocked && isCurrentMonth) {
        classNames += "bg-red-100 text-red-800 hover:bg-red-200 ";
      }
      
      if (isToday) {
        classNames += isStartDate || isEndDate ? "" : "border-2 border-blue-500 ";
      }
    }
    
    return classNames;
  };

  // Generate horizontal connection line between start and end dates
  const renderDateRangeConnection = (day, idx) => {
    if (!start || (!end && !hoverDate) || isDisabled(day)) return null;
    
    // Skip rendering connections in the date blocking calendar
    if (onBlockedDateClick) return null;
    
    const isStartDate = start && isSameDay(day, start);
    const isEndDate = end ? isSameDay(day, end) : hoverDate && isSameDay(day, hoverDate);
    const isWithinRange = isInRange(day);
    
    // Only render connections for visible range dates in current month
    if ((isStartDate || isEndDate || isWithinRange) && day.getMonth() === currentMonth.getMonth()) {
      return (
        <div className="absolute inset-0 flex items-center">
          {/* Left connecting line (from middle to right edge of cell) */}
          {(isStartDate || isWithinRange) && !isEndDate && (
            <div className="h-full w-1/2 absolute right-0 bg-blue-100"></div>
          )}
          
          {/* Right connecting line (from left edge to middle of cell) */}
          {(isEndDate || isWithinRange) && !isStartDate && (
            <div className="h-full w-1/2 absolute left-0 bg-blue-100"></div>
          )}
          
          {/* Full cell background for range dates (not start or end) */}
          {isWithinRange && !isStartDate && !isEndDate && (
            <div className="h-full w-full absolute bg-blue-100"></div>
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
      className="w-full bg-white rounded-lg shadow p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button 
          type="button"
          onClick={() => handleMonthNavigation(-1)} 
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <button 
          type="button"
          onClick={() => handleMonthNavigation(1)} 
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const formattedDay = format(day, "yyyy-MM-dd");
          const isDateBlocked = blockedDates.some(blockedDate => {
            if (typeof blockedDate === "string") {
              return formattedDay === blockedDate;
            } else {
              return isSameDay(day, blockedDate);
            }
          });
          const isToday = isSameDay(day, new Date());
          
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
              
              {/* Show circle for start/end dates */}
              {isStartOrEnd(day) && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-7 w-7 rounded-full bg-blue-600"></span>
                </span>
              )}
              
              {/* Show blocked indicator for blocked dates in the blocking calendar */}
              {onBlockedDateClick && isDateBlocked && day.getMonth() === currentMonth.getMonth() && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="h-7 w-7 rounded-full bg-red-100 border-2 border-red-400"></span>
                </span>
              )}
              
              <span className="text-sm relative z-10">{format(day, "d")}</span>
              
              {/* Display X for disabled dates */}
              {isDisabled(day) && day.getMonth() === currentMonth.getMonth() && !onBlockedDateClick && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor" style={{ zIndex: 5 }}>
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              
              {/* Special indicator for blocked dates in the blocking calendar */}
              {onBlockedDateClick && isDateBlocked && day.getMonth() === currentMonth.getMonth() && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Selection guidance text */}
      <div className="mt-4 text-sm text-gray-500">
        {onBlockedDateClick ? 
          "Click dates to toggle blocked/unblocked status" : 
          selectingStart ? 
            "Select start date" : 
            "Select end date (hover to preview range)"
        }
      </div>
    </div>
  );
}
