import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { translationLoader } from '../services/translationLoader';
import { useLanguageContext } from '../../contexts/LanguageContext';

/**
 * Context-Aware Translation Context
 * Provides dynamic translation loading based on current route and context
 */

const ContextTranslationContext = createContext({
  translations: {},
  isLoading: false,
  error: null,
  loadingNamespaces: new Set(),
  loadTranslation: () => {},
  preloadTranslation: () => {},
  reloadTranslations: () => {},
});

/**
 * Loading states for different scenarios
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PRELOADING: 'preloading',
  RELOADING: 'reloading',
  ERROR: 'error',
  SUCCESS: 'success',
};

export const ContextTranslationProvider = ({ children }) => {
  const { currentLanguage } = useLanguageContext();
  const location = useLocation();
  
  const [translations, setTranslations] = useState(new Map());
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [loadingNamespaces, setLoadingNamespaces] = useState(new Set());
  const [error, setError] = useState(null);
  const [preloadingNamespaces, setPreloadingNamespaces] = useState(new Set());

  /**
   * Load translation for a specific namespace
   */
  const loadTranslation = useCallback(async (namespace, options = {}) => {
    const { priority = 'normal', silent = false } = options;
    const translationKey = `${currentLanguage}:${namespace}`;

    // Skip if already loaded and not forcing reload
    if (translations.has(translationKey) && !options.force) {
      return translations.get(translationKey);
    }

    if (!silent) {
      setLoadingNamespaces(prev => new Set([...prev, namespace]));
      setLoadingState(LOADING_STATES.LOADING);
    }

    try {
      const translationData = await translationLoader.loadTranslations(
        currentLanguage,
        namespace,
        options
      );

      setTranslations(prev => new Map([...prev, [translationKey, translationData]]));
      setError(null);
      
      if (!silent) {
        setLoadingState(LOADING_STATES.SUCCESS);
      }

      return translationData;
    } catch (err) {
      console.error(`Failed to load translation for ${namespace}:`, err);
      setError(err);
      setLoadingState(LOADING_STATES.ERROR);
      throw err;
    } finally {
      if (!silent) {
        setLoadingNamespaces(prev => {
          const newSet = new Set(prev);
          newSet.delete(namespace);
          return newSet;
        });
        
        if (loadingNamespaces.size <= 1) {
          setLoadingState(LOADING_STATES.IDLE);
        }
      }
    }
  }, [currentLanguage, translations, loadingNamespaces]);

  /**
   * Preload translations for anticipated usage
   */
  const preloadTranslation = useCallback(async (namespaces, options = {}) => {
    const namespacesToPreload = Array.isArray(namespaces) ? namespaces : [namespaces];
    
    setPreloadingNamespaces(prev => new Set([...prev, ...namespacesToPreload]));
    setLoadingState(LOADING_STATES.PRELOADING);

    const preloadList = namespacesToPreload.map(namespace => ({
      language: currentLanguage,
      namespace,
    }));

    try {
      await translationLoader.preloadTranslations(preloadList, {
        ...options,
        priority: 'low',
      });

      // Load preloaded translations into state
      await Promise.allSettled(
        namespacesToPreload.map(namespace => 
          loadTranslation(namespace, { silent: true })
        )
      );
    } catch (err) {
      console.warn('Preload failed:', err);
    } finally {
      setPreloadingNamespaces(prev => {
        const newSet = new Set(prev);
        namespacesToPreload.forEach(ns => newSet.delete(ns));
        return newSet;
      });
    }
  }, [currentLanguage, loadTranslation]);

  /**
   * Reload all translations (useful for language changes)
   */
  const reloadTranslations = useCallback(async () => {
    setLoadingState(LOADING_STATES.RELOADING);
    setTranslations(new Map());
    
    // Clear cache for current language
    translationLoader.clearCache(`^${currentLanguage}:`);
    
    // Reload route-specific translations
    const routeNamespaces = translationLoader.getRouteNamespaces(location.pathname);
    
    try {
      await Promise.all(
        routeNamespaces.map(namespace => 
          loadTranslation(namespace, { force: true, silent: true })
        )
      );
      setLoadingState(LOADING_STATES.SUCCESS);
    } catch (err) {
      setError(err);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, [currentLanguage, location.pathname, loadTranslation]);

  /**
   * Load route-specific translations when route changes
   */
  useEffect(() => {
    const loadRouteTranslations = async () => {
      const routeNamespaces = translationLoader.getRouteNamespaces(location.pathname);
      
      // Load core namespaces first
      const corePromises = routeNamespaces.map(namespace => 
        loadTranslation(namespace, { priority: 'high' })
      );

      try {
        await Promise.allSettled(corePromises);
        
        // Preload related namespaces
        const relatedNamespaces = translationLoader.getRelatedNamespaces(routeNamespaces);
        if (relatedNamespaces.length > 0) {
          preloadTranslation(relatedNamespaces);
        }
      } catch (err) {
        console.error('Route translation loading failed:', err);
      }
    };

    loadRouteTranslations();
  }, [location.pathname, loadTranslation, preloadTranslation]);

  /**
   * Reload translations when language changes
   */
  useEffect(() => {
    if (currentLanguage) {
      reloadTranslations();
    }
  }, [currentLanguage, reloadTranslations]);

  /**
   * Get translation from loaded translations
   */
  const getTranslation = useCallback((namespace, key, fallback = key) => {
    const translationKey = `${currentLanguage}:${namespace}`;
    const namespaceTranslations = translations.get(translationKey);
    
    if (!namespaceTranslations) {
      return fallback;
    }

    // Support nested keys like "forms.labels.email"
    const keys = key.split('.');
    let value = namespaceTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : fallback;
  }, [currentLanguage, translations]);

  /**
   * Check if a namespace is currently loading
   */
  const isNamespaceLoading = useCallback((namespace) => {
    return loadingNamespaces.has(namespace);
  }, [loadingNamespaces]);

  /**
   * Check if a namespace is currently preloading
   */
  const isNamespacePreloading = useCallback((namespace) => {
    return preloadingNamespaces.has(namespace);
  }, [preloadingNamespaces]);

  /**
   * Check if translation is available
   */
  const hasTranslation = useCallback((namespace, key = null) => {
    const translationKey = `${currentLanguage}:${namespace}`;
    const namespaceTranslations = translations.get(translationKey);
    
    if (!namespaceTranslations) {
      return false;
    }
    
    if (!key) {
      return true;
    }
    
    const keys = key.split('.');
    let value = namespaceTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }
    
    return true;
  }, [currentLanguage, translations]);

  /**
   * Context value with memoization for performance
   */
  const contextValue = useMemo(() => ({
    // Data
    translations: Object.fromEntries(translations),
    currentLanguage,
    
    // Loading states
    isLoading: loadingState === LOADING_STATES.LOADING || loadingState === LOADING_STATES.RELOADING,
    isPreloading: loadingState === LOADING_STATES.PRELOADING || preloadingNamespaces.size > 0,
    loadingState,
    loadingNamespaces: Array.from(loadingNamespaces),
    preloadingNamespaces: Array.from(preloadingNamespaces),
    error,
    
    // Actions
    loadTranslation,
    preloadTranslation,
    reloadTranslations,
    getTranslation,
    
    // Helpers
    isNamespaceLoading,
    isNamespacePreloading,
    hasTranslation,
    
    // Cache stats (for debugging)
    getCacheStats: () => translationLoader.getCacheStats(),
  }), [
    translations,
    currentLanguage,
    loadingState,
    loadingNamespaces,
    preloadingNamespaces,
    error,
    loadTranslation,
    preloadTranslation,
    reloadTranslations,
    getTranslation,
    isNamespaceLoading,
    isNamespacePreloading,
    hasTranslation,
  ]);

  return (
    <ContextTranslationContext.Provider value={contextValue}>
      {children}
    </ContextTranslationContext.Provider>
  );
};

