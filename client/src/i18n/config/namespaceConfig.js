/**
 * Translation Namespace Configuration
 * Defines translation namespaces, their relationships, and loading strategies
 */

/**
 * Core namespace definitions with metadata
 */
export const TRANSLATION_NAMESPACES = {
  // Core namespaces (always needed)
  common: {
    priority: 'critical',
    size: 'small', // < 5KB
    loadStrategy: 'immediate',
    dependencies: [],
    description: 'Common UI elements, buttons, labels',
  },

  // Feature-specific namespaces
  landing: {
    priority: 'high',
    size: 'medium', // 5-15KB
    loadStrategy: 'route-based',
    dependencies: ['common'],
    description: 'Landing page content, hero sections, CTAs',
  },

  search: {
    priority: 'high',
    size: 'large', // 15-30KB
    loadStrategy: 'route-based',
    dependencies: ['common', 'places'],
    description: 'Search interface, filters, results',
  },

  places: {
    priority: 'high',
    size: 'large',
    loadStrategy: 'route-based',
    dependencies: ['common'],
    description: 'Place listings, details, amenities',
  },

  booking: {
    priority: 'high',
    size: 'large',
    loadStrategy: 'route-based',
    dependencies: ['common', 'places', 'payment'],
    description: 'Booking process, date selection, guest info',
  },

  payment: {
    priority: 'medium',
    size: 'medium',
    loadStrategy: 'on-demand',
    dependencies: ['common'],
    description: 'Payment methods, billing, receipts',
  },

  profile: {
    priority: 'medium',
    size: 'medium',
    loadStrategy: 'route-based',
    dependencies: ['common', 'user'],
    description: 'User profile, settings, preferences',
  },

  user: {
    priority: 'medium',
    size: 'small',
    loadStrategy: 'preload',
    dependencies: ['common'],
    description: 'User account, authentication, verification',
  },

  host: {
    priority: 'medium',
    size: 'large',
    loadStrategy: 'route-based',
    dependencies: ['common', 'places'],
    description: 'Host dashboard, listing management',
  },

  messages: {
    priority: 'medium',
    size: 'medium',
    loadStrategy: 'on-demand',
    dependencies: ['common', 'user'],
    description: 'Messaging system, conversations',
  },

  reviews: {
    priority: 'low',
    size: 'medium',
    loadStrategy: 'lazy',
    dependencies: ['common', 'places'],
    description: 'Reviews, ratings, feedback',
  },

  trips: {
    priority: 'medium',
    size: 'medium',
    loadStrategy: 'route-based',
    dependencies: ['common', 'booking'],
    description: 'Trip management, itineraries',
  },

  help: {
    priority: 'low',
    size: 'large',
    loadStrategy: 'on-demand',
    dependencies: ['common'],
    description: 'Help center, support, FAQs',
  },

  analytics: {
    priority: 'low',
    size: 'small',
    loadStrategy: 'lazy',
    dependencies: ['common', 'host'],
    description: 'Analytics, insights, reports',
  },

  notifications: {
    priority: 'low',
    size: 'small',
    loadStrategy: 'preload',
    dependencies: ['common'],
    description: 'Notifications, alerts, updates',
  },
};

/**
 * Route-to-namespace mapping with loading priorities
 */
export const ROUTE_NAMESPACE_MAP = {
  '/': {
    immediate: ['common', 'landing'],
    preload: ['search', 'user'],
    lazy: ['places'],
  },
  
  '/search': {
    immediate: ['common', 'search', 'places'],
    preload: ['booking', 'reviews'],
    lazy: ['user'],
  },
  
  '/place/:id': {
    immediate: ['common', 'places'],
    preload: ['booking', 'reviews', 'user'],
    lazy: ['messages'],
  },
  
  '/book/:id': {
    immediate: ['common', 'booking', 'places'],
    preload: ['payment', 'user'],
    lazy: ['messages'],
  },
  
  '/payment': {
    immediate: ['common', 'payment', 'booking'],
    preload: ['user'],
    lazy: ['trips'],
  },
  
  '/profile': {
    immediate: ['common', 'profile', 'user'],
    preload: ['trips', 'messages'],
    lazy: ['host'],
  },
  
  '/profile/edit': {
    immediate: ['common', 'profile', 'user'],
    preload: ['notifications'],
    lazy: [],
  },
  
  '/host': {
    immediate: ['common', 'host', 'places'],
    preload: ['analytics', 'messages'],
    lazy: ['reviews'],
  },
  
  '/host/listings': {
    immediate: ['common', 'host', 'places'],
    preload: ['analytics', 'reviews'],
    lazy: ['messages'],
  },
  
  '/messages': {
    immediate: ['common', 'messages', 'user'],
    preload: ['booking', 'places'],
    lazy: [],
  },
  
  '/trips': {
    immediate: ['common', 'trips', 'booking'],
    preload: ['reviews', 'messages'],
    lazy: ['user'],
  },
  
  '/help': {
    immediate: ['common', 'help'],
    preload: [],
    lazy: ['user'],
  },
  
  // Catch-all for unmatched routes
  '*': {
    immediate: ['common'],
    preload: ['user'],
    lazy: [],
  },
};

/**
 * Namespace relationship definitions for smart preloading
 */
