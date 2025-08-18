/**
 * Marker size utility functions for map markers
 * C/**
 * Gets the anchor point for a marker based on its size
 * The anchor point determines where the marker is positioned relative to its coordinates
 * @param {string} size - Size category ('small', 'medium', or 'large')
 * @returns {object} Object with x and y coordinates for the anchor point
 */
export const getMarkerAnchorPoint = (size = 'medium') => {
  const config = getMarkerSizeConfig(size);
  
  // Anchor point is at the center of the rounded marker for optimal positioning
  return {
    x: config.width / 2,
    y: config.height / 2
  };
};

// Marker size configurations - smaller and more rounded
export const MARKER_SIZE_CONFIGS = {
  small: {
    width: 40,
    height: 22,
    fontSize: 9,
    borderRadius: 11
  },
  medium: {
    width: 50,
    height: 26,
    fontSize: 10,
    borderRadius: 13
  },
  large: {
    width: 58,
    height: 30,
    fontSize: 11,
    borderRadius: 15
  }
};

// Zoom level thresholds for size determination
export const ZOOM_THRESHOLDS = {
  SMALL_MAX: 10,
  LARGE_MIN: 14
};

/**
 * Determines the appropriate marker size based on zoom level
 * @param {number} zoomLevel - Current map zoom level
 * @returns {string} Size category ('small', 'medium', or 'large')
 */
export const getMarkerSizeByZoom = (zoomLevel) => {
  if (zoomLevel <= ZOOM_THRESHOLDS.SMALL_MAX) {
    return 'small';
  } else if (zoomLevel >= ZOOM_THRESHOLDS.LARGE_MIN) {
    return 'large';
  } else {
    return 'medium';
  }
};

/**
 * Gets the size configuration for a given size category
 * @param {string} size - Size category ('small', 'medium', or 'large')
 * @returns {object} Configuration object with width, height, fontSize, and borderRadius
 */
export const getMarkerSizeConfig = (size = 'medium') => {
  return MARKER_SIZE_CONFIGS[size] || MARKER_SIZE_CONFIGS.medium;
};

/**
 * Creates a Google Maps Point object for marker anchor positioning
 * @param {string} size - Size category ('small', 'medium', or 'large')
 * @returns {google.maps.Point} Google Maps Point object for anchor positioning
 */
export const createGoogleMapsAnchorPoint = (size = 'medium') => {
  const anchor = getMarkerAnchorPoint(size);
  return new window.google.maps.Point(anchor.x, anchor.y);
};

/**
 * Creates a Google Maps Size object for marker scaling
 * @param {string} size - Size category ('small', 'medium', or 'large')
 * @returns {google.maps.Size} Google Maps Size object for marker scaling
 */
export const createGoogleMapsScaledSize = (size = 'medium') => {
  const config = getMarkerSizeConfig(size);
  return new window.google.maps.Size(config.width, config.height);
};

/**
 * Gets all marker properties needed for Google Maps marker configuration
 * @param {string} size - Size category ('small', 'medium', or 'large')
 * @returns {object} Object containing anchor point and scaled size for Google Maps
 */
export const getMarkerGoogleMapsProperties = (size = 'medium') => {
  return {
    anchor: createGoogleMapsAnchorPoint(size),
    scaledSize: createGoogleMapsScaledSize(size)
  };
};

/**
 * Validates if a size category is valid
 * @param {string} size - Size category to validate
 * @returns {boolean} True if size is valid, false otherwise
 */
export const isValidMarkerSize = (size) => {
  return Object.keys(MARKER_SIZE_CONFIGS).includes(size);
};

/**
 * Gets all available marker size categories
 * @returns {string[]} Array of available size categories
 */
export const getAvailableMarkerSizes = () => {
  return Object.keys(MARKER_SIZE_CONFIGS);
};
