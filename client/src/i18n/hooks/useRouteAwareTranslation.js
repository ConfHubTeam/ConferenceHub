import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContextTranslation } from '../providers/ContextTranslationProvider';
import { 
  getRouteNamespaces, 
  getRelatedNamespaces, 
  getLoadingStrategy,
  getCacheConfig 
} from '../config/namespaceConfig';
import { useLanguage } from '../context/LanguageContext';

/**
 * Enhanced hook for route-aware translation loading
 * Automatically manages translation loading based on current route and navigation patterns
 */
export const useRouteAwareTranslation = (options = {}) => {
  const {
    enablePreloading = true,
    enableLazyLoading = true,
    preloadOnIdle = true,
    trackNavigation = true,
    enablePredictiveLoading = true,
  } = options;

  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const context = useContextTranslation();

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [routeLoadingState, setRouteLoadingState] = useState('idle');
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [predictedRoutes, setPredictedRoutes] = useState([]);

  // Get current route namespaces with loading strategies
  const routeNamespaces = useMemo(() => {
    return getRouteNamespaces(location.pathname);
  }, [location.pathname]);

  // Track navigation history for predictive loading
  useEffect(() => {
    if (trackNavigation) {
      setNavigationHistory(prev => {
        const newHistory = [...prev, location.pathname].slice(-10); // Keep last 10 routes
        return newHistory;
      });
    }
  }, [location.pathname, trackNavigation]);

  // Predict next routes based on navigation patterns
  useEffect(() => {
    if (enablePredictiveLoading && navigationHistory.length >= 3) {
      const patterns = analyzeNavigationPatterns(navigationHistory);
      setPredictedRoutes(patterns);
    }
  }, [navigationHistory, enablePredictiveLoading]);

  /**
   * Load immediate namespaces for current route
   */
  const loadImmediateNamespaces = useCallback(async () => {
    const immediate = routeNamespaces.immediate || [];
    if (immediate.length === 0) return;

    setRouteLoadingState('loading-immediate');
    const strategy = getLoadingStrategy('immediate');

    try {
      const loadPromises = immediate.map(namespace => 
        context.loadTranslation(namespace, {
          priority: strategy.priority,
          timeout: strategy.timeout,
        })
      );

      // Track progress
      let completed = 0;
      const total = loadPromises.length;
      
      const progressPromises = loadPromises.map(async (promise) => {
        try {
          await promise;
          completed++;
          setLoadingProgress((completed / total) * 100);
        } catch (error) {
          console.warn('Failed to load immediate namespace:', error);
          completed++;
          setLoadingProgress((completed / total) * 100);
        }
      });

      await Promise.allSettled(progressPromises);
      setRouteLoadingState('immediate-complete');
    } catch (error) {
      console.error('Failed to load immediate namespaces:', error);
      setRouteLoadingState('error');
    }
  }, [routeNamespaces.immediate, context]);

  /**
   * Preload namespaces for anticipated usage
   */
  const preloadNamespaces = useCallback(async () => {
    if (!enablePreloading) return;

    const preload = routeNamespaces.preload || [];
    const related = getRelatedNamespaces(routeNamespaces.immediate || [], 0.6);
    const allPreload = [...new Set([...preload, ...related])];

    if (allPreload.length === 0) return;

    setRouteLoadingState('preloading');
    const strategy = getLoadingStrategy('preload');

    // Wait for the delay before starting preload
    setTimeout(async () => {
      try {
        await context.preloadTranslation(allPreload, {
          priority: strategy.priority,
          batchSize: 2, // Load 2 at a time to not overwhelm
        });
        setRouteLoadingState('preload-complete');
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    }, strategy.delay);
  }, [routeNamespaces, enablePreloading, context]);

  /**
   * Lazy load non-critical namespaces
   */
  const lazyLoadNamespaces = useCallback(async () => {
    if (!enableLazyLoading) return;

    const lazy = routeNamespaces.lazy || [];
    if (lazy.length === 0) return;

    const strategy = getLoadingStrategy('lazy');

    // Wait for the delay before starting lazy load
    setTimeout(async () => {
      if (preloadOnIdle && !isUserActive()) {
        try {
          await context.preloadTranslation(lazy, {
            priority: strategy.priority,
            batchSize: 1, // Very conservative for lazy loading
          });
        } catch (error) {
          console.warn('Lazy load failed:', error);
        }
      }
    }, strategy.delay);
  }, [routeNamespaces, enableLazyLoading, preloadOnIdle, context]);

  /**
   * Predictive loading based on navigation patterns
   */
  const predictiveLoadNamespaces = useCallback(async () => {
    if (!enablePredictiveLoading || predictedRoutes.length === 0) return;

    // Load namespaces for predicted routes
    const predictedNamespaces = new Set();
    
    predictedRoutes.forEach(route => {
      const namespaces = getRouteNamespaces(route);
      namespaces.immediate?.forEach(ns => predictedNamespaces.add(ns));
    });

    if (predictedNamespaces.size > 0) {
      try {
        await context.preloadTranslation(Array.from(predictedNamespaces), {
          priority: 'low',
          batchSize: 1,
        });
      } catch (error) {
        console.warn('Predictive loading failed:', error);
      }
    }
  }, [predictedRoutes, enablePredictiveLoading, context]);

  /**
   * Main loading orchestrator
   */
  const loadRouteTranslations = useCallback(async () => {
    setLoadingProgress(0);
    
    // 1. Load immediate namespaces first (blocking)
    await loadImmediateNamespaces();
    
    // 2. Start preloading in background (non-blocking)
    preloadNamespaces();
    
    // 3. Start lazy loading in background (non-blocking)
    lazyLoadNamespaces();
    
    // 4. Start predictive loading in background (non-blocking)
    predictiveLoadNamespaces();
  }, [
    loadImmediateNamespaces,
    preloadNamespaces,
    lazyLoadNamespaces,
    predictiveLoadNamespaces,
  ]);

  // Load translations when route changes
  useEffect(() => {
    loadRouteTranslations();
  }, [loadRouteTranslations]);

  // Reset loading progress when language changes
  useEffect(() => {
    setLoadingProgress(0);
    setRouteLoadingState('idle');
  }, [currentLanguage]);

  /**
   * Translation function with automatic namespace resolution
   */
  const t = useCallback((key, fallback = key, namespaceHint = null) => {
    // If namespace is explicitly provided, use it
    if (namespaceHint) {
      return context.getTranslation(namespaceHint, key, fallback);
    }

    // Try immediate namespaces first (most likely to have the key)
    const searchOrder = [
      ...(routeNamespaces.immediate || []),
      ...(routeNamespaces.preload || []),
      ...(routeNamespaces.lazy || []),
    ];

    for (const namespace of searchOrder) {
      if (context.hasTranslation(namespace, key)) {
        return context.getTranslation(namespace, key, fallback);
      }
    }

    return fallback;
  }, [context, routeNamespaces]);

  /**
   * Prefetch translations for a specific route
   */
  const prefetchRoute = useCallback(async (routePath) => {
    const namespaces = getRouteNamespaces(routePath);
    const immediate = namespaces.immediate || [];
    
    if (immediate.length > 0) {
      try {
        await context.preloadTranslation(immediate, { priority: 'medium' });
        return true;
      } catch (error) {
        console.warn(`Failed to prefetch route ${routePath}:`, error);
        return false;
      }
    }
    
    return true;
  }, [context]);

  /**
   * Enhanced navigate function with translation prefetching
   */
  const navigateWithPrefetch = useCallback(async (to, options = {}) => {
    const { prefetch = true, ...navigateOptions } = options;
    
    if (prefetch) {
      // Prefetch translations for target route
      await prefetchRoute(to);
    }
    
    navigate(to, navigateOptions);
  }, [navigate, prefetchRoute]);

  /**
   * Get loading state information
   */
  const getLoadingInfo = useCallback(() => {
    const immediate = routeNamespaces.immediate || [];
    const preload = routeNamespaces.preload || [];
    const lazy = routeNamespaces.lazy || [];

    const immediateLoaded = immediate.every(ns => context.hasTranslation(ns));
    const preloadLoaded = preload.every(ns => context.hasTranslation(ns));
    const lazyLoaded = lazy.every(ns => context.hasTranslation(ns));

    return {
      immediate: {
        namespaces: immediate,
        loaded: immediateLoaded,
        loading: immediate.some(ns => context.isNamespaceLoading(ns)),
      },
      preload: {
        namespaces: preload,
        loaded: preloadLoaded,
        loading: preload.some(ns => context.isNamespacePreloading(ns)),
      },
      lazy: {
        namespaces: lazy,
        loaded: lazyLoaded,
        loading: lazy.some(ns => context.isNamespacePreloading(ns)),
      },
      overall: {
        progress: loadingProgress,
        state: routeLoadingState,
        ready: immediateLoaded,
      },
    };
  }, [routeNamespaces, context, loadingProgress, routeLoadingState]);

  return {
    // Translation function
    t,
    
    // Loading states
    isLoading: routeLoadingState === 'loading-immediate',
    isPreloading: routeLoadingState === 'preloading',
    loadingProgress,
    routeLoadingState,
    
    // Route information
    currentRoute: location.pathname,
    routeNamespaces,
    navigationHistory,
    predictedRoutes,
    
    // Actions
    loadRouteTranslations,
    prefetchRoute,
    navigateWithPrefetch,
    
    // Detailed information
    getLoadingInfo,
    
    // Context pass-through
    ...context,
  };
};

/**
 * Analyze navigation patterns to predict next routes
 * @private
 */
function analyzeNavigationPatterns(history) {
  if (history.length < 3) return [];

  const patterns = {};
  
  // Look for sequences of 2-3 routes
  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i];
    const next = history[i + 1];
    const key = current;
    
    if (!patterns[key]) {
      patterns[key] = {};
    }
    
    patterns[key][next] = (patterns[key][next] || 0) + 1;
  }

  // Get most likely next routes for current route
  const currentRoute = history[history.length - 1];
  const currentPatterns = patterns[currentRoute] || {};
  
  return Object.entries(currentPatterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2) // Top 2 predictions
    .map(([route]) => route);
}

/**
 * Check if user is currently active (for lazy loading)
 * @private
 */
function isUserActive() {
  // Simple activity detection - can be enhanced
  return document.hasFocus() && !document.hidden;
}

export default useRouteAwareTranslation;
