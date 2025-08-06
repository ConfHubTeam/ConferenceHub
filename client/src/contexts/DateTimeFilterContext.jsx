import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { format, isValid, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { useDateLocalization } from "../hooks/useDateLocalization";
import { formatHourTo12, formatHourTo24, formatHourLocalized } from "../utils/TimeUtils";

/**
 * Context for date and time filtering
 * Follows Single Responsibility principle by focusing only on date/time filter state
 */
const DateTimeFilterContext = createContext();

/**
 * Custom hook to use the DateTimeFilter context
 * @returns {Object} DateTimeFilter context values and methods
 * @throws {Error} If used outside of DateTimeFilterProvider
 */
export const useDateTimeFilter = () => {
  const context = useContext(DateTimeFilterContext);
  if (context === undefined) {
    throw new Error("useDateTimeFilter must be used within a DateTimeFilterProvider");
  }
  return context;
};

/**
 * Provider component for date and time filtering functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Provider component
 */
export const DateTimeFilterProvider = ({ children }) => {
  const { t, i18n } = useTranslation("search");
  const { formatLocalizedDate } = useDateLocalization();
  // State for selected dates and time ranges (using Uzbekistan timezone for date awareness)
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState("00:00"); // Default to 12:00 AM (midnight)
  const [endTime, setEndTime] = useState("23:00");     // Default to 11:00 PM (allow full 24h selection)

  /**
   * Updates selected dates
   * @param {Array<Date>} dates - Array of selected dates or empty array to clear
   */
  const updateSelectedDates = useCallback((dates) => {
    setSelectedDates(Array.isArray(dates) ? dates : []);
  }, []);
  
  /**
   * Toggle a date in the selection
   * @param {Date} date - Date to toggle in the selection
   */
  const toggleDateSelection = useCallback((date) => {
    if (!date) return;
    
    setSelectedDates(prevDates => {
      // Check if date already exists in selection
      const dateExists = prevDates.some(d => 
        d.getFullYear() === date.getFullYear() && 
        d.getMonth() === date.getMonth() && 
        d.getDate() === date.getDate()
      );
      
      if (dateExists) {
        // Remove date if already selected
        return prevDates.filter(d => 
          d.getFullYear() !== date.getFullYear() || 
          d.getMonth() !== date.getMonth() || 
          d.getDate() !== date.getDate()
        );
      } else {
        // Add date if not already selected
        return [...prevDates, date];
      }
    });
  }, []);

  /**
   * Updates the time range
   * @param {string} start - Start time in HH:MM format
   * @param {string} end - End time in HH:MM format
   */
  const updateTimeRange = useCallback((start, end) => {
    if (start) setStartTime(formatHourTo24(start));
    if (end) setEndTime(formatHourTo24(end));
  }, []);

  /**
   * Clears all date and time selections
   */
  const clearDateTimeFilter = useCallback(() => {
    setSelectedDates([]);
    setStartTime("00:00");
    setEndTime("23:00");
  }, []);

  /**
   * Formats the selected dates for display
   * @returns {string} Formatted date string or empty if no dates selected
   */
  const getFormattedDate = useCallback(() => {
    if (selectedDates.length === 0) return "";
    if (selectedDates.length === 1) return formatLocalizedDate(selectedDates[0]);
    return t("form.multiple_dates", { count: selectedDates.length });
  }, [selectedDates, t, formatLocalizedDate]);

  /**
   * Formats the selected time range for display
   * @returns {string} Formatted time range or empty if no times selected
   */
  const getFormattedTimeRange = useCallback(() => {
    if (!startTime || !endTime) return "";
    return `${formatHourLocalized(startTime, i18n.language)} - ${formatHourLocalized(endTime, i18n.language)}`;
  }, [startTime, endTime, i18n.language]);

  /**
   * Checks if any date or time filter is active
   * @returns {boolean} True if any filter is active
   */
  const hasActiveDateTimeFilter = useMemo(() => {
    return selectedDates.length > 0;
  }, [selectedDates]);

  /**
   * Gets combined formatted date and time for display
   * @returns {string} Formatted date and time or translated placeholder if no selection
   */
  const getFormattedDateTime = useCallback(() => {
    if (selectedDates.length === 0) return "";
    
    // For mobile optimization, when there are multiple dates, just show the count without time details
    if (selectedDates.length > 1) {
      return t("form.multiple_dates_short", { count: selectedDates.length });
    }
    
    const dateStr = getFormattedDate();
    const timeStr = getFormattedTimeRange();
    
    // For single date, show date and possibly time
    return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
  }, [selectedDates, getFormattedDate, getFormattedTimeRange, t]);

  /**
   * Serializes date and time for URL parameters
   * @returns {Object} Object with serialized date and time values
   */
  const getSerializedValues = useCallback(() => {
    return {
      dates: selectedDates.length > 0 ? selectedDates.map(date => format(date, "yyyy-MM-dd")).join(",") : "",
      startTime: startTime || "",
      endTime: endTime || ""
    };
  }, [selectedDates, startTime, endTime]);

  /**
   * Deserializes date and time from URL parameters
   * @param {Object} params - URL parameters object
   */
  const setFromSerializedValues = useCallback((params) => {
    if (params.dates) {
      try {
        const dateStrings = params.dates.split(",");
        const parsedDates = dateStrings.map(dateStr => {
          const parsedDate = parseISO(dateStr);
          if (isValid(parsedDate)) {
            return parsedDate;
          }
          return null;
        }).filter(date => date !== null);
        
        if (parsedDates.length > 0) {
          setSelectedDates(parsedDates);
        }
      } catch (e) {
        console.error("Invalid date format in URL parameters", e);
      }
    }
    
    if (params.startTime) {
      setStartTime(params.startTime);
    }
    
    if (params.endTime) {
      setEndTime(params.endTime);
    }
  }, []);

  // Create value object with all context data and methods
  const value = useMemo(() => ({
    // State
    selectedDates,
    startTime,
    endTime,
    
    // State update methods
    updateSelectedDates,
    toggleDateSelection,
    updateTimeRange,
    clearDateTimeFilter,
    
    // Formatting methods
    getFormattedDate,
    getFormattedTimeRange,
    getFormattedDateTime,
    
    // Helper methods
    hasActiveDateTimeFilter,
    getSerializedValues,
    setFromSerializedValues
  }), [
    selectedDates, startTime, endTime,
    updateSelectedDates, toggleDateSelection, updateTimeRange, clearDateTimeFilter,
    getFormattedDate, getFormattedTimeRange, getFormattedDateTime,
    hasActiveDateTimeFilter, getSerializedValues, setFromSerializedValues
  ]);

  return (
    <DateTimeFilterContext.Provider value={value}>
      {children}
    </DateTimeFilterContext.Provider>
  );
};
