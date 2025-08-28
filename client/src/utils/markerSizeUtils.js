/**
 * Marker size utility functions for map markers with responsive scaling.
 * Ensures markers are readable across large monitors and zoomed-out browsers.
 */

/**
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

// Base marker size configurations (will be scaled by UI factor)
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
 * Compute a UI scale factor based on viewport width and browser zoom.
 * - Scales up on wide/4K screens
 * - Compensates when browser zoom is < 100% (devicePixelRatio < 1)
 * Clamped to a safe range to avoid oversized markers.
 */
export const getUiScaleFactor = () => {
  if (typeof window === 'undefined') return 1;
  const w = window.innerWidth || 1440;
  const dpr = window.devicePixelRatio || 1;

  let scale = 1;
  if (w >= 3440) scale = 1.6; // ultrawide/5K
  else if (w >= 2560) scale = 1.45; // 2.5K/4K
  else if (w >= 1920) scale = 1.25; // FHD+
  else if (w >= 1680) scale = 1.12; // HD+
  else if (w >= 1440) scale = 1.05; // 1440px wide
  else if (w <= 480) scale = 0.9; // small phones

  // If user zoomed out (dpr < 1), counterbalance to keep markers readable
  if (dpr < 1) {
    scale *= (1 / dpr);
  }

  // Clamp to avoid extremes
  scale = Math.min(Math.max(scale, 0.85), 1.75);
  return scale;
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
 * @param {number} [uiScale] - Optional UI scale factor; defaults to computed factor
 * @returns {object} Configuration object with width, height, fontSize, and borderRadius
 */
export const getMarkerSizeConfig = (size = 'medium', uiScale) => {
  const base = MARKER_SIZE_CONFIGS[size] || MARKER_SIZE_CONFIGS.medium;
  const scale = uiScale != null ? uiScale : getUiScaleFactor();
  return {
    width: Math.round(base.width * scale),
    height: Math.round(base.height * scale),
    fontSize: Math.round(base.fontSize * scale),
    borderRadius: Math.round(base.borderRadius * scale)
  };
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
