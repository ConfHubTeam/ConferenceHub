import React from "react";
import { useTranslation } from "../../i18n/hooks/useTranslation";

/**
 * Language-Aware Error Boundary
 * Displays error messages in the current language
 * Ensures consistent language experience across error states
 */
class LanguageAwareErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error with language context
    console.error("Error caught by boundary:", {
      error,
      errorInfo,
      language: localStorage.getItem("preferred-language") || "en"
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component with Language Support
 */
const ErrorFallback = ({ error, resetError }) => {
  const { t } = useTranslation("common");

  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t("states.error.default")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("states.error.general") || "Something went wrong. Please try again."}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleRefresh}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t("actions.data.refresh")}
          </button>
          
          <button
            onClick={() => window.location.href = "/"}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t("navigation.main.home")}
          </button>
        </div>

        {/* Developer info in non-production */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-8 p-4 bg-gray-100 rounded-md text-xs">
            <summary className="cursor-pointer font-medium text-gray-700">
              Developer Details
            </summary>
            <pre className="mt-2 text-red-600 whitespace-pre-wrap">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default LanguageAwareErrorBoundary;
