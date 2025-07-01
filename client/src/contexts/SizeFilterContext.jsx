import { createContext, useContext, useState, useCallback, useMemo } from "react";

/**
 * Context for size range filtering
 * Follows Single Responsibility principle by focusing only on size filter state
 * Follows Open/Closed principle - extensible for future size filter features
 * Follows Interface Segregation - provides only size-related functionality
 */
const SizeFilterContext = createContext();

/**
 * Custom hook to use the SizeFilter context
 * @returns {Object} SizeFilter context values and methods
 * @throws {Error} If used outside of SizeFilterProvider
 */
export const useSizeFilter = () => {
  const context = useContext(SizeFilterContext);
  if (context === undefined) {
    throw new Error("useSizeFilter must be used within a SizeFilterProvider");
  }
  return context;
};

/**
 * Predefined size ranges in square meters
 */
export const SIZE_RANGES = [
  { id: "small", label: "Small • ~50 m²", min: 0, max: 50 },
  { id: "medium", label: "Medium • 50–100 m²", min: 50, max: 100 },
  { id: "large", label: "Large • 100–300 m²", min: 100, max: 300 },
  { id: "extra-large", label: "Extra‑Large • 300–700 m²", min: 300, max: 700 },
  { id: "custom", label: "Custom", min: null, max: null }
];

/**
 * Provider component for size range filtering functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Provider component
 */