/**
 * Hook to use context-aware translations
 */
export const useContextTranslation = () => {
  const context = useContext(ContextTranslationContext);
  
  if (!context) {
    throw new Error('useContextTranslation must be used within a ContextTranslationProvider');
  }
  
  return context;
};

/**
 * Hook for route-specific translations
 */
export const useRouteTranslation = (additionalNamespaces = []) => {
  const location = useLocation();
  const context = useContextTranslation();
  
  const routeNamespaces = useMemo(() => {
    const base = translationLoader.getRouteNamespaces(location.pathname);
    return [...new Set([...base, ...additionalNamespaces])];
  }, [location.pathname, additionalNamespaces]);

  // Ensure route translations are loaded
  useEffect(() => {
    const loadMissingNamespaces = async () => {
      const promises = routeNamespaces
        .filter(ns => !context.hasTranslation(ns))
        .map(ns => context.loadTranslation(ns));
        
      if (promises.length > 0) {
        try {
          await Promise.allSettled(promises);
        } catch (err) {
          console.warn('Failed to load some route translations:', err);
        }
      }
    };

    loadMissingNamespaces();
  }, [routeNamespaces, context]);

  /**
   * Translate function scoped to route namespaces
   */
  const t = useCallback((key, fallback = key, namespace = null) => {
    // If namespace is specified, use it directly
    if (namespace) {
      return context.getTranslation(namespace, key, fallback);
    }
    
    // Try each route namespace in order
    for (const ns of routeNamespaces) {
      if (context.hasTranslation(ns, key)) {
        return context.getTranslation(ns, key, fallback);
      }
    }
    
    return fallback;
  }, [context, routeNamespaces]);

  return {
    ...context,
    t,
    routeNamespaces,
    isRouteLoaded: routeNamespaces.every(ns => context.hasTranslation(ns)),
  };
};

export default ContextTranslationProvider;
