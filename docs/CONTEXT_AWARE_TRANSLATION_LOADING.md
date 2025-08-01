# Context-Aware Translation Loading System

## Epic 4: Content Translation Strategy - User Story 4.2

This documentation covers the implementation of context-aware translation loading with dynamic route-based loading, preloading, caching, and fallback states.

## 🚀 Overview

The context-aware translation system provides:

- **Dynamic Loading**: Translations load based on current route and context
- **Smart Preloading**: Anticipates user navigation and preloads relevant translations  
- **Intelligent Caching**: Efficient caching with proper invalidation strategies
- **Fallback States**: Graceful loading states and error handling
- **Performance Optimization**: Lazy loading, batching, and predictive loading

## 📋 Architecture

### Core Components

1. **TranslationLoader Service** - Handles loading, caching, and preloading
2. **ContextTranslationProvider** - React context for translation state management
3. **Route-Aware Hooks** - Hooks that automatically load translations based on routes
4. **Loading Components** - UI components for different loading states
5. **HOCs and Suspense** - Higher-order components for automatic translation loading

### Loading Strategies

- **Immediate**: Critical translations loaded synchronously (5s timeout)
- **Preload**: Anticipated translations loaded in background (15s timeout)  
- **Lazy**: Non-critical translations loaded when idle (30s timeout)
- **On-Demand**: Translations loaded when specifically requested (10s timeout)

## 🛠 Setup

### 1. Provider Setup

Wrap your app with the context-aware translation provider:

```jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ContextTranslationProvider, setupContextAwareTranslations } from './i18n';
import { LanguageProvider } from './i18n/context/LanguageContext';

// Configure the system
const translationConfig = setupContextAwareTranslations({
  enablePreloading: true,
  enableLazyLoading: true,
  enablePredictiveLoading: true,
  cacheTimeout: 30 * 60 * 1000, // 30 minutes
  maxCacheSize: 50,
});

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ContextTranslationProvider>
          <Routes>
            {/* Your routes */}
          </Routes>
        </ContextTranslationProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
```

### 2. Route Configuration

Translations are automatically loaded based on route configuration in `namespaceConfig.js`:

```javascript
export const ROUTE_NAMESPACE_MAP = {
  '/': {
    immediate: ['common', 'landing'],    // Load immediately
    preload: ['search', 'user'],         // Preload in background  
    lazy: ['places'],                    // Load when idle
  },
  '/search': {
    immediate: ['common', 'search', 'places'],
    preload: ['booking', 'reviews'],
    lazy: ['user'],
  },
  // ... more routes
};
```

## 🎯 Usage Patterns

### 1. Basic Route-Aware Translation

The simplest way to use context-aware translations:

```jsx
import { useRouteAwareTranslation } from './i18n';

const SearchPage = () => {
  const { t, isLoading, loadingProgress } = useRouteAwareTranslation();

  if (isLoading) {
    return (
      <div>
        <div>Loading... {Math.round(loadingProgress)}%</div>
        <div className="progress-bar" style={{ width: `${loadingProgress}%` }} />
      </div>
    );
  }

  return (
    <div>
      <h1>{t('search.title', 'Search Results')}</h1>
      <p>{t('search.subtitle', 'Find your perfect stay')}</p>
    </div>
  );
};
```

### 2. Component with Automatic Loading (HOC)

Wrap components that require specific translations:

```jsx
import { withTranslationLoading } from './i18n';

const PlaceDetailsComponent = ({ place }) => {
  const { t } = useRouteAwareTranslation();
  
  return (
    <div>
      <h1>{place.title}</h1>
      <p>{t('places.details.hostedBy', 'Hosted by {{hostName}}', { hostName: place.host })}</p>
      <button>{t('places.details.actions.book', 'Book Now')}</button>
    </div>
  );
};

export const PlaceDetails = withTranslationLoading(PlaceDetailsComponent, {
  requiredNamespaces: ['places', 'booking'],
  fallbackComponent: () => (
    <div>
      <div className="skeleton h-8 w-3/4 mb-4" />
      <div className="skeleton h-4 w-1/2 mb-2" />
      <div className="skeleton h-10 w-24" />
    </div>
  ),
  showPreloadIndicator: true,
  loadingTimeout: 8000,
});
```

### 3. Suspense-like Loading

Declarative loading with automatic fallbacks:

```jsx
import { TranslationSuspense, TranslationSkeleton } from './i18n';

const SearchResults = () => {
  return (
    <TranslationSuspense
      requiredNamespaces={['search', 'places']}
      fallback={<TranslationSkeleton lines={3} height="large" />}
      errorFallback={({ onRetry }) => (
        <div className="error-state">
          <p>Failed to load content</p>
          <button onClick={onRetry}>Try Again</button>
        </div>
      )}
      timeout={10000}
    >
      <SearchResultsList />
    </TranslationSuspense>
  );
};
```

### 4. Manual Loading Control

Fine-grained control over translation loading:

```jsx
import { useTranslationLoading } from './i18n';

const ReviewsSection = ({ placeId }) => {
  const {
    isLoading,
    hasErrors,
    isComplete,
    loadNamespaces,
    reloadNamespaces,
    getTranslation,
  } = useTranslationLoading(['reviews', 'places'], {
    loadOnMount: false, // Don't auto-load
    preloadRelated: true,
  });

  const handleLoadReviews = () => {
    loadNamespaces(); // Manual trigger
  };

  if (!isComplete) {
    return (
      <div>
        <button onClick={handleLoadReviews} disabled={isLoading}>
          {isLoading ? 'Loading Reviews...' : 'Load Reviews'}
        </button>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="error">
        <p>Failed to load reviews</p>
        <button onClick={reloadNamespaces}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h3>{getTranslation('reviews', 'title', 'Reviews')}</h3>
      {/* Reviews content */}
    </div>
  );
};
```

### 5. Navigation with Prefetching

Enhanced navigation that preloads translations:

```jsx
import { useRouteAwareTranslation } from './i18n';

const Navigation = () => {
  const { navigateWithPrefetch, prefetchRoute } = useRouteAwareTranslation();

  return (
    <nav>
      <button 
        onClick={() => navigateWithPrefetch('/search')}
        onMouseEnter={() => prefetchRoute('/search')} // Prefetch on hover
      >
        Search
      </button>
      <button onClick={() => navigateWithPrefetch('/profile')}>
        Profile  
      </button>
    </nav>
  );
};
```

## 🎨 Loading Components

### Translation Skeleton

Smart skeleton loading for different content types:

```jsx
import { TranslationSkeleton } from './i18n';

// Text content
<TranslationSkeleton lines={3} width="full" height="text" />

// Button
<TranslationSkeleton width="quarter" height="button" />

// Title
<TranslationSkeleton width="half" height="large" />

// Custom styling
<TranslationSkeleton 
  lines={2} 
  className="my-4 bg-blue-100" 
  animate={false} 
/>
```

### Loading States

Different loading indicators for various scenarios:

```jsx
import { 
  TranslationSpinner, 
  TranslationLoadingOverlay,
  PreloadIndicator 
} from './i18n';

// Inline spinner
<TranslationSpinner size="small" color="primary" />

// Full page overlay
<TranslationLoadingOverlay 
  isVisible={isLoading}
  message="Loading your personalized content..."
  progress={loadingProgress}
/>

// Subtle preload indicator
<PreloadIndicator isVisible={isPreloading} position="top-right" />
```

### Error Handling

Graceful error states with retry functionality:

```jsx
import { TranslationError } from './i18n';

// Compact error
<TranslationError 
  error={error}
  onRetry={handleRetry}
  fallbackText="Content unavailable"
  compact={true}
/>

// Full error state
<TranslationError 
  error={error}
  onRetry={handleRetry}
  showRetry={true}
  className="my-error-styling"
/>
```

## ⚡ Performance Features

### Smart Preloading

The system automatically preloads translations based on:

- **Route relationships**: Loading `/search` preloads `places` and `booking`
- **Navigation patterns**: Learns user behavior and predicts next routes
- **User activity**: Only preloads when user is idle to avoid impacting performance

### Intelligent Caching

- **LRU Cache**: Automatically removes least recently used translations
- **TTL-based**: Different cache timeouts for different content types
- **Cross-session**: Critical translations persist across browser sessions
- **Invalidation**: Smart cache invalidation on language changes

### Performance Monitoring

Debug translation loading performance:

```jsx
const { getCacheStats, getLoadingInfo } = useRouteAwareTranslation();

// Cache statistics
const stats = getCacheStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);

// Loading information
const info = getLoadingInfo();
console.log('Immediate namespaces loaded:', info.immediate.loaded);
console.log('Overall progress:', info.overall.progress);
```

## 🔧 Configuration

### Namespace Configuration

Define namespaces and their loading strategies in `namespaceConfig.js`:

```javascript
export const TRANSLATION_NAMESPACES = {
  common: {
    priority: 'critical',
    size: 'small',
    loadStrategy: 'immediate',
    dependencies: [],
  },
  places: {
    priority: 'high', 
    size: 'large',
    loadStrategy: 'route-based',
    dependencies: ['common'],
  },
  // ... more namespaces
};
```