export const SizeFilterProvider = ({ children }) => {
  // State for size range (null values indicate no limit set)
  const [minSize, setMinSize] = useState(null);
  const [maxSize, setMaxSize] = useState(null);
  const [selectedRangeId, setSelectedRangeId] = useState(null);

  /**
   * Updates the size range
   * @param {number|null} min - Minimum size value or null for no minimum
   * @param {number|null} max - Maximum size value or null for no maximum
   * @param {string|null} rangeId - Range ID for predefined ranges or null for custom
   */
  const updateSizeRange = useCallback((min, max, rangeId = null) => {
    // Validate and sanitize input values
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseInt(min)) && parseInt(min) > 0
      ? parseInt(min) 
      : null;
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseInt(max)) && parseInt(max) > 0
      ? parseInt(max) 
      : null;

    // Ensure min is not greater than max
    if (sanitizedMin !== null && sanitizedMax !== null && sanitizedMin > sanitizedMax) {
      console.warn("Minimum size cannot be greater than maximum size");
      return;
    }

    setMinSize(sanitizedMin);
    setMaxSize(sanitizedMax);
    setSelectedRangeId(rangeId);
  }, []);

  /**
   * Updates only the minimum size
   * @param {number|null} min - Minimum size value or null for no minimum
   */
  const updateMinSize = useCallback((min) => {
    const sanitizedMin = min !== null && min !== undefined && !isNaN(parseInt(min)) && parseInt(min) > 0
      ? parseInt(min) 
      : null;

    // Validate against existing max size
    if (sanitizedMin !== null && maxSize !== null && sanitizedMin > maxSize) {
      console.warn("Minimum size cannot be greater than maximum size");
      return;
    }

    setMinSize(sanitizedMin);
    // Reset range ID when manually setting values
    setSelectedRangeId("custom");
  }, [maxSize]);

  /**
   * Updates only the maximum size
   * @param {number|null} max - Maximum size value or null for no maximum
   */
  const updateMaxSize = useCallback((max) => {
    const sanitizedMax = max !== null && max !== undefined && !isNaN(parseInt(max)) && parseInt(max) > 0
      ? parseInt(max) 
      : null;

    // Validate against existing min size
    if (sanitizedMax !== null && minSize !== null && sanitizedMax < minSize) {
      console.warn("Maximum size cannot be less than minimum size");
      return;
    }

    setMaxSize(sanitizedMax);
    // Reset range ID when manually setting values
    setSelectedRangeId("custom");
  }, [minSize]);

  /**
   * Sets a predefined size range
   * @param {string} rangeId - ID of the predefined range
   */
  const selectPredefinedRange = useCallback((rangeId) => {
    const range = SIZE_RANGES.find(r => r.id === rangeId);
    if (!range) {
      console.warn(`Invalid size range ID: ${rangeId}`);
      return;
    }

    setMinSize(range.min);
    setMaxSize(range.max);
    setSelectedRangeId(rangeId);
  }, []);

  /**
   * Clears all size range selections
   */
  const clearSizeFilter = useCallback(() => {
    setMinSize(null);
    setMaxSize(null);
    setSelectedRangeId(null);
  }, []);

  /**
   * Formats the size range for display
   * @returns {string} Formatted size range string or empty if no range set
   */
  const getFormattedSizeRange = useCallback(() => {
    const hasMin = minSize !== null && minSize !== undefined;
    const hasMax = maxSize !== null && maxSize !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check if current selection matches a predefined range
    const matchingRange = SIZE_RANGES.find(range => 
      range.min === minSize && range.max === maxSize
    );

    if (matchingRange && matchingRange.id !== "custom") {
      return matchingRange.label;
    }

    // Custom formatting
    if (hasMin && hasMax) {
      return `${minSize} - ${maxSize} m²`;
    } else if (hasMin) {
      return `${minSize}+ m²`;
    } else if (hasMax) {
      return `Up to ${maxSize} m²`;
    }

    return "";
  }, [minSize, maxSize]);

  /**
   * Checks if any size filter is active
   * @returns {boolean} True if any size filter is active
   */
  const hasActiveSizeFilter = useMemo(() => {
    return (minSize !== null && minSize !== undefined) || 
           (maxSize !== null && maxSize !== undefined);
  }, [minSize, maxSize]);

  /**
   * Gets the current size filter values for API queries
   * @returns {Object} Object with min, max size values
   */
  const getSizeFilterValues = useCallback(() => {
    return {
      minSize: minSize,
      maxSize: maxSize,
      rangeId: selectedRangeId
    };
  }, [minSize, maxSize, selectedRangeId]);

  /**
   * Filters places based on current size range
   * @param {Array} places - Array of place objects
   * @returns {Array} Filtered array of places
   */
  const filterPlacesBySize = useCallback((places) => {
    if (!hasActiveSizeFilter || !Array.isArray(places)) {
      return places;
    }

    return places.filter(place => {
      const placeSize = place.squareMeters;
      
      // Skip places without size data
      if (placeSize === null || placeSize === undefined) {
        return false;
      }

      // Check minimum size constraint
      if (minSize !== null && placeSize < minSize) {
        return false;
      }

      // Check maximum size constraint
      if (maxSize !== null && placeSize > maxSize) {
        return false;
      }

      return true;
    });
  }, [minSize, maxSize, hasActiveSizeFilter]);

  /**
   * Serializes size filter for URL parameters
   * @returns {Object} Object with serialized size filter values
   */
  const getSerializedValues = useCallback(() => {
    const result = {};
    
    if (minSize !== null && minSize !== undefined) {
      result.minSize = minSize.toString();
    }
    
    if (maxSize !== null && maxSize !== undefined) {
      result.maxSize = maxSize.toString();
    }
    
    if (selectedRangeId) {
      result.sizeRange = selectedRangeId;
    }
    
    return result;
  }, [minSize, maxSize, selectedRangeId]);

  /**
   * Deserializes size filter from URL parameters
   * @param {Object} params - URL parameters object
   */
  const setFromSerializedValues = useCallback((params) => {
    let parsedMin = null;
    let parsedMax = null;
    let parsedRangeId = null;

    // Parse minimum size
    if (params.minSize) {
      const min = parseInt(params.minSize);
      if (!isNaN(min) && min > 0) {
        parsedMin = min;
      }
    }

    // Parse maximum size
    if (params.maxSize) {
      const max = parseInt(params.maxSize);
      if (!isNaN(max) && max > 0) {
        parsedMax = max;
      }
    }

    // Parse range ID
    if (params.sizeRange) {
      const range = SIZE_RANGES.find(r => r.id === params.sizeRange);
      if (range) {
        parsedRangeId = params.sizeRange;
        // If range is found, use its values instead of individual params
        parsedMin = range.min;
        parsedMax = range.max;
      }
    }

    // Validate that min is not greater than max
    if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
      console.warn("Invalid size range in URL parameters: min > max");
      return;
    }

    setMinSize(parsedMin);
    setMaxSize(parsedMax);
    setSelectedRangeId(parsedRangeId);
  }, []);

  // Create value object with all context data and methods
  // Following Dependency Inversion principle - depend on abstractions, not concretions
  const value = useMemo(() => ({
    // State
    minSize,
    maxSize,
    selectedRangeId,
    
    // Constants
    sizeRanges: SIZE_RANGES,
    
    // State update methods
    updateSizeRange,
    updateMinSize,
    updateMaxSize,
    selectPredefinedRange,
    clearSizeFilter,
    
    // Formatting and utility methods
    getFormattedSizeRange,
    getSizeFilterValues,
    filterPlacesBySize,
    
    // Helper methods
    hasActiveSizeFilter,
    getSerializedValues,
    setFromSerializedValues
  }), [
    minSize, maxSize, selectedRangeId,
    updateSizeRange, updateMinSize, updateMaxSize, 
    selectPredefinedRange, clearSizeFilter,
    getFormattedSizeRange, getSizeFilterValues, filterPlacesBySize,
    hasActiveSizeFilter, getSerializedValues, setFromSerializedValues
  ]);

  return (
    <SizeFilterContext.Provider value={value}>
      {children}
    </SizeFilterContext.Provider>
  );
};
