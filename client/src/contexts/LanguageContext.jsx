import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from "../i18n/config";

// Create Language Context with enhanced functionality
const LanguageContext = createContext({
  currentLanguage: "en",
  currentLanguageObject: {},
  availableLanguages: [],
  changeLanguage: () => {},
  isLoading: false,
  direction: "ltr",
  isInitialized: false
});

/**
 * Enhanced Language Provider Component
 * Manages global language state with session persistence and immediate UI updates
 * Features: localStorage persistence, browser session restoration, immediate updates
 */
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Enhanced persistence: check sessionStorage first, then localStorage, then fallback
    const sessionLang = sessionStorage.getItem("current-language");
    const storedLang = localStorage.getItem("preferred-language");
    return sessionLang || storedLang || getCurrentLanguage();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableLanguages] = useState(() => getAvailableLanguages());

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Apply stored language preference immediately
        if (currentLanguage !== getCurrentLanguage()) {
          await changeLanguage(currentLanguage);
        }
        
        // Set document attributes immediately
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = "ltr"; // All supported languages are LTR
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing language:", error);
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  // Handle language change with enhanced persistence and immediate updates
  const handleLanguageChange = useCallback(async (newLanguage) => {
    if (newLanguage === currentLanguage || isLoading) return;

    setIsLoading(true);
    try {
      // Change language immediately for instant UI updates
      await changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      
      // Update document attributes immediately
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = "ltr";
      
      // Persist to both localStorage and sessionStorage for enhanced session management
      localStorage.setItem("preferred-language", newLanguage);
      sessionStorage.setItem("current-language", newLanguage);
      localStorage.setItem("language-changed-at", new Date().toISOString());
      
      // Dispatch enhanced custom event for other components
      window.dispatchEvent(new CustomEvent("languageChanged", { 
        detail: { 
          language: newLanguage,
          previousLanguage: currentLanguage,
          timestamp: Date.now()
        } 
      }));
      
      // Force re-render of any cached content
      window.dispatchEvent(new CustomEvent("forceRefresh"));
      
    } catch (error) {
      console.error("Error changing language:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Check for stored preference
        const storedLanguage = localStorage.getItem("preferred-language");
        const browserLanguage = navigator.language?.split("-")[0];
        
        // Determine initial language
        let initialLanguage = currentLanguage;
        
        if (storedLanguage && availableLanguages.some(lang => lang.code === storedLanguage)) {
          initialLanguage = storedLanguage;
        } else if (browserLanguage && availableLanguages.some(lang => lang.code === browserLanguage)) {
          initialLanguage = browserLanguage;
        }
        
        // Set initial language if different from current
        if (initialLanguage !== currentLanguage) {
          await handleLanguageChange(initialLanguage);
        } else {
          // Set document attributes even if language is the same
          document.documentElement.lang = currentLanguage;
          document.documentElement.dir = "ltr";
        }
      } catch (error) {
        console.error("Error initializing language:", error);
      }
    };

    initializeLanguage();
  }, []); // Only run on mount

  // Get current language object
  const currentLanguageObject = availableLanguages.find(
    lang => lang.code === currentLanguage
  ) || availableLanguages[0];

  // Context value with enhanced functionality
  const contextValue = {
    currentLanguage,
    currentLanguageObject,
    availableLanguages,
    changeLanguage: handleLanguageChange,
    isLoading,
    isInitialized,
    direction: "ltr", // All supported languages are left-to-right
    isRTL: false
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use Language Context
 * @returns {Object} Language context value
 */
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  
  return context;
};

/**
 * Higher-Order Component to inject language context
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with language props
 */
export const withLanguage = (Component) => {
  const WrappedComponent = (props) => {
    const languageContext = useLanguageContext();
    
    return (
      <Component
        {...props}
        language={languageContext.currentLanguage}
        availableLanguages={languageContext.availableLanguages}
        changeLanguage={languageContext.changeLanguage}
        isLanguageLoading={languageContext.isLoading}
        direction={languageContext.direction}
      />
    );
  };
  
  WrappedComponent.displayName = `withLanguage(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default LanguageContext;
