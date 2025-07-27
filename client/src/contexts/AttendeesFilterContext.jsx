import { createContext, useContext, useState, useCallback, useMemo } from "react";

/**
 * Context for attendees range filtering
 * Follows Single Responsibility principle by focusing only on attendees filter state
 * Follows Open/Closed principle - extensible for future attendees filter features
 * Follows Interface Segregation - provides only attendees-related functionality
 */
const AttendeesFilterContext = createContext();

/**
 * Custom hook to use the AttendeesFilter context
 * @returns {Object} AttendeesFilter context values and methods
 * @throws {Error} If used outside of AttendeesFilterProvider
 */
export const useAttendeesFilter = () => {
  const context = useContext(AttendeesFilterContext);
  if (context === undefined) {
    throw new Error("useAttendeesFilter must be used within a AttendeesFilterProvider");
  }
  return context;
};

/**
 * Predefined attendees ranges
 */
export const ATTENDEES_RANGES = [
  { id: "1-10", labelKey: "filters.modals.attendees.presets.1_10", min: 1, max: 10 },
  { id: "11-25", labelKey: "filters.modals.attendees.presets.11_25", min: 11, max: 25 },
  { id: "26-50", labelKey: "filters.modals.attendees.presets.26_50", min: 26, max: 50 },
  { id: "51-100", labelKey: "filters.modals.attendees.presets.51_100", min: 51, max: 100 },
  { id: "100+", labelKey: "filters.modals.attendees.presets.100plus", min: 101, max: null },
  { id: "custom", labelKey: "filters.modals.attendees.customRange", min: null, max: null, isCustom: true }
];

/**
 * Provider component for attendees range filtering functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Provider component
 */
