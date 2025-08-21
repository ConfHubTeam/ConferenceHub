import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";
import { getDateLocale } from "../utils/dateUtils";

/**
 * Custom DatePicker Component with Translation Support
 * 
 * A fully translated date picker that supports multiple languages
 * and integrates with the project's i18n system.
 */
export default function DatePicker({
  value = "",
  onChange,
  placeholder = "",
  className = "",
  minDate = null,
  maxDate = null,
  disabled = false,
  id = "",
  name = "",
  "aria-label": ariaLabel = "",
  alignCalendar = "left" // New prop to control calendar alignment
}) {
  const { t, i18n } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarPosition, setCalendarPosition] = useState(alignCalendar);
  const datePickerRef = useRef(null);

  // Get appropriate locale for date formatting
  const locale = getDateLocale(i18n.language);

  // Convert value to Date object
  const selectedDate = value ? (typeof value === "string" ? parseISO(value) : value) : null;

  // Calculate optimal calendar position based on viewport
  useEffect(() => {
    if (isOpen && datePickerRef.current) {
      const rect = datePickerRef.current.getBoundingClientRect();
      const calendarWidth = 320; // w-80 = 320px
      const viewportWidth = window.innerWidth;
      const rightEdge = rect.right + calendarWidth;
      
      // If calendar would overflow on the right, position it to the right
      if (rightEdge > viewportWidth && rect.left >= calendarWidth) {
        setCalendarPosition('right');
      } else {
        setCalendarPosition('left');
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale });
    const endDate = endOfWeek(monthEnd, { locale });

    const days = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    if (disabled) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Format display value
  const getDisplayValue = () => {
    if (!selectedDate) return "";
    return format(selectedDate, "MMM d, yyyy", { locale });
  };

  // Get month/year header
  const getMonthYearHeader = () => {
    return format(currentMonth, "MMMM yyyy", { locale });
  };

  // Get weekday headers
  const getWeekdayHeaders = () => {
    const weekStart = startOfWeek(new Date(), { locale });
    const headers = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      headers.push(format(day, "EEEEEE", { locale })); // Short day names (Mo, Tu, We, etc.)
    }
    
    return headers;
  };

  const calendarDays = generateCalendarDays();
  const weekdayHeaders = getWeekdayHeaders();

  return (
    <div className="relative" ref={datePickerRef}>
      {/* Input Field */}
      <input
        type="text"
        id={id}
        name={name}
        value={getDisplayValue()}
        placeholder={placeholder || t("datePicker.placeholder", "Select date")}
        className={`cursor-pointer ${className}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onChange={() => {}} // Prevent manual editing
        disabled={disabled}
        aria-label={ariaLabel}
        readOnly
      />

      {/* Calendar Icon */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={`absolute top-full mt-1 bg-bg-card border border-border-light rounded-lg shadow-lg z-50 w-80 max-w-[calc(100vw-2rem)] ${
          calendarPosition === 'right' ? 'right-0' : 'left-0'
        }`}>
          <div className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-bg-secondary rounded transition-colors"
                aria-label={t("datePicker.previousMonth", "Previous month")}
              >
                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold text-text-primary">
                {getMonthYearHeader()}
              </h3>
              
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-bg-secondary rounded transition-colors"
                aria-label={t("datePicker.nextMonth", "Next month")}
              >
                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdayHeaders.map((header, index) => (
                <div
                  key={index}
                  className="text-center text-xs font-medium text-text-muted py-2"
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isDisabled = isDateDisabled(day);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isDisabled && isCurrentMonth && handleDateSelect(day)}
                    disabled={isDisabled || !isCurrentMonth}
                    className={`
                      w-8 h-8 text-sm rounded transition-all duration-200 flex items-center justify-center
                      ${!isCurrentMonth 
                        ? "text-text-muted cursor-not-allowed" 
                        : isDisabled
                          ? "text-text-muted cursor-not-allowed opacity-50"
                          : isSelected
                            ? "bg-accent-primary text-white font-semibold"
                            : isToday
                              ? "bg-accent-primary/10 text-accent-primary font-semibold"
                              : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary"
                      }
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {/* Today Button */}
            <div className="mt-4 pt-3 border-t border-border-light">
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="w-full px-3 py-2 text-sm font-medium text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
              >
                {t("datePicker.today", "Today")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
