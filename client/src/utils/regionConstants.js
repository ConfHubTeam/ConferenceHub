/**
 * Region constants for Uzbekistan administrative divisions
 * Follows Single Responsibility Principle - only handles region data
 * Follows Open/Closed Principle - easily extensible for new regions
 */

/**
 * Coordinates interface for type consistency
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude coordinate
 * @property {number} lng - Longitude coordinate
 */

/**
 * Multilingual name interface
 * @typedef {Object} RegionNames
 * @property {string} uz - Uzbek name
 * @property {string} en - English name
 * @property {string} ru - Russian name
 */

/**
 * Complete region information
 * @typedef {Object} Region
 * @property {string} id - Unique region identifier
 * @property {RegionNames} names - Multilingual names
 * @property {Coordinates} coordinates - Region center coordinates
 * @property {boolean} isDefault - Whether this is the default region
 * @property {string} timezone - Region timezone
 */

/**
 * Uzbekistan regions with capital cities coordinates
 * Data sourced from official administrative divisions, centered on major cities
 */
export const UZBEKISTAN_REGIONS = [
  {
    id: 'tashkent-city',
    names: {
      uz: 'Toshkent shahri',
      en: 'Tashkent City',
      ru: 'город Ташкент'
    },
    coordinates: {
      lat: 41.2995,
      lng: 69.2401
    },
    isDefault: true,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'andijan',
    names: {
      uz: 'Andijon',
      en: 'Andijan',
      ru: 'Андижан'
    },
    coordinates: {
      lat: 40.7821,
      lng: 72.3442
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'bukhara',
    names: {
      uz: 'Buxoro',
      en: 'Bukhara',
      ru: 'Бухара'
    },
    coordinates: {
      lat: 39.7747,
      lng: 64.4286
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'fergana',
    names: {
      uz: 'Farg\'ona',
      en: 'Fergana',
      ru: 'Фергана'
    },
    coordinates: {
      lat: 40.3890,
      lng: 71.7833
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'jizzakh',
    names: {
      uz: 'Jizzax',
      en: 'Jizzakh',
      ru: 'Джизак'
    },
    coordinates: {
      lat: 40.1158,
      lng: 67.8422
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'karakalpakstan',
    names: {
      uz: 'Qoraqalpog\'iston Respublikasi',
      en: 'Karakalpakstan',
      ru: 'Каракалпакстан'
    },
    coordinates: {
      lat: 42.4600,
      lng: 59.6100
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'namangan',
    names: {
      uz: 'Namangan',
      en: 'Namangan',
      ru: 'Наманган'
    },
    coordinates: {
      lat: 40.9983,
      lng: 71.6726
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'navoiy',
    names: {
      uz: 'Navoiy',
      en: 'Navoiy',
      ru: 'Навои'
    },
    coordinates: {
      lat: 40.1100,
      lng: 65.3700
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'qashqadaryo',
    names: {
      uz: 'Qashqadaryo',
      en: 'Qashqadaryo',
      ru: 'Кашкадарья'
    },
    coordinates: {
      lat: 38.8606,
      lng: 65.7891
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'samarkand',
    names: {
      uz: 'Samarqand',
      en: 'Samarkand',
      ru: 'Самарканд'
    },
    coordinates: {
      lat: 39.6542,
      lng: 66.9597
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'sirdaryo',
    names: {
      uz: 'Sirdaryo',
      en: 'Sirdaryo',
      ru: 'Сырдарья'
    },
    coordinates: {
      lat: 40.4897,
      lng: 68.7842
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'surxondaryo',
    names: {
      uz: 'Surxondaryo',
      en: 'Surxondaryo',
      ru: 'Сурхандарья'
    },
    coordinates: {
      lat: 37.2242,
      lng: 67.2783
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  },
  {
    id: 'khorezm',
    names: {
      uz: 'Xorazm',
      en: 'Khorezm',
      ru: 'Хорезм'
    },
    coordinates: {
      lat: 41.5500,
      lng: 60.6333
    },
    isDefault: false,
    timezone: 'Asia/Tashkent'
  }
];

/**
 * Default map configuration
 */
export const DEFAULT_MAP_CONFIG = {
  center: {
    lat: 41.2995,
    lng: 69.2401
  },
  zoom: 11,
  regionId: 'tashkent-city'
};

/**
 * Map zoom levels for different view types
 */
export const MAP_ZOOM_LEVELS = {
  CITY: 11,
  REGION: 9,
  COUNTRY: 6
};

/**
 * Region filtering configuration for proximity-based filtering
 */
export const REGION_FILTER_CONFIG = {
  // Proximity thresholds in kilometers for different region types
  PROXIMITY_THRESHOLDS: {
    'tashkent-city': 100,  // Urban area - smaller radius
    'default': 50         // Other regions - larger radius
  },
  
  // Address matching configuration
  ADDRESS_MATCHING: {
    CASE_SENSITIVE: false,
    PARTIAL_MATCH: true,
    MIN_MATCH_LENGTH: 3
  },
  
  // Filtering strategy priorities (higher number = higher priority)
  STRATEGY_PRIORITIES: {
    ADDRESS_EXACT_MATCH: 100,
    ADDRESS_PARTIAL_MATCH: 80,
    PROXIMITY_CLOSE: 60,
    PROXIMITY_MEDIUM: 40
  }
};

// Freeze objects to prevent accidental mutations (following immutability principle)
Object.freeze(UZBEKISTAN_REGIONS);
Object.freeze(DEFAULT_MAP_CONFIG);
Object.freeze(MAP_ZOOM_LEVELS);
Object.freeze(REGION_FILTER_CONFIG);
