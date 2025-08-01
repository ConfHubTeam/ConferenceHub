/**
 * Context-Aware Translation System
 * Epic 4: Content Translation Strategy - User Story 4.2
 * 
 * This module provides comprehensive context-aware translation loading
 * with dynamic route-based loading, preloading, caching, and fallback states.
 */

// Core Services
export { translationLoader } from './services/translationLoader';

// Context Providers
export { 
  ContextTranslationProvider,
  useContextTranslation,
  useRouteTranslation,
  LOADING_STATES
} from './providers/ContextTranslationProvider';

// Hooks
export { useRouteAwareTranslation } from './hooks/useRouteAwareTranslation';
export { useEnhancedTranslation } from './hooks/useEnhancedTranslation';
export { useTranslatedValidation } from './hooks/useTranslatedValidation';

// Higher-Order Components
export { 
  withTranslationLoading,
  useTranslationLoading,
  TranslationSuspense
} from './hoc/withTranslationLoading';
export { withTranslation } from './hoc/withTranslation';

// Loading Components
export {
  TranslationSkeleton,
  TranslationSpinner, 
  TranslationError,
  TranslationLoadingOverlay,
  PreloadIndicator
} from './components/TranslationLoading';

// Form Components
export {
  TranslatedInput,
  TranslatedSelect,
  TranslatedTextarea,
  TranslatedButton
} from './components/forms';

// Configuration
export {
  TRANSLATION_NAMESPACES,
  ROUTE_NAMESPACE_MAP,
  NAMESPACE_RELATIONSHIPS,
  LOADING_STRATEGIES,
  CACHE_CONFIG,
  getRouteNamespaces,
  getRelatedNamespaces,
  getCacheConfig,
  getLoadingStrategy,
  shouldPersistNamespace
} from './config/namespaceConfig';

// Example Components (for demonstration)
export { default as SearchResultsPage } from './components/examples/SearchResultsPage';

/**
 * Complete setup function for context-aware translations
 * Call this in your main App component to initialize the system
 */
export const setupContextAwareTranslations = (options = {}) => {
  const {
    enablePreloading = true,
    enableLazyLoading = true,
    enablePredictiveLoading = true,
    cacheTimeout = 30 * 60 * 1000, // 30 minutes
    maxCacheSize = 50,
  } = options;

  // Configure translation loader
  import('./services/translationLoader').then(({ translationLoader }) => {
    translationLoader.cacheTimeout = cacheTimeout;
    translationLoader.maxCacheSize = maxCacheSize;
  });

  return {
    enablePreloading,
    enableLazyLoading,
    enablePredictiveLoading,
  };
};

/**
 * Usage Examples:
 * 
 * 1. Basic Route-Aware Translation:
 * ```jsx
 * import { useRouteAwareTranslation } from './i18n';
 * 
 * const MyComponent = () => {
 *   const { t, isLoading } = useRouteAwareTranslation();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return <h1>{t('title', 'Default Title')}</h1>;
 * };
 * ```
 * 
 * 2. Component with Automatic Loading:
 * ```jsx
 * import { withTranslationLoading } from './i18n';
 * 
 * const MyComponent = withTranslationLoading(
 *   ({ title }) => <h1>{title}</h1>,
 *   { requiredNamespaces: ['common', 'places'] }
 * );
 * ```
 * 
 * 3. Suspense-like Loading:
 * ```jsx
 * import { TranslationSuspense } from './i18n';
 * 
 * <TranslationSuspense
 *   requiredNamespaces={['search', 'places']}
 *   fallback={<LoadingSkeleton />}
 * >
 *   <SearchResults />
 * </TranslationSuspense>
 * ```
 * 
 * 4. Manual Loading Control:
 * ```jsx
 * import { useTranslationLoading } from './i18n';
 * 
 * const MyComponent = () => {
 *   const { 
 *     isLoading, 
 *     hasErrors, 
 *     loadNamespaces,
 *     getTranslation 
 *   } = useTranslationLoading(['places', 'reviews']);
 *   
 *   return (
 *     <div>
 *       {isLoading && <Spinner />}
 *       {hasErrors && <ErrorMessage onRetry={() => loadNamespaces(true)} />}
 *       <h1>{getTranslation('places', 'title', 'Places')}</h1>
 *     </div>
 *   );
 * };
 * ```
 */

export default {
  setupContextAwareTranslations,
  // Re-export commonly used items for convenience
  useRouteAwareTranslation,
  withTranslationLoading,
  TranslationSuspense,
  ContextTranslationProvider,
};