export const AttendeesFilterProvider = ({ children }) => {
  // State for attendees range (null values indicate no limit set)
  const [minAttendees, setMinAttendees] = useState(null);
  const [maxAttendees, setMaxAttendees] = useState(null);
  const [selectedRangeId, setSelectedRangeId] = useState(null);

  /**
   * Updates the attendees range
   * @param {number|null} min - Minimum attendees value or null for no minimum
   * @param {number|null} max - Maximum attendees value or null for no maximum
   * @param {string|null} rangeId - Range ID for predefined ranges or null for custom
   */
  const updateAttendeesRange = useCallback((min, max, rangeId = null) => {
    // Validate and sanitize input values
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseInt(min)) && parseInt(min) > 0
      ? parseInt(min) 
      : null;
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseInt(max)) && parseInt(max) > 0
      ? parseInt(max) 
      : null;

    // Ensure min is not greater than max
    if (sanitizedMin !== null && sanitizedMax !== null && sanitizedMin > sanitizedMax) {
      console.warn("Minimum attendees cannot be greater than maximum attendees");
      return;
    }

    setMinAttendees(sanitizedMin);
    setMaxAttendees(sanitizedMax);
    setSelectedRangeId(rangeId);
  }, []);

  /**
   * Updates only the minimum attendees
   * @param {number|null} min - Minimum attendees value or null for no minimum
   */
  const updateMinAttendees = useCallback((min) => {
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseInt(min)) && parseInt(min) > 0
      ? parseInt(min) 
      : null;

    // Validate against existing max attendees
    if (sanitizedMin !== null && maxAttendees !== null && sanitizedMin > maxAttendees) {
      console.warn("Minimum attendees cannot be greater than maximum attendees");
      return;
    }

    setMinAttendees(sanitizedMin);
    // Reset range ID when manually setting values
    setSelectedRangeId("custom");
  }, [maxAttendees]);

  /**
   * Updates only the maximum attendees
   * @param {number|null} max - Maximum attendees value or null for no maximum
   */
  const updateMaxAttendees = useCallback((max) => {
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseInt(max)) && parseInt(max) > 0
      ? parseInt(max) 
      : null;

    // Validate against existing min attendees
    if (sanitizedMax !== null && minAttendees !== null && sanitizedMax < minAttendees) {
      console.warn("Maximum attendees cannot be less than minimum attendees");
      return;
    }

    setMaxAttendees(sanitizedMax);
    // Reset range ID when manually setting values
    setSelectedRangeId("custom");
  }, [minAttendees]);

  /**
   * Sets a predefined attendees range
   * @param {string} rangeId - ID of the predefined range
   */
  const selectPredefinedRange = useCallback((rangeId) => {
    const range = ATTENDEES_RANGES.find(r => r.id === rangeId);
    if (!range) {
      console.warn(`Invalid attendees range ID: ${rangeId}`);
      return;
    }

    setMinAttendees(range.min);
    setMaxAttendees(range.max);
    setSelectedRangeId(rangeId);
  }, []);

  /**
   * Clears all attendees range selections
   */
  const clearAttendeesFilter = useCallback(() => {
    setMinAttendees(null);
    setMaxAttendees(null);
    setSelectedRangeId(null);
  }, []);

  /**
   * Formats the attendees range for display
   * @returns {string} Formatted attendees range string or empty if no range set
   */
  const getFormattedAttendeesRange = useCallback(() => {
    const hasMin = minAttendees !== null && minAttendees !== undefined;
    const hasMax = maxAttendees !== null && maxAttendees !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check if current selection matches a predefined range
    const matchingRange = ATTENDEES_RANGES.find(range => 
      range.min === minAttendees && range.max === maxAttendees
    );

    if (matchingRange && matchingRange.id !== "custom") {
      // Return a basic range format since this context doesn't have access to translations
      if (matchingRange.max === null) {
        return `${matchingRange.min}+ attendees`;
      } else {
        return `${matchingRange.min}-${matchingRange.max} attendees`;
      }
    }

    // Custom formatting
    if (hasMin && hasMax) {
      return `${minAttendees} - ${maxAttendees} attendees`;
    } else if (hasMin) {
      return `${minAttendees}+ attendees`;
    } else if (hasMax) {
      return `Up to ${maxAttendees} attendees`;
    }

    return "";
  }, [minAttendees, maxAttendees]);

  /**
   * Checks if any attendees filter is active
   * @returns {boolean} True if any attendees filter is active
   */
  const hasActiveAttendeesFilter = useMemo(() => {
    return (minAttendees !== null && minAttendees !== undefined) || 
           (maxAttendees !== null && maxAttendees !== undefined);
  }, [minAttendees, maxAttendees]);

  /**
   * Gets the current attendees filter values for API queries
   * @returns {Object} Object with min, max attendees values
   */
  const getAttendeesFilterValues = useCallback(() => {
    return {
      minAttendees: minAttendees,
      maxAttendees: maxAttendees,
      rangeId: selectedRangeId
    };
  }, [minAttendees, maxAttendees, selectedRangeId]);

  /**
   * Filters places based on current attendees range
   * @param {Array} places - Array of place objects
   * @returns {Array} Filtered array of places
   */
  const filterPlacesByAttendees = useCallback((places) => {
    if (!hasActiveAttendeesFilter || !Array.isArray(places)) {
      return places;
    }

    return places.filter(place => {
      const placeMaxGuests = place.maxGuests;
      
      // Skip places without maxGuests data
      if (placeMaxGuests === null || placeMaxGuests === undefined) {
        return false;
      }

      // Check minimum attendees constraint
      if (minAttendees !== null && placeMaxGuests < minAttendees) {
        return false;
      }

      // Check maximum attendees constraint
      if (maxAttendees !== null && placeMaxGuests > maxAttendees) {
        return false;
      }

      return true;
    });
  }, [minAttendees, maxAttendees, hasActiveAttendeesFilter]);

  /**
   * Serializes attendees filter for URL parameters
   * @returns {Object} Object with serialized attendees filter values
   */
  const getSerializedValues = useCallback(() => {
    const result = {};
    
    if (minAttendees !== null && minAttendees !== undefined) {
      result.minAttendees = minAttendees.toString();
    }
    
    if (maxAttendees !== null && maxAttendees !== undefined) {
      result.maxAttendees = maxAttendees.toString();
    }
    
    if (selectedRangeId) {
      result.attendeesRange = selectedRangeId;
    }
    
    return result;
  }, [minAttendees, maxAttendees, selectedRangeId]);

  /**
   * Deserializes attendees filter from URL parameters
   * @param {Object} params - URL parameters object
   */
  const setFromSerializedValues = useCallback((params) => {
    let parsedMin = null;
    let parsedMax = null;
    let parsedRangeId = null;

    // Parse minimum attendees
    if (params.minAttendees) {
      const min = parseInt(params.minAttendees);
      if (!isNaN(min) && min > 0) {
        parsedMin = min;
      }
    }

    // Parse maximum attendees
    if (params.maxAttendees) {
      const max = parseInt(params.maxAttendees);
      if (!isNaN(max) && max > 0) {
        parsedMax = max;
      }
    }

    // Parse range ID
    if (params.attendeesRange) {
      const range = ATTENDEES_RANGES.find(r => r.id === params.attendeesRange);
      if (range) {
        parsedRangeId = params.attendeesRange;
        // If range is found, use its values instead of individual params
        parsedMin = range.min;
        parsedMax = range.max;
      }
    }

    // Validate that min is not greater than max
    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      console.warn("Invalid attendees range in URL parameters: min > max");
      return;
    }

    setMinAttendees(parsedMin);
    setMaxAttendees(parsedMax);
    setSelectedRangeId(parsedRangeId);
  }, []);

  // Create value object with all context data and methods
  // Following Dependency Inversion principle - depend on abstractions, not concretions
  const value = useMemo(() => ({
    // State
    minAttendees,
    maxAttendees,
    selectedRangeId,
    
    // Constants
    attendeesRanges: ATTENDEES_RANGES,
    
    // State update methods
    updateAttendeesRange,
    updateMinAttendees,
    updateMaxAttendees,
    selectPredefinedRange,
    clearAttendeesFilter,
    
    // Formatting and utility methods
    getFormattedAttendeesRange,
    getAttendeesFilterValues,
    filterPlacesByAttendees,
    
    // Helper methods
    hasActiveAttendeesFilter,
    getSerializedValues,
    setFromSerializedValues
  }), [
    minAttendees, maxAttendees, selectedRangeId,
    updateAttendeesRange, updateMinAttendees, updateMaxAttendees, 
    selectPredefinedRange, clearAttendeesFilter,
    getFormattedAttendeesRange, getAttendeesFilterValues, filterPlacesByAttendees,
    hasActiveAttendeesFilter, getSerializedValues, setFromSerializedValues
  ]);

  return (
    <AttendeesFilterContext.Provider value={value}>
      {children}
    </AttendeesFilterContext.Provider>
  );
};
