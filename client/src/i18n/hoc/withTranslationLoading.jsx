import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useContextTranslation } from '../providers/ContextTranslationProvider';
import { 
  TranslationSkeleton, 
  TranslationError, 
  TranslationSpinner,
  PreloadIndicator 
} from '../components/TranslationLoading';

/**
 * Higher-Order Component for automatic translation loading
 * Wraps components with translation loading, error handling, and fallback states
 */
export const withTranslationLoading = (WrappedComponent, options = {}) => {
  const {
    requiredNamespaces = [],
    fallbackComponent = TranslationSkeleton,
    errorComponent = TranslationError,
    loadingTimeout = 10000, // 10 seconds
    showPreloadIndicator = false,
    retryOnError = true,
    preloadRelated = true,
  } = options;

  const TranslationLoadingWrapper = (props) => {
    const context = useContextTranslation();
    const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Determine required namespaces (from options or props)
    const namespacesToLoad = useMemo(() => {
      const fromOptions = Array.isArray(requiredNamespaces) 
        ? requiredNamespaces 
        : [requiredNamespaces].filter(Boolean);
      
      const fromProps = props.requiredNamespaces 
        ? (Array.isArray(props.requiredNamespaces) 
           ? props.requiredNamespaces 
           : [props.requiredNamespaces])
        : [];

      return [...new Set([...fromOptions, ...fromProps])];
    }, [props.requiredNamespaces]);

    // Check loading states
    const isLoading = useMemo(() => {
      return namespacesToLoad.some(ns => context.isNamespaceLoading(ns)) ||
             namespacesToLoad.some(ns => !context.hasTranslation(ns));
    }, [namespacesToLoad, context]);

    const hasError = useMemo(() => {
      return context.error && namespacesToLoad.length > 0;
    }, [context.error, namespacesToLoad]);

    const isPreloading = useMemo(() => {
      return namespacesToLoad.some(ns => context.isNamespacePreloading(ns));
    }, [namespacesToLoad, context]);

    // Load required namespaces
    useEffect(() => {
      const loadNamespaces = async () => {
        if (namespacesToLoad.length === 0) return;

        try {
          // Load required namespaces in parallel
          const loadPromises = namespacesToLoad.map(namespace => 
            context.loadTranslation(namespace, { priority: 'high' })
          );

          await Promise.allSettled(loadPromises);

          // Preload related namespaces if enabled
          if (preloadRelated) {
            const { translationLoader } = await import('../services/translationLoader');
            const relatedNamespaces = translationLoader.getRelatedNamespaces(namespacesToLoad);
            
            if (relatedNamespaces.length > 0) {
              context.preloadTranslation(relatedNamespaces);
            }
          }
        } catch (error) {
          console.error('Failed to load translations:', error);
        }
      };

      loadNamespaces();
    }, [namespacesToLoad, context, preloadRelated, retryCount]);

    // Loading timeout
    useEffect(() => {
      if (!isLoading || loadingTimeout <= 0) return;

      const timer = setTimeout(() => {
        setLoadingTimeoutReached(true);
      }, loadingTimeout);

      return () => clearTimeout(timer);
    }, [isLoading, loadingTimeout]);

    // Reset timeout when loading state changes
    useEffect(() => {
      if (!isLoading) {
        setLoadingTimeoutReached(false);
      }
    }, [isLoading]);

    // Retry function
    const handleRetry = () => {
      setRetryCount(prev => prev + 1);
      setLoadingTimeoutReached(false);
      
      // Force reload all required namespaces
      namespacesToLoad.forEach(namespace => {
        context.loadTranslation(namespace, { force: true });
      });
    };

    // Error state
    if (hasError && (!isLoading || loadingTimeoutReached)) {
      const ErrorComponent = errorComponent;
      
      return (
        <ErrorComponent
          error={context.error}
          onRetry={retryOnError ? handleRetry : null}
          fallbackText="Content temporarily unavailable"
          showRetry={retryOnError}
        />
      );
    }

    // Loading state
    if (isLoading && !loadingTimeoutReached) {
      const FallbackComponent = fallbackComponent;
      
      // If fallback is our TranslationSkeleton, provide smart defaults
      if (FallbackComponent === TranslationSkeleton) {
        return (
          <>
            <FallbackComponent
              lines={3}
              width="full"
              height="text"
              className="my-4"
            />
            {showPreloadIndicator && <PreloadIndicator isVisible={isPreloading} />}
          </>
        );
      }
      
      return (
        <>
          <FallbackComponent />
          {showPreloadIndicator && <PreloadIndicator isVisible={isPreloading} />}
        </>
      );
    }

    // Success state - render the wrapped component
    return (
      <>
        <WrappedComponent {...props} />
        {showPreloadIndicator && <PreloadIndicator isVisible={isPreloading} />}
      </>
    );
  };

  TranslationLoadingWrapper.displayName = `withTranslationLoading(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  TranslationLoadingWrapper.propTypes = {
    requiredNamespaces: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
  };

  return TranslationLoadingWrapper;
};

/**
 * Hook for conditional translation loading
 * Provides fine-grained control over translation loading states
 */
export const useTranslationLoading = (namespaces, options = {}) => {
  const {
    loadOnMount = true,
    preloadRelated = false,
    priority = 'normal',
  } = options;

  const context = useContextTranslation();
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});

  const namespacesToLoad = useMemo(() => {
    return Array.isArray(namespaces) ? namespaces : [namespaces].filter(Boolean);
  }, [namespaces]);

  // Load namespaces
  const loadNamespaces = async (forceReload = false) => {
    const loadPromises = namespacesToLoad.map(async (namespace) => {
      setLoadingStates(prev => ({ ...prev, [namespace]: true }));
      setErrors(prev => ({ ...prev, [namespace]: null }));

      try {
        await context.loadTranslation(namespace, { 
          force: forceReload,
          priority 
        });
        
        setLoadingStates(prev => ({ ...prev, [namespace]: false }));
        return { namespace, success: true };
      } catch (error) {
        setErrors(prev => ({ ...prev, [namespace]: error }));
        setLoadingStates(prev => ({ ...prev, [namespace]: false }));
        return { namespace, success: false, error };
      }
    });

    const results = await Promise.allSettled(loadPromises);
    
    // Preload related if all successful and enabled
    if (preloadRelated && results.every(r => r.status === 'fulfilled' && r.value.success)) {
      const { translationLoader } = await import('../services/translationLoader');
      const relatedNamespaces = translationLoader.getRelatedNamespaces(namespacesToLoad);
      
      if (relatedNamespaces.length > 0) {
        context.preloadTranslation(relatedNamespaces);
      }
    }

    return results;
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    if (loadOnMount && namespacesToLoad.length > 0) {
      loadNamespaces();
    }
  }, [loadOnMount, namespacesToLoad]);

  // Compute aggregate states
  const isLoading = useMemo(() => {
    return namespacesToLoad.some(ns => 
      loadingStates[ns] || 
      context.isNamespaceLoading(ns) ||
      !context.hasTranslation(ns)
    );
  }, [namespacesToLoad, loadingStates, context]);

  const hasErrors = useMemo(() => {
    return namespacesToLoad.some(ns => errors[ns]);
  }, [namespacesToLoad, errors]);

  const isComplete = useMemo(() => {
    return namespacesToLoad.every(ns => context.hasTranslation(ns));
  }, [namespacesToLoad, context]);

  const isPreloading = useMemo(() => {
    return namespacesToLoad.some(ns => context.isNamespacePreloading(ns));
  }, [namespacesToLoad, context]);

  return {
    // States
    isLoading,
    hasErrors,
    isComplete,
    isPreloading,
    errors,
    loadingStates,
    
    // Actions
    loadNamespaces,
    reloadNamespaces: () => loadNamespaces(true),
    
    // Data
    namespaces: namespacesToLoad,
    getTranslation: context.getTranslation,
    hasTranslation: context.hasTranslation,
  };
};

/**
 * Suspense-like component for translation loading
 * Provides a declarative way to handle translation loading states
 */
export const TranslationSuspense = ({ 
  children, 
  fallback = <TranslationSkeleton lines={2} />,
  errorFallback = <TranslationError />,
  requiredNamespaces = [],
  timeout = 10000,
}) => {
  const { 
    isLoading, 
    hasErrors, 
    isComplete,
    reloadNamespaces 
  } = useTranslationLoading(requiredNamespaces, {
    loadOnMount: true,
    preloadRelated: true,
  });

  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout handling
  useEffect(() => {
    if (!isLoading || timeout <= 0) return;

    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  useEffect(() => {
    if (!isLoading) {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  // Error state
  if (hasErrors || (isLoading && timeoutReached)) {
    if (React.isValidElement(errorFallback)) {
      return errorFallback;
    }
    
    const ErrorComponent = errorFallback;
    return <ErrorComponent onRetry={reloadNamespaces} />;
  }

  // Loading state
  if (isLoading || !isComplete) {
    return fallback;
  }

  // Success state
  return children;
};

TranslationSuspense.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  errorFallback: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  requiredNamespaces: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  timeout: PropTypes.number,
};

export default {
  withTranslationLoading,
  useTranslationLoading,
  TranslationSuspense,
};
