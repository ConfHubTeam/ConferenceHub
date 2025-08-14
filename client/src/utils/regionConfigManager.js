/**
 * Region Configuration Manager
 * Follows Open/Closed Principle - open for extension, closed for modification
 * Allows runtime configuration and validation
 */

import { UZBEKISTAN_REGIONS, DEFAULT_MAP_CONFIG, MAP_ZOOM_LEVELS } from './regionConstants.js';
import { validateRegionServiceData } from './regionValidation.js';

/**
 * Configuration Manager Class
 * Manages region configuration with validation and extensibility
 */
export class RegionConfigManager {
  constructor(initialConfig = {}) {
    this.config = {
      regions: UZBEKISTAN_REGIONS,
      defaultMapConfig: DEFAULT_MAP_CONFIG,
      zoomLevels: MAP_ZOOM_LEVELS,
      ...initialConfig
    };

    this.validators = new Map();
    this.transformers = new Map();
    
    // Initialize with default validation
    this.addValidator('default', this.defaultValidator.bind(this));
  }

  /**
   * Default validation for the configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  defaultValidator(config) {
    return validateRegionServiceData(config.regions, config.defaultMapConfig);
  }

  /**
   * Add a custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  addValidator(name, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }
    this.validators.set(name, validator);
  }

  /**
   * Remove a validator
   * @param {string} name - Validator name
   */
  removeValidator(name) {
    if (name === 'default') {
      throw new Error('Cannot remove default validator');
    }
    this.validators.delete(name);
  }

  /**
   * Add a data transformer
   * @param {string} name - Transformer name
   * @param {Function} transformer - Transformer function
   */
  addTransformer(name, transformer) {
    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function');
    }
    this.transformers.set(name, transformer);
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   * @param {Object} newConfig - New configuration
   * @returns {Object} Update result
   */
  updateConfig(newConfig) {
    const mergedConfig = {
      ...this.config,
      ...newConfig
    };

    // Run all validators
    const validationResults = [];
    for (const [name, validator] of this.validators) {
      try {
        const result = validator(mergedConfig);
        validationResults.push({ name, ...result });
      } catch (error) {
        validationResults.push({
          name,
          isValid: false,
          errors: [`Validator ${name} failed: ${error.message}`]
        });
      }
    }

    // Check if all validations passed
    const allValid = validationResults.every(result => result.isValid);
    
    if (allValid) {
      // Apply transformers
      let transformedConfig = mergedConfig;
      for (const [name, transformer] of this.transformers) {
        try {
          transformedConfig = transformer(transformedConfig);
        } catch (error) {
          return {
            success: false,
            errors: [`Transformer ${name} failed: ${error.message}`],
            validationResults
          };
        }
      }

      this.config = transformedConfig;
      return {
        success: true,
        config: this.getConfig(),
        validationResults
      };
    }

    const allErrors = validationResults
      .filter(result => !result.isValid)
      .flatMap(result => result.errors);

    return {
      success: false,
      errors: allErrors,
      validationResults
    };
  }

  /**
   * Add a new region with validation
   * @param {Object} region - Region to add
   * @returns {Object} Operation result
   */
  addRegion(region) {
    const newRegions = [...this.config.regions, region];
    return this.updateConfig({ regions: newRegions });
  }

  /**
   * Remove a region by ID
   * @param {string} regionId - Region ID to remove
   * @returns {Object} Operation result
   */
  removeRegion(regionId) {
    const newRegions = this.config.regions.filter(region => region.id !== regionId);
    
    // Check if removing default region
    const removedRegion = this.config.regions.find(region => region.id === regionId);
    if (removedRegion?.isDefault && newRegions.length > 0) {
      // Automatically set first region as default
      newRegions[0] = { ...newRegions[0], isDefault: true };
    }

    return this.updateConfig({ regions: newRegions });
  }

  /**
   * Update a specific region
   * @param {string} regionId - Region ID to update
   * @param {Object} updates - Updates to apply
   * @returns {Object} Operation result
   */
  updateRegion(regionId, updates) {
    const newRegions = this.config.regions.map(region => {
      if (region.id === regionId) {
        return { ...region, ...updates };
      }
      return region;
    });

    return this.updateConfig({ regions: newRegions });
  }

  /**
   * Set default region
   * @param {string} regionId - Region ID to set as default
   * @returns {Object} Operation result
   */
  setDefaultRegion(regionId) {
    const newRegions = this.config.regions.map(region => ({
      ...region,
      isDefault: region.id === regionId
    }));

    return this.updateConfig({ regions: newRegions });
  }

  /**
   * Get regions by criteria
   * @param {Function} filter - Filter function
   * @returns {Array} Filtered regions
   */
  getRegionsByCriteria(filter) {
    return this.config.regions.filter(filter);
  }

  /**
   * Export configuration to JSON
   * @returns {string} JSON string of configuration
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param {string} jsonString - JSON string of configuration
   * @returns {Object} Import result
   */
  importConfig(jsonString) {
    try {
      const importedConfig = JSON.parse(jsonString);
      return this.updateConfig(importedConfig);
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to parse JSON: ${error.message}`]
      };
    }
  }

  /**
   * Reset to default configuration
   * @returns {Object} Reset result
   */
  resetToDefaults() {
    return this.updateConfig({
      regions: UZBEKISTAN_REGIONS,
      defaultMapConfig: DEFAULT_MAP_CONFIG,
      zoomLevels: MAP_ZOOM_LEVELS
    });
  }

  /**
   * Get configuration statistics
   * @returns {Object} Configuration statistics
   */
  getStats() {
    const { regions } = this.config;
    const defaultRegion = regions.find(r => r.isDefault);
    
    return {
      totalRegions: regions.length,
      defaultRegion: defaultRegion?.id || null,
      languages: ['uz', 'en', 'ru'],
      bounds: this.calculateBounds(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate geographical bounds of all regions
   * @returns {Object} Bounds object
   */
  calculateBounds() {
    if (this.config.regions.length === 0) {
      return null;
    }

    const coordinates = this.config.regions.map(r => r.coordinates);
    
    return {
      north: Math.max(...coordinates.map(c => c.lat)),
      south: Math.min(...coordinates.map(c => c.lat)),
      east: Math.max(...coordinates.map(c => c.lng)),
      west: Math.min(...coordinates.map(c => c.lng))
    };
  }
}

/**
 * Create a pre-configured RegionConfigManager instance
 * @param {Object} customConfig - Custom configuration overrides
 * @returns {RegionConfigManager} Configured manager instance
 */
export function createRegionConfigManager(customConfig = {}) {
  const manager = new RegionConfigManager(customConfig);
  
  // Add common transformers
  manager.addTransformer('sortRegions', (config) => ({
    ...config,
    regions: config.regions.sort((a, b) => {
      // Default region first, then alphabetical by English name
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return a.names.en.localeCompare(b.names.en);
    })
  }));

  return manager;
}

// Export singleton instance
export const regionConfigManager = createRegionConfigManager();

export default RegionConfigManager;
