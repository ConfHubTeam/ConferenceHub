import { useState, useEffect, useRef } from "react";
import { format, isSameDay, isEqual, parseISO, isValid } from "date-fns";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import MultiDateCalendar from "./MultiDateCalendar";
import { formatHourTo12 } from "../utils/TimeUtils";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * DateTimeFilterModal Component
 * A reusable modal for date and time selection that can be used across the application
 * Supports multiple date selections with a shared time range
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 */
/**
 * DateTimeFilterModal Component
 * A reusable modal for multi-date and time selection
 * Supports desktop-optimized layout with larger calendar and side-by-side time selectors
 * Uses brand colors: purple for current date, orange for selected dates
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 */
export default function DateTimeFilterModal({ isOpen, onClose }) {
  const {
    selectedDates,
    startTime,
    endTime,
    updateSelectedDates,
    toggleDateSelection,
    updateTimeRange,
    clearDateTimeFilter,
    getFormattedDateTime
  } = useDateTimeFilter();

  // Get router search params for URL updates
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Temporary state for the modal
  const [tempSelectedDates, setTempSelectedDates] = useState([...selectedDates]);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);
  const modalRef = useRef(null);

  // Generate time options for dropdowns (from 00:00 to 23:00 - full 24 hour coverage)
  // Allow all times to be selected for any date, as we're working with multiple date selection
  const timeOptions = [];
  for (let hour = 0; hour <= 23; hour++) {
    const hour24 = hour.toString().padStart(2, "0") + ":00";
    timeOptions.push(hour24);
  }

  // Handle outside click to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Reset temporary values when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedDates([...selectedDates]);
      setTempStartTime(startTime);
      setTempEndTime(endTime);
    }
  }, [isOpen, selectedDates, startTime, endTime]);

  // Handle date toggle for multiple selection
  const handleDateToggle = (dateValue) => {
    if (!dateValue) return;
    
    // Convert string date to Date object if needed
    let date;
    if (typeof dateValue === 'string') {
      try {
        // Try to parse with parseISO first (for ISO format dates)
        date = parseISO(dateValue);
        if (!isValid(date)) {
          // Fallback to regular Date constructor
          date = new Date(dateValue);
        }
      } catch (e) {
        console.error("Error parsing date:", e);
        return;
      }
    } else {
      date = dateValue;
    }
    
    setTempSelectedDates(prevDates => {
      // Check if date already exists in selection
      const dateExists = prevDates.some(d => 
        format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      if (dateExists) {
        // Remove date if already selected
        return prevDates.filter(d => 
          format(d, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')
        );
      } else {
        // Add date if not already selected
        return [...prevDates, date];
      }
    });
  };

  // Check if a date is selected
  const isDateSelected = (date) => {
    if (!date) return false;
    
    // Handle both string and Date object formats
    const formattedDate = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    return tempSelectedDates.some(d => 
      format(d, 'yyyy-MM-dd') === formattedDate
    );
  };

  // Handle apply button click
  const handleApply = () => {
    // Update context state
    updateSelectedDates(tempSelectedDates);
    updateTimeRange(tempStartTime, tempEndTime);
    
    // Update URL parameters
    updateUrlWithFilters(tempSelectedDates, tempStartTime, tempEndTime);
    
    onClose();
  };

  // Handle clear button click
  const handleClear = () => {
    setTempSelectedDates([]);
    setTempStartTime("00:00"); // Reset to midnight
    setTempEndTime("23:00");   // Reset to 11 PM
    clearDateTimeFilter();
    
    // Clear URL parameters
    updateUrlWithFilters([], null, null);
    
    onClose();
  };

  // Update URL with filter parameters
  const updateUrlWithFilters = (dates, startTime, endTime) => {
    const newParams = new URLSearchParams();
    
    // Keep only valid existing parameters (not undefined or empty)
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== 'undefined' && value !== '' && 
          !['dates', 'startTime', 'endTime', 'date', 'search', 'location', 'price'].includes(key)) {
        newParams.set(key, value);
      }
    }
    
    // Add new parameters if they exist
    if (dates && dates.length > 0) {
      const dateStrings = dates.map(date => format(date, 'yyyy-MM-dd')).join(',');
      newParams.set('dates', dateStrings);
    }
    
    if (startTime && startTime !== 'undefined') {
      newParams.set('startTime', startTime);
    }
    
    if (endTime && endTime !== 'undefined') {
      newParams.set('endTime', endTime);
    }
    
    // Update URL without causing navigation (replace: true to avoid adding to history)
    setSearchParams(newParams, { replace: true });
  };

  // No custom month navigation needed as Calendar component provides it

  // Only render when open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4 py-6">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header - Responsive */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 md:py-5 border-b">
          <h2 className="text-lg md:text-xl font-medium text-brand-purple">Select Dates & Times</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Calendar Section */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="mb-6">
            {/* Calendar component with selected dates info */}
            <div className="mb-4">
              <p className="text-sm md:text-base font-medium text-gray-700">
                {tempSelectedDates.length === 0 
                  ? "Select one or more dates" 
                  : tempSelectedDates.length === 1 
                    ? "1 date selected" 
                    : `${tempSelectedDates.length} dates selected`}
              </p>
            </div>
            {/* Multi Date Calendar component */}
            <div className="calendar-container md:h-[380px] md:flex md:items-center md:justify-center">
              <MultiDateCalendar
                selectedDates={tempSelectedDates}
                onDateToggle={handleDateToggle}
                minDate={getCurrentDateObjectInUzbekistan()}
              />
            </div>
          </div>

          {/* Time Selection Section - Applied to all selected dates */}
          <div className="space-y-4 md:mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Time range</h3>
              <p className="text-sm text-gray-500">Applied to all selected dates</p>
            </div>
            
            {/* Mobile: stacked, Desktop: side-by-side time selectors */}
            <div className="md:flex md:space-x-6">
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <p className="text-base font-medium mb-2 text-gray-700">Start time</p>
                <div className="relative">
                  <select
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
                  >
                    {timeOptions.map(time => (
                      <option 
                        key={time} 
                        value={time}
                        disabled={tempEndTime && time >= tempEndTime}
                      >
                        {formatHourTo12(time)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <p className="text-base font-medium mb-2 text-gray-700">End time</p>
                <div className="relative">
                  <select
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
                  >
                    {timeOptions.map(time => (
                      <option 
                        key={time} 
                        value={time}
                        disabled={tempStartTime && time <= tempStartTime}
                      >
                        {formatHourTo12(time)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with buttons - Responsive */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t">
          <button 
            onClick={handleClear}
            className="text-brand-purple font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-purple px-2 py-1 rounded-md text-sm md:text-base"
          >
            Clear all
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleApply}
              className="bg-brand-orange text-white rounded-lg px-5 sm:px-6 py-2 font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-colors text-sm md:text-base"
              disabled={tempSelectedDates.length === 0}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