### Cache Configuration

Customize caching behavior per namespace:

```javascript
export const CACHE_CONFIG = {
  common: {
    ttl: 60 * 60 * 1000, // 1 hour
    priority: 'critical',
    persistAcrossSessions: true,
  },
  places: {
    ttl: 15 * 60 * 1000, // 15 minutes
    priority: 'medium', 
    persistAcrossSessions: false,
  },
};
```

### Loading Strategies

Define different loading behaviors:

```javascript
export const LOADING_STRATEGIES = {
  immediate: {
    timeout: 5000,
    retries: 3,
    priority: 'high',
    showLoader: true,
  },
  preload: {
    timeout: 15000,
    retries: 2,
    priority: 'medium',
    showLoader: false,
    delay: 1000,
  },
};
```

## 🐛 Debugging

### Debug Mode

Enable detailed logging and monitoring:

```jsx
const MyComponent = () => {
  const { getLoadingInfo, getCacheStats } = useRouteAwareTranslation();
  const [showDebug, setShowDebug] = useState(false);

  const loadingInfo = getLoadingInfo();
  const cacheStats = getCacheStats();

  return (
    <div>
      {/* Your content */}
      
      {showDebug && (
        <div className="debug-panel">
          <h4>Translation Loading Debug</h4>
          <pre>{JSON.stringify(loadingInfo, null, 2)}</pre>
          <pre>{JSON.stringify(cacheStats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

### Performance Monitoring

Track loading performance:

```javascript
// Monitor loading times
window.translationPerformance = {
  start: Date.now(),
  stages: [],
};

// In your components
useEffect(() => {
  if (!isLoading && window.translationPerformance) {
    const duration = Date.now() - window.translationPerformance.start;
    console.log(`Translations loaded in ${duration}ms`);
  }
}, [isLoading]);
```

## 🎯 Best Practices

### 1. Namespace Organization

- Keep namespaces focused and small (< 30KB)
- Group related translations together
- Use clear, descriptive namespace names
- Define dependencies between namespaces

### 2. Loading Strategy Selection

- **Immediate**: Critical UI elements (buttons, navigation)
- **Preload**: Likely next actions (search → places → booking)  
- **Lazy**: Optional content (help, advanced features)

### 3. Error Handling

- Always provide fallback text
- Implement retry functionality
- Show meaningful error messages
- Gracefully degrade functionality

### 4. Performance Optimization

- Use `TranslationSuspense` for route-level loading
- Implement skeleton loading for better UX
- Monitor cache hit rates and adjust TTL accordingly
- Use preloading strategically to avoid over-fetching

### 5. Testing

Test different scenarios:

```javascript
// Mock slow loading
const mockSlowLoading = () => {
  return new Promise(resolve => setTimeout(resolve, 5000));
};

// Mock errors
const mockLoadingError = () => {
  throw new Error('Network error');
};

// Test loading states
test('shows loading skeleton while translations load', async () => {
  render(<MyComponent />);
  expect(screen.getByTestId('translation-skeleton')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Translated Content')).toBeInTheDocument();
  });
});
```

## 📊 Migration Guide

### From Basic i18next

If migrating from basic i18next usage:

```jsx
// Before
const { t } = useTranslation();
return <h1>{t('title')}</h1>;

// After  
const { t } = useRouteAwareTranslation();
return <h1>{t('title')}</h1>; // Same API, enhanced loading
```

### Adding Loading States

Enhance existing components with loading states:

```jsx
// Before
const MyComponent = () => {
  const { t } = useTranslation();
  return <div>{t('content')}</div>;
};

// After
const MyComponent = withTranslationLoading(
  () => {
    const { t } = useRouteAwareTranslation();
    return <div>{t('content')}</div>;
  },
  { requiredNamespaces: ['myNamespace'] }
);
```

## 🎉 Summary

The context-aware translation loading system provides:

✅ **Dynamic Loading** - Route-based translation loading  
✅ **Smart Preloading** - Anticipates user navigation  
✅ **Intelligent Caching** - Efficient caching with TTL and LRU  
✅ **Fallback States** - Graceful loading and error handling  
✅ **Performance** - Lazy loading, batching, predictive loading  
✅ **Developer Experience** - Multiple usage patterns and debugging tools  
✅ **User Experience** - Smooth loading states and responsive UI  

This implementation satisfies all acceptance criteria for **User Story 4.2: Context-aware translation loading** and provides a robust foundation for scalable, performance-optimized internationalization in your Airbnb clone application.
