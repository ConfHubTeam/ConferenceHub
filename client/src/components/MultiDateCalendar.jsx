import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  parseISO,
  isValid
} from "date-fns";
import { 
  getCurrentDateObjectInUzbekistan,
  isDateInPastUzbekistan 
} from "../utils/uzbekistanTimezoneUtils";

/**
 * MultiDateCalendar Component
 * A calendar specifically designed for selecting multiple dates
 * Follows Single Responsibility Principle by focusing only on date selection
 * 
 * @param {Object} props - Component properties
 * @param {Date[]} props.selectedDates - Array of currently selected dates
 * @param {Function} props.onDateToggle - Callback when a date is toggled (selected/deselected)
 * @param {Date|string} [props.minDate] - Optional minimum selectable date
 * @param {Array<Date|string>} [props.disabledDates] - Optional array of disabled dates
 * @returns {React.ReactElement} Calendar component
 */
export default function MultiDateCalendar({ 
  selectedDates = [], 
  onDateToggle, 
  minDate = getCurrentDateObjectInUzbekistan(),
  disabledDates = []
}) {
  const { t } = useTranslation("calendar");
  
  // Helper function to get translated month name
  const getTranslatedMonth = useCallback((date) => {
    const monthIndex = date.getMonth();
    const monthKeys = [
      "months.january",
      "months.february", 
      "months.march",
      "months.april",
      "months.may",
      "months.june",
      "months.july",
      "months.august",
      "months.september",
      "months.october",
      "months.november",
      "months.december"
    ];
    return t(monthKeys[monthIndex]);
  }, [t]);
  
  // Current month being displayed in Uzbekistan timezone
  const [currentMonth, setCurrentMonth] = useState(getCurrentDateObjectInUzbekistan());
  
  // Two months for desktop view
  const [secondMonth, setSecondMonth] = useState(() => addMonths(getCurrentDateObjectInUzbekistan(), 1));
  
  // Mobile view state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Update mobile view state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Update second month when first month changes
  useEffect(() => {
    setSecondMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);
  
  // Parse min date to ensure it's a Date object
  const minDateObj = typeof minDate === "string" 
    ? parseISO(minDate) 
    : minDate;
  
  // Generate weekday headers using translation
  const getWeekDays = useCallback(() => [
    t("weekdays.short.sunday"),
    t("weekdays.short.monday"),
    t("weekdays.short.tuesday"),
    t("weekdays.short.wednesday"),
    t("weekdays.short.thursday"),
    t("weekdays.short.friday"),
    t("weekdays.short.saturday")
  ], [t]);

  const weekDays = getWeekDays();
  
  /**
   * Navigate to the previous month
   */
  const prevMonth = () => {
    setCurrentMonth(month => addMonths(month, -1));
  };
  
  /**
   * Navigate to the next month
   */
  const nextMonth = () => {
    setCurrentMonth(month => addMonths(month, 1));
  };
  
  /**
   * Check if a date is selected
   * 
   * @param {Date} date - The date to check
   * @returns {boolean} True if the date is in selectedDates
   */
  const isSelected = (date) => {
    return selectedDates.some(selectedDate => {
      // Handle both Date objects and string dates
      if (typeof selectedDate === "string") {
        try {
          const parsedDate = parseISO(selectedDate);
          return isValid(parsedDate) && isSameDay(parsedDate, date);
        } catch (e) {
          return false;
        }
      }
      return isSameDay(selectedDate, date);
    });
  };
  
  /**
   * Check if a date is disabled
   * 
   * @param {Date} date - The date to check
   * @returns {boolean} True if the date is disabled
   */
  const isDisabled = (date) => {
    // Check if date is before minimum date
    if (minDateObj && isBefore(date, minDateObj) && !isSameDay(date, minDateObj)) {
      return true;
    }
    
    // Check if the date is in the past (Uzbekistan timezone aware)
    const dateString = format(date, 'yyyy-MM-dd');
    if (isDateInPastUzbekistan(dateString)) {
      return true;
    }
    
    // Check if date is in disabled dates array
    return disabledDates.some(disabledDate => {
      if (typeof disabledDate === "string") {
        try {
          const parsedDate = parseISO(disabledDate);
          return isValid(parsedDate) && isSameDay(parsedDate, date);
        } catch (e) {
          return false;
        }
      }
      return isSameDay(disabledDate, date);
    });
  };
  
  /**
   * Toggle selection of a date
   * 
   * @param {Date} date - The date to toggle
   */
  const handleDateClick = (date) => {
    if (isDisabled(date)) return;
    onDateToggle(date);
  };
  
  /**
   * Generate days for the calendar grid
   * 
   * @param {Date} month - The month to generate days for
   * @returns {Date[]} Array of dates for the calendar grid
   */
  const generateDays = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };

  /**
   * Renders a single month calendar
   * 
   * @param {Date} month - The month to render
   * @returns {React.ReactElement} Month calendar element
   */
  const renderMonthCalendar = (month) => {
    return (
      <div className="w-full">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="h-6 md:h-8 flex items-center justify-center text-xs md:text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {generateDays(month).map((day, idx) => {
            const inCurrentMonth = isSameMonth(day, month);
            const dayDisabled = isDisabled(day);
            const isPastDay = dayDisabled && isDateInPastUzbekistan(format(day, 'yyyy-MM-dd'));
            const daySelected = isSelected(day);
            const isCurrentDay = isSameDay(day, getCurrentDateObjectInUzbekistan());
            
            return (
              <div
                key={idx}
                onClick={() => inCurrentMonth && !dayDisabled && !isPastDay && handleDateClick(day)}
                className={`
                  aspect-square relative flex items-center justify-center transition-colors
                  ${inCurrentMonth ? (isPastDay ? 'cursor-not-allowed' : 'cursor-pointer') : 'invisible pointer-events-none'}
                  ${(dayDisabled || isPastDay) && inCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
                `}
              >
                <div 
                  className={`
                    absolute inset-0 m-0.5 rounded-full flex items-center justify-center
                    ${daySelected ? 'bg-brand-orange' : isCurrentDay ? 'border border-brand-purple' : 'hover:bg-gray-100'}
                  `}
                >
                  {isPastDay && inCurrentMonth ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span className="text-sm md:text-base font-medium text-gray-300">
                        {format(day, "d")}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-gray-300 transform rotate-45"></div>
                      </div>
                    </div>
                  ) : (
                    <span className={`text-sm md:text-base font-medium ${daySelected ? 'text-white' : isCurrentDay ? 'text-brand-purple' : 'text-gray-800'}`}>
                      {format(day, "d")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="select-none w-full md:h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button 
          type="button"
          onClick={prevMonth}
          aria-label="Previous month" 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <div className="text-base md:text-lg font-semibold text-gray-800">
          {getTranslatedMonth(currentMonth)} {format(currentMonth, "yyyy")}
          {!isMobileView && (
            <span className="hidden md:inline"> - {getTranslatedMonth(secondMonth)} {format(secondMonth, "yyyy")}</span>
          )}
        </div>
        
        <button 
          type="button"
          onClick={nextMonth}
          aria-label="Next month" 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-gray-800">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Calendar layout - mobile: single month, desktop: two months side by side */}
      <div className="flex flex-col md:flex-row md:space-x-8 px-2">
        <div className="w-full md:w-1/2">
          {renderMonthCalendar(currentMonth)}
        </div>
        
        {/* Show second month only on desktop */}
        {!isMobileView && (
          <div className="hidden md:block w-1/2">
            {renderMonthCalendar(secondMonth)}
          </div>
        )}
      </div>
      
      {/* Selected dates counter */}
      {selectedDates.length > 0 && (
        <div className="mt-4 text-center text-sm md:text-base font-medium text-brand-purple">
          {selectedDates.length} {selectedDates.length === 1 ? t("dateSelection.dateSelected") : t("dateSelection.datesSelected")}
        </div>
      )}
    </div>
  );
}
