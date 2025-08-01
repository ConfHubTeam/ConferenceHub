import React from "react";
import { useEnhancedTranslation } from "../hooks/useEnhancedTranslation";

/**
 * Higher Order Component for automatic translation injection
 * Provides translation functionality to any component
 */
export const withTranslation = (namespace = "common", options = {}) => {
  return function WithTranslationWrapper(WrappedComponent) {
    const TranslatedComponent = React.forwardRef((props, ref) => {
      const translation = useEnhancedTranslation(namespace, options);
      
      return (
        <WrappedComponent
          ref={ref}
          {...props}
          translation={translation}
          t={translation.translate}
          currentLanguage={translation.currentLanguage}
          isRTL={translation.isRTL()}
          direction={translation.getDirection()}
        />
      );
    });

    // Set display name for debugging
    TranslatedComponent.displayName = `withTranslation(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return TranslatedComponent;
  };
};

/**
 * Translation-aware component wrapper for declarative usage
 */
export const TranslationProvider = ({ 
  children, 
  namespace = "common", 
  options = {},
  render 
}) => {
  const translation = useEnhancedTranslation(namespace, options);
  
  if (render) {
    return render(translation);
  }
  
  if (typeof children === "function") {
    return children(translation);
  }
  
  return React.cloneElement(children, { translation });
};

/**
 * Translation-aware error boundary
 */
export class TranslationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Translation Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI with basic error message
      const fallbackMessage = this.props.fallbackMessage || "Something went wrong";
      
      if (this.props.fallbackComponent) {
        return React.createElement(this.props.fallbackComponent, {
          error: this.state.error,
          message: fallbackMessage
        });
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm mt-1">{fallbackMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation;
