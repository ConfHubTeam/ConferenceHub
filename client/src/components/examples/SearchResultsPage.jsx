import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRouteAwareTranslation } from '../hooks/useRouteAwareTranslation';
import { withTranslationLoading, TranslationSuspense } from '../hoc/withTranslationLoading';
import { 
  TranslationSkeleton, 
  TranslationSpinner,
  PreloadIndicator 
} from '../components/TranslationLoading';

/**
 * Example Component: Search Results Page
 * Demonstrates context-aware translation loading with all features
 */
const SearchResultsPage = () => {
  const {
    t,
    isLoading,
    isPreloading,
    loadingProgress,
    routeLoadingState,
    getLoadingInfo,
    prefetchRoute,
    navigateWithPrefetch,
  } = useRouteAwareTranslation({
    enablePreloading: true,
    enableLazyLoading: true,
    enablePredictiveLoading: true,
  });

  const [debugMode, setDebugMode] = useState(false);

  // Mock search results data
  const searchResults = [
    { id: 1, title: 'Cozy Apartment', price: 120 },
    { id: 2, title: 'Modern Loft', price: 180 },
    { id: 3, title: 'Beach House', price: 250 },
  ];

  const loadingInfo = getLoadingInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-blue-600 h-1 transition-all duration-300" 
               style={{ width: `${loadingProgress}%` }} />
        </div>
      )}

      {/* Preload Indicator */}
      <PreloadIndicator isVisible={isPreloading} position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Translation Loading Demo */}
        <div className="mb-8">
          <TranslationSuspense
            requiredNamespaces={['search', 'common']}
            fallback={<TranslationSkeleton lines={2} height="large" />}
            timeout={5000}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('search.title', 'Search Results')}
            </h1>
            <p className="text-gray-600">
              {t('search.subtitle', 'Find your perfect stay')}
            </p>
          </TranslationSuspense>
        </div>

        {/* Search Filters - Demonstrates lazy loading */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <TranslationSuspense
            requiredNamespaces={['search']}
            fallback={
              <div className="flex space-x-4">
                <TranslationSkeleton width="quarter" height="button" />
                <TranslationSkeleton width="quarter" height="button" />
                <TranslationSkeleton width="quarter" height="button" />
              </div>
            }
          >
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400">
                {t('search.filters.priceRange', 'Price Range')}
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400">
                {t('search.filters.propertyType', 'Property Type')}
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400">
                {t('search.filters.amenities', 'Amenities')}
              </button>
            </div>
          </TranslationSuspense>
        </div>

        {/* Search Results - Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {searchResults.map((result) => (
            <SearchResultCard 
              key={result.id} 
              result={result} 
              onPrefetchPlace={() => prefetchRoute(`/place/${result.id}`)}
            />
          ))}
        </div>

        {/* Navigation with Prefetching Demo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {t('navigation.quickLinks', 'Quick Links')}
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateWithPrefetch('/profile')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('navigation.profile', 'My Profile')}
            </button>
            <button
              onClick={() => navigateWithPrefetch('/trips')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {t('navigation.trips', 'My Trips')}
            </button>
            <button
              onClick={() => navigateWithPrefetch('/host')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              {t('navigation.host', 'Become a Host')}
            </button>
          </div>
        </div>

        {/* Debug Information Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Translation Loading Debug</h3>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {debugMode ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>

          {debugMode && (
            <div className="space-y-4 text-sm">
              {/* Overall Status */}
              <div>
                <h4 className="font-medium mb-2">Overall Status</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>State:</strong> {routeLoadingState}</p>
                  <p><strong>Progress:</strong> {Math.round(loadingProgress)}%</p>
                  <p><strong>Ready:</strong> {loadingInfo.overall.ready ? '✅' : '❌'}</p>
                </div>
              </div>

              {/* Immediate Namespaces */}
              <div>
                <h4 className="font-medium mb-2">Immediate Namespaces</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {loadingInfo.immediate.namespaces.map(ns => (
                    <div key={ns} className="flex justify-between">
                      <span>{ns}</span>
                      <span>
                        {loadingInfo.immediate.loading ? 
                          <TranslationSpinner size="tiny" /> : 
                          (loadingInfo.immediate.loaded ? '✅' : '❌')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preload Namespaces */}
              <div>
                <h4 className="font-medium mb-2">Preload Namespaces</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {loadingInfo.preload.namespaces.map(ns => (
                    <div key={ns} className="flex justify-between">
                      <span>{ns}</span>
                      <span>
                        {loadingInfo.preload.loading ? 
                          <TranslationSpinner size="tiny" /> : 
                          (loadingInfo.preload.loaded ? '✅' : '⏳')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lazy Namespaces */}
              <div>
                <h4 className="font-medium mb-2">Lazy Namespaces</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {loadingInfo.lazy.namespaces.map(ns => (
                    <div key={ns} className="flex justify-between">
                      <span>{ns}</span>
                      <span>
                        {loadingInfo.lazy.loading ? 
                          <TranslationSpinner size="tiny" /> : 
                          (loadingInfo.lazy.loaded ? '✅' : '⏳')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Search Result Card Component
 * Demonstrates per-component translation loading
 */
const SearchResultCard = withTranslationLoading(
  ({ result, onPrefetchPlace }) => {
    const { t } = useRouteAwareTranslation();

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-48 bg-gray-200 relative">
          {/* Placeholder image */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {t('common.imagePlaceholder', 'Image')}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
          <p className="text-gray-600 mb-3">
            {t('places.pricePerNight', 'per night', 'places')}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">${result.price}</span>
            <Link
              to={`/place/${result.id}`}
              onMouseEnter={onPrefetchPlace}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('common.viewDetails', 'View Details')}
            </Link>
          </div>
        </div>
      </div>
    );
  },
  {
    requiredNamespaces: ['places', 'common'],
    fallbackComponent: () => (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TranslationSkeleton height="large" className="h-48" />
        <div className="p-4">
          <TranslationSkeleton width="three-quarters" className="mb-2" />
          <TranslationSkeleton width="half" className="mb-3" />
          <div className="flex justify-between items-center">
            <TranslationSkeleton width="quarter" />
            <TranslationSkeleton width="quarter" height="button" />
          </div>
        </div>
      </div>
    ),
    showPreloadIndicator: false,
  }
);

export default SearchResultsPage;