export const NAMESPACE_RELATIONSHIPS = {
  // When loading 'landing', also consider preloading these
  landing: {
    related: ['search', 'places'],
    probability: 0.8, // 80% chance user will navigate to search
  },
  
  search: {
    related: ['places', 'booking'],
    probability: 0.7,
  },
  
  places: {
    related: ['booking', 'reviews', 'messages'],
    probability: 0.6,
  },
  
  booking: {
    related: ['payment', 'user', 'trips'],
    probability: 0.9,
  },
  
  payment: {
    related: ['trips', 'user'],
    probability: 0.95,
  },
  
  profile: {
    related: ['trips', 'messages', 'host'],
    probability: 0.5,
  },
  
  host: {
    related: ['analytics', 'places', 'messages'],
    probability: 0.7,
  },
  
  user: {
    related: ['profile', 'trips', 'notifications'],
    probability: 0.4,
  },
};

/**
 * Loading strategy configurations
 */
export const LOADING_STRATEGIES = {
  immediate: {
    timeout: 5000, // 5 seconds
    retries: 3,
    priority: 'high',
    showLoader: true,
  },
  
  preload: {
    timeout: 15000, // 15 seconds
    retries: 2,
    priority: 'medium',
    showLoader: false,
    delay: 1000, // Wait 1 second before starting preload
  },
  
  lazy: {
    timeout: 30000, // 30 seconds
    retries: 1,
    priority: 'low',
    showLoader: false,
    delay: 5000, // Wait 5 seconds before starting lazy load
  },
  
  'on-demand': {
    timeout: 10000, // 10 seconds
    retries: 2,
    priority: 'medium',
    showLoader: true,
  },
  
  'route-based': {
    timeout: 8000, // 8 seconds
    retries: 2,
    priority: 'high',
    showLoader: true,
  },
};

/**
 * Cache configuration per namespace
 */
export const CACHE_CONFIG = {
  // Critical namespaces - cache longer
  common: {
    ttl: 60 * 60 * 1000, // 1 hour
    priority: 'critical',
    persistAcrossSessions: true,
  },
  
  user: {
    ttl: 30 * 60 * 1000, // 30 minutes
    priority: 'high',
    persistAcrossSessions: true,
  },
  
  // Dynamic content - cache shorter
  places: {
    ttl: 15 * 60 * 1000, // 15 minutes
    priority: 'medium',
    persistAcrossSessions: false,
  },
  
  search: {
    ttl: 10 * 60 * 1000, // 10 minutes
    priority: 'medium',
    persistAcrossSessions: false,
  },
  
  // Frequently changing content - minimal cache
  booking: {
    ttl: 5 * 60 * 1000, // 5 minutes
    priority: 'high',
    persistAcrossSessions: false,
  },
  
  payment: {
    ttl: 2 * 60 * 1000, // 2 minutes
    priority: 'high',
    persistAcrossSessions: false,
  },
  
  // Default for unlisted namespaces
  default: {
    ttl: 20 * 60 * 1000, // 20 minutes
    priority: 'medium',
    persistAcrossSessions: false,
  },
};

/**
 * Get namespaces for a specific route with loading strategy
 * @param {string} route - Current route path
 * @returns {Object} Namespaces organized by loading strategy
 */
export function getRouteNamespaces(route) {
  // Find exact match first
  if (ROUTE_NAMESPACE_MAP[route]) {
    return ROUTE_NAMESPACE_MAP[route];
  }
  
  // Try pattern matching for dynamic routes
  for (const [pattern, namespaces] of Object.entries(ROUTE_NAMESPACE_MAP)) {
    if (pattern.includes(':') && matchesPattern(route, pattern)) {
      return namespaces;
    }
  }
  
  // Fallback to catch-all
  return ROUTE_NAMESPACE_MAP['*'];
}

/**
 * Simple pattern matching for dynamic routes
 * @private
 */
function matchesPattern(route, pattern) {
  const routeParts = route.split('/');
  const patternParts = pattern.split('/');
  
  if (routeParts.length !== patternParts.length) {
    return false;
  }
  
  return patternParts.every((part, index) => {
    return part.startsWith(':') || part === routeParts[index];
  });
}

/**
 * Get related namespaces for preloading
 * @param {Array} currentNamespaces - Currently loaded namespaces
 * @param {number} probabilityThreshold - Minimum probability for inclusion
 * @returns {Array} Related namespaces to preload
 */
export function getRelatedNamespaces(currentNamespaces, probabilityThreshold = 0.5) {
  const related = new Set();
  
  currentNamespaces.forEach(namespace => {
    const relationship = NAMESPACE_RELATIONSHIPS[namespace];
    if (relationship && relationship.probability >= probabilityThreshold) {
      relationship.related.forEach(rel => {
        if (!currentNamespaces.includes(rel)) {
          related.add(rel);
        }
      });
    }
  });
  
  return Array.from(related);
}

/**
 * Get cache configuration for a namespace
 * @param {string} namespace - Namespace name
 * @returns {Object} Cache configuration
 */
export function getCacheConfig(namespace) {
  return CACHE_CONFIG[namespace] || CACHE_CONFIG.default;
}

/**
 * Get loading strategy configuration
 * @param {string} strategy - Strategy name
 * @returns {Object} Strategy configuration
 */
export function getLoadingStrategy(strategy) {
  return LOADING_STRATEGIES[strategy] || LOADING_STRATEGIES['on-demand'];
}

/**
 * Check if namespace should be persisted across sessions
 * @param {string} namespace - Namespace name
 * @returns {boolean} Whether to persist
 */
export function shouldPersistNamespace(namespace) {
  const config = getCacheConfig(namespace);
  return config.persistAcrossSessions;
}

export default {
  TRANSLATION_NAMESPACES,
  ROUTE_NAMESPACE_MAP,
  NAMESPACE_RELATIONSHIPS,
  LOADING_STRATEGIES,
  CACHE_CONFIG,
  getRouteNamespaces,
  getRelatedNamespaces,
  getCacheConfig,
  getLoadingStrategy,
  shouldPersistNamespace,
};
