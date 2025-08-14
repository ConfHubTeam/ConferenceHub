/**
 * Region Validation Utilities
 * Follows Single Responsibility Principle - only handles validation
 * Ensures data integrity and type safety
 */

/**
 * Validate coordinate values
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {Object} Validation result
 */
export function validateCoordinates(lat, lng) {
  const errors = [];

  // Check if values are numbers
  if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push('Latitude must be a valid number');
  }
  if (typeof lng !== 'number' || isNaN(lng)) {
    errors.push('Longitude must be a valid number');
  }

  // Check coordinate ranges
  if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate region object structure
 * @param {Object} region - Region object to validate
 * @returns {Object} Validation result
 */
export function validateRegion(region) {
  const errors = [];

  // Check required properties
  if (!region || typeof region !== 'object') {
    errors.push('Region must be a valid object');
    return { isValid: false, errors };
  }

  // Validate ID
  if (!region.id || typeof region.id !== 'string') {
    errors.push('Region must have a valid string ID');
  }

  // Validate names object
  if (!region.names || typeof region.names !== 'object') {
    errors.push('Region must have a names object');
  } else {
    const requiredLanguages = ['uz', 'en', 'ru'];
    requiredLanguages.forEach(lang => {
      if (!region.names[lang] || typeof region.names[lang] !== 'string') {
        errors.push(`Region must have a ${lang} name`);
      }
    });
  }

  // Validate coordinates
  if (!region.coordinates || typeof region.coordinates !== 'object') {
    errors.push('Region must have a coordinates object');
  } else {
    const coordValidation = validateCoordinates(
      region.coordinates.lat, 
      region.coordinates.lng
    );
    if (!coordValidation.isValid) {
      errors.push(...coordValidation.errors);
    }
  }

  // Validate isDefault flag
  if (typeof region.isDefault !== 'boolean') {
    errors.push('Region must have a boolean isDefault property');
  }

  // Validate timezone (optional but should be string if present)
  if (region.timezone !== undefined && typeof region.timezone !== 'string') {
    errors.push('Region timezone must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate array of regions
 * @param {Array} regions - Array of region objects
 * @returns {Object} Validation result
 */
export function validateRegionsArray(regions) {
  const errors = [];

  if (!Array.isArray(regions)) {
    errors.push('Regions must be an array');
    return { isValid: false, errors };
  }

  if (regions.length === 0) {
    errors.push('Regions array cannot be empty');
    return { isValid: false, errors };
  }

  // Validate each region
  const regionErrors = [];
  const seenIds = new Set();
  let defaultCount = 0;

  regions.forEach((region, index) => {
    const validation = validateRegion(region);
    if (!validation.isValid) {
      regionErrors.push(`Region at index ${index}: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate IDs
    if (region.id && seenIds.has(region.id)) {
      regionErrors.push(`Duplicate region ID found: ${region.id}`);
    }
    seenIds.add(region.id);

    // Count default regions
    if (region.isDefault) {
      defaultCount++;
    }
  });

  // Check for exactly one default region
  if (defaultCount === 0) {
    errors.push('There must be exactly one default region');
  } else if (defaultCount > 1) {
    errors.push('There can only be one default region');
  }

  errors.push(...regionErrors);

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      totalRegions: regions.length,
      defaultRegions: defaultCount,
      uniqueIds: seenIds.size
    }
  };
}

/**
 * Validate map configuration object
 * @param {Object} mapConfig - Map configuration to validate
 * @returns {Object} Validation result
 */
export function validateMapConfig(mapConfig) {
  const errors = [];

  if (!mapConfig || typeof mapConfig !== 'object') {
    errors.push('Map configuration must be a valid object');
    return { isValid: false, errors };
  }

  // Validate center coordinates
  if (!mapConfig.center || typeof mapConfig.center !== 'object') {
    errors.push('Map configuration must have a center object');
  } else {
    const coordValidation = validateCoordinates(
      mapConfig.center.lat, 
      mapConfig.center.lng
    );
    if (!coordValidation.isValid) {
      errors.push('Map center: ' + coordValidation.errors.join(', '));
    }
  }

  // Validate zoom level
  if (typeof mapConfig.zoom !== 'number' || mapConfig.zoom < 1 || mapConfig.zoom > 20) {
    errors.push('Map zoom must be a number between 1 and 20');
  }

  // Validate region ID (optional)
  if (mapConfig.regionId !== undefined && typeof mapConfig.regionId !== 'string') {
    errors.push('Map region ID must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate search term
 * @param {string} searchTerm - Search term to validate
 * @returns {Object} Validation result
 */
export function validateSearchTerm(searchTerm) {
  const errors = [];

  if (searchTerm !== undefined && searchTerm !== null && typeof searchTerm !== 'string') {
    errors.push('Search term must be a string');
  }

  // Check for potentially dangerous characters (basic XSS prevention)
  if (searchTerm && /<script|javascript:|data:|vbscript:/i.test(searchTerm)) {
    errors.push('Search term contains invalid characters');
  }

  // Check length limits
  if (searchTerm && searchTerm.length > 100) {
    errors.push('Search term cannot exceed 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: searchTerm ? searchTerm.trim() : ''
  };
}

/**
 * Sanitize and validate region ID
 * @param {string} regionId - Region ID to validate
 * @returns {Object} Validation result
 */
export function validateRegionId(regionId) {
  const errors = [];

  if (regionId !== null && regionId !== undefined && typeof regionId !== 'string') {
    errors.push('Region ID must be a string');
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (regionId && !/^[a-zA-Z0-9\-_]+$/.test(regionId)) {
    errors.push('Region ID can only contain letters, numbers, hyphens, and underscores');
  }

  // Check length limits
  if (regionId && regionId.length > 50) {
    errors.push('Region ID cannot exceed 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: regionId ? regionId.trim().toLowerCase() : null
  };
}

/**
 * Comprehensive validation for region service initialization
 * @param {Array} regions - Regions array
 * @param {Object} defaultConfig - Default map configuration
 * @returns {Object} Validation result
 */
export function validateRegionServiceData(regions, defaultConfig) {
  const regionsValidation = validateRegionsArray(regions);
  const configValidation = validateMapConfig(defaultConfig);

  const allErrors = [
    ...regionsValidation.errors,
    ...configValidation.errors
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    regionsValidation,
    configValidation
  };
}

// Export all validation functions
export default {
  validateCoordinates,
  validateRegion,
  validateRegionsArray,
  validateMapConfig,
  validateSearchTerm,
  validateRegionId,
  validateRegionServiceData
};
