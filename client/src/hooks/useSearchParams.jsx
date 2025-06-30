import { useCallback, useEffect } from "react";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { parseISO, isValid, format } from "date-fns";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

/**
 * Custom hook for managing URL search parameters related to date/time filtering
 * Handles synchronizing filter state with URL parameters for bookmarkable URLs
 * 
 * @returns {Object} Methods for managing search parameters
 */
export const useSearchParams = () => {
  // Get URL search params from React Router
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Get date/time filter state and methods from context
  const {
    selectedDate,
    startTime,
    endTime,
    updateSelectedDate,
    updateTimeRange,
    setFromSerializedValues,
    getSerializedValues
  } = useDateTimeFilter();

  /**
   * Update URL with current filter state
   * Keeps existing URL parameters that are not related to date/time filtering
   */
  const updateUrlWithFilters = useCallback(() => {
    // Create new object with existing params
    const newParams = {};
    
    // Keep all existing params that are not date/time related
    for (const [key, value] of searchParams.entries()) {
      if (!['date', 'startTime', 'endTime'].includes(key)) {
        newParams[key] = value;
      }
    }
    
    // Get serialized values from filter context
    const serializedValues = getSerializedValues();
    
    // Only add parameters that have values
    if (serializedValues.date) {
      newParams.date = serializedValues.date;
    }
    
    if (serializedValues.startTime) {
      newParams.startTime = serializedValues.startTime;
    }
    
    if (serializedValues.endTime) {
      newParams.endTime = serializedValues.endTime;
    }
    
    // Update URL without causing navigation (replace: true)
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, getSerializedValues]);

  /**
   * Read filters from URL and update filter state
   * Converts URL string parameters to appropriate date/time formats
   */
  const readFiltersFromUrl = useCallback(() => {
    const dateParam = searchParams.get('date');
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');
    
    const params = {};
    
    // Handle date parameter
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (isValid(parsedDate)) {
          params.date = dateParam;
        }
      } catch (e) {
        console.error("Invalid date format in URL parameters", e);
      }
    }
    
    // Handle time parameters
    if (startTimeParam) {
      params.startTime = startTimeParam;
    }
    
    if (endTimeParam) {
      params.endTime = endTimeParam;
    }
    
    // Update filter state with parsed URL parameters
    if (Object.keys(params).length > 0) {
      setFromSerializedValues(params);
    }
  }, [searchParams, setFromSerializedValues]);

  /**
   * Set URL parameters for a specific date and optional time range
   * @param {Date} date - Selected date
   * @param {string} start - Start time in 24-hour format (HH:MM)
   * @param {string} end - End time in 24-hour format (HH:MM)
   */
  const setDateTimeParams = useCallback((date, start = null, end = null) => {
    // Create new object with existing params
    const newParams = {};
    
    // Keep all existing params that are not date/time related
    for (const [key, value] of searchParams.entries()) {
      if (!['date', 'startTime', 'endTime'].includes(key)) {
        newParams[key] = value;
      }
    }
    
    // Format and add date parameter
    if (date && date instanceof Date) {
      newParams.date = format(date, 'yyyy-MM-dd');
    }
    
    // Add time parameters if provided
    if (start) {
      newParams.startTime = start;
    }
    
    if (end) {
      newParams.endTime = end;
    }
    
    // Update URL without causing navigation (replace: true)
    setSearchParams(newParams, { replace: true });
    
    // Update filter state
    if (date) updateSelectedDate(date);
    if (start || end) updateTimeRange(start, end);
  }, [searchParams, setSearchParams, updateSelectedDate, updateTimeRange]);

  /**
   * Clear date/time parameters from URL and filter state
   */
  const clearDateTimeParams = useCallback(() => {
    // Create new object with existing params
    const newParams = {};
    
    // Keep all existing params that are not date/time related
    for (const [key, value] of searchParams.entries()) {
      if (!['date', 'startTime', 'endTime'].includes(key)) {
        newParams[key] = value;
      }
    }
    
    // Update URL without causing navigation (replace: true)
    setSearchParams(newParams, { replace: true });
    
    // Reset filter state
    updateSelectedDate(null);
    updateTimeRange("09:00", "17:00"); // Default times
  }, [searchParams, setSearchParams, updateSelectedDate, updateTimeRange]);

  /**
   * Get a specific parameter from the URL with proper decoding
   * @param {string} key - Parameter name to get
   * @returns {string|null} Parameter value or null if not found
   */
  const getParam = useCallback((key) => {
    const value = searchParams.get(key);
    return value ? decodeURIComponent(value) : null;
  }, [searchParams]);

  /**
   * Get date/time parameters as an object with decoded values
   * Uses Uzbekistan timezone handling where appropriate
   * @returns {Object} Object with date, startTime, endTime properties
   */
  const getDateTimeParams = useCallback(() => {
    const dateParam = searchParams.get('date');
    const startTimeParam = searchParams.get('startTime');
    const endTimeParam = searchParams.get('endTime');
    
    let dateObj = null;
    
    // Parse date if available
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (isValid(parsedDate)) {
          dateObj = parsedDate;
        }
      } catch (e) {
        console.error("Invalid date format in URL parameters", e);
      }
    }
    
    return {
      date: dateObj,
      startTime: startTimeParam || "09:00",
      endTime: endTimeParam || "17:00"
    };
  }, [searchParams]);

  // Initialize from URL parameters on mount
  useEffect(() => {
    readFiltersFromUrl();
  }, [readFiltersFromUrl]);

  // Return methods for manipulating search parameters
  return {
    updateUrlWithFilters,
    readFiltersFromUrl,
    setDateTimeParams,
    clearDateTimeParams,
    getParam,
    getDateTimeParams
  };
};

export default useSearchParams;
