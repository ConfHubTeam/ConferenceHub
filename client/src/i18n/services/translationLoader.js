/**
 * Translation Loader Service
 * Handles dynamic loading, caching, and preloading of translations
 * Supports route-based and context-aware loading strategies
 */

class TranslationLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = new Set();
    this.maxCacheSize = 50; // Maximum number of cached translation sets
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  /**
   * Load translations for a specific context/namespace
   * @param {string} language - Language code (en, uz, ru)
   * @param {string} namespace - Translation namespace (common, booking, places, etc.)
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Translation object
   */
  async loadTranslations(language, namespace, options = {}) {
    const cacheKey = `${language}:${namespace}`;
    const { force = false, priority = 'normal' } = options;

    // Check cache first unless force reload
    if (!force && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (this.isCacheValid(cached)) {
        // Move to end of cache (LRU)
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, cached);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Create loading promise
    const loadingPromise = this.performLoad(language, namespace, options);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      this.cacheTranslations(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Failed to load translations for ${cacheKey}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual translation loading with retry logic
   * @private
   */
  async performLoad(language, namespace, options, attempt = 1) {
    try {
      // Try to load from local files first
      const localTranslations = await this.loadLocalTranslations(language, namespace);
      if (localTranslations) {
        return localTranslations;
      }

      // Fallback to remote loading if local fails
      return await this.loadRemoteTranslations(language, namespace, options);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performLoad(language, namespace, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Load translations from HTTP endpoint (public/locales)
   * @private
   */
  async loadLocalTranslations(language, namespace) {
    try {
      const response = await fetch(`/locales/${language}/${namespace}.json`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      // File doesn't exist or network error, will try other methods
      return null;
    }
  }

  /**
   * Load translations from remote source (for dynamic content)
   * @private
   */
  async loadRemoteTranslations(language, namespace, options) {
    const endpoint = `/api/translations/${language}/${namespace}`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Preload translations for anticipated usage
   * @param {Array} preloadList - Array of {language, namespace} objects
   * @param {Object} options - Preload options
   */
  async preloadTranslations(preloadList, options = {}) {
    const { priority = 'low', batchSize = 3 } = options;
    
    // Add to preload queue
    preloadList.forEach(item => {
      this.preloadQueue.add(`${item.language}:${item.namespace}`);
    });

    // Process preload queue in batches
    const queueArray = Array.from(this.preloadQueue);
    for (let i = 0; i < queueArray.length; i += batchSize) {
      const batch = queueArray.slice(i, i + batchSize);
      
      // Run batch in parallel but don't block
      Promise.allSettled(
        batch.map(async (cacheKey) => {
          const [language, namespace] = cacheKey.split(':');
          
          try {
            await this.loadTranslations(language, namespace, { priority });
            this.preloadQueue.delete(cacheKey);
          } catch (error) {
            console.warn(`Preload failed for ${cacheKey}:`, error);
          }
        })
      ).catch(error => {
        console.warn('Preload batch failed:', error);
      });

      // Small delay between batches to not overwhelm
      if (i + batchSize < queueArray.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Cache translations with metadata
   * @private
   */
  cacheTranslations(cacheKey, data) {
    // Implement LRU cache behavior
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * Check if cached data is still valid
   * @private
   */
  isCacheValid(cached) {
    return (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Get route-based translation namespaces
   * @param {string} route - Current route path
   * @returns {Array} Array of namespace strings
   */
  getRouteNamespaces(route) {
    const routeMap = {
      '/': ['common', 'landing'],
      '/search': ['common', 'search', 'places'],
      '/place': ['common', 'places', 'booking'],
      '/booking': ['common', 'booking', 'payment'],
      '/profile': ['common', 'user', 'profile'],
      '/host': ['common', 'host', 'places'],
      '/messages': ['common', 'messages'],
      '/trips': ['common', 'booking', 'trips'],
      '/help': ['common', 'help', 'support'],
    };

    // Find the most specific route match
    const exactMatch = routeMap[route];
    if (exactMatch) return exactMatch;

    // Find partial matches for dynamic routes
    for (const [routePattern, namespaces] of Object.entries(routeMap)) {
      if (route.startsWith(routePattern)) {
        return namespaces;
      }
    }

    // Default fallback
    return ['common'];
  }

  /**
   * Get related namespaces for preloading
   * @param {Array} currentNamespaces - Currently loaded namespaces
   * @returns {Array} Related namespaces to preload
   */
  getRelatedNamespaces(currentNamespaces) {
    const relations = {
      'landing': ['search', 'places'],
      'search': ['places', 'booking'],
      'places': ['booking', 'reviews'],
      'booking': ['payment', 'messages'],
      'profile': ['trips', 'messages'],
      'host': ['places', 'analytics'],
    };

    const related = new Set();
    currentNamespaces.forEach(ns => {
      if (relations[ns]) {
        relations[ns].forEach(rel => related.add(rel));
      }
    });

    return Array.from(related);
  }

  /**
   * Clear cache (useful for language changes)
   * @param {string} pattern - Optional pattern to match cache keys
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const stats = {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0,
      keys: Array.from(this.cache.keys()),
    };

    let totalAccess = 0;
    let totalHits = 0;

    for (const [, cached] of this.cache) {
      totalAccess += cached.accessCount;
      totalHits += cached.accessCount;
    }

    stats.hitRate = totalAccess > 0 ? (totalHits / totalAccess) * 100 : 0;
    return stats;
  }

  /**
   * Force reload translations (bypasses cache)
   * @param {string} language - Language code
   * @param {string} namespace - Namespace to reload
   */
  async reloadTranslations(language, namespace) {
    return this.loadTranslations(language, namespace, { force: true });
  }
}

// Create singleton instance
export const translationLoader = new TranslationLoader();
export default TranslationLoader;
