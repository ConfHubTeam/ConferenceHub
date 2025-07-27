import React from 'react';
import PropTypes from 'prop-types';

/**
 * Translation Loading Skeleton
 * Shows skeleton loading states while translations are being loaded
 */
export const TranslationSkeleton = ({ 
  lines = 1, 
  width = 'full', 
  height = 'text',
  className = '',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 rounded ${animate ? 'animate-pulse' : ''}`;
  
  const widthClasses = {
    'quarter': 'w-1/4',
    'half': 'w-1/2',
    'three-quarters': 'w-3/4',
    'full': 'w-full',
  };
  
  const heightClasses = {
    'text': 'h-4',
    'small': 'h-3',
    'medium': 'h-6',
    'large': 'h-8',
    'button': 'h-10',
  };

  if (lines === 1) {
    return (
      <div 
        className={`${baseClasses} ${widthClasses[width]} ${heightClasses[height]} ${className}`}
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => {
        // Vary the width for more realistic skeleton
        const lineWidth = index === lines - 1 && lines > 1 ? 'three-quarters' : width;
        
        return (
          <div
            key={index}
            className={`${baseClasses} ${widthClasses[lineWidth]} ${heightClasses[height]}`}
          />
        );
      })}
    </div>
  );
};

TranslationSkeleton.propTypes = {
  lines: PropTypes.number,
  width: PropTypes.oneOf(['quarter', 'half', 'three-quarters', 'full']),
  height: PropTypes.oneOf(['text', 'small', 'medium', 'large', 'button']),
  className: PropTypes.string,
  animate: PropTypes.bool,
};

/**
 * Translation Loading Spinner
 * Compact spinner for inline loading states
 */
export const TranslationSpinner = ({ 
  size = 'small', 
  className = '',
  color = 'current'
}) => {
  const sizeClasses = {
    'tiny': 'w-3 h-3',
    'small': 'w-4 h-4',
    'medium': 'w-6 h-6',
    'large': 'w-8 h-8',
  };

  const colorClasses = {
    'current': 'text-current',
    'primary': 'text-blue-600',
    'secondary': 'text-gray-600',
    'white': 'text-white',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

TranslationSpinner.propTypes = {
  size: PropTypes.oneOf(['tiny', 'small', 'medium', 'large']),
  className: PropTypes.string,
  color: PropTypes.oneOf(['current', 'primary', 'secondary', 'white']),
};

/**
 * Translation Error Fallback
 * Shows error state when translation loading fails
 */
export const TranslationError = ({ 
  error, 
  onRetry, 
  fallbackText = "Content unavailable",
  className = '',
  showRetry = true,
  compact = false
}) => {
  if (compact) {
    return (
      <span className={`text-red-600 text-sm ${className}`}>
        {fallbackText}
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Translation Loading Failed
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error?.message || "Unable to load content for this section."}</p>
            <p className="mt-1">Showing fallback content: "{fallbackText}"</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="bg-red-100 px-2 py-1 rounded text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TranslationError.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
  fallbackText: PropTypes.string,
  className: PropTypes.string,
  showRetry: PropTypes.bool,
  compact: PropTypes.bool,
};

/**
 * Translation Loading Overlay
 * Full overlay for page-level loading states
 */
export const TranslationLoadingOverlay = ({ 
  isVisible = false, 
  message = "Loading content...",
  progress = null // 0-100 percentage
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <TranslationSpinner size="large" color="primary" className="mx-auto" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
        {progress !== null && (
          <div className="mt-4 w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

TranslationLoadingOverlay.propTypes = {
  isVisible: PropTypes.bool,
  message: PropTypes.string,
  progress: PropTypes.number,
};

/**
 * Preload Indicator
 * Subtle indicator for preloading states
 */
export const PreloadIndicator = ({ 
  isVisible = false,
  position = 'top-right',
  className = ''
}) => {
  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      <div className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-2 shadow-md">
        <div className="flex items-center space-x-2">
          <TranslationSpinner size="tiny" color="primary" />
          <span className="text-blue-800 text-sm font-medium">
            Preloading content...
          </span>
        </div>
      </div>
    </div>
  );
};

PreloadIndicator.propTypes = {
  isVisible: PropTypes.bool,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  className: PropTypes.string,
};

export default {
  TranslationSkeleton,
  TranslationSpinner,
  TranslationError,
  TranslationLoadingOverlay,
  PreloadIndicator,
};
