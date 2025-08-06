import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { changeLanguage as i18nChangeLanguage, getCurrentLanguage, getAvailableLanguages } from "../i18n/config";
import { getLanguagePreference, updateLanguagePreference, getUserProfile } from "../services/userService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableLanguages] = useState(() => getAvailableLanguages());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Get current language from i18n or storage
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Check storage first for immediate language detection
    const storedLang = localStorage.getItem("preferred-language") || 
                       sessionStorage.getItem("current-language");
    
    if (storedLang && ["en", "ru", "uz"].includes(storedLang)) {
      return storedLang;
    }
    
    return getCurrentLanguage() || "en";
  });

  // Check authentication status and sync language with backend
  const syncLanguageWithBackend = useCallback(async () => {
    try {
      console.log("🔄 Syncing language with backend...");
      
      // Check if user is authenticated by getting their profile
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        setIsAuthenticated(true);
        console.log(`👤 User authenticated, preferred language: ${userProfile.preferredLanguage}`);
        
        // If user has a preferred language, use it
        if (userProfile.preferredLanguage && 
            availableLanguages.some(lang => lang.code === userProfile.preferredLanguage)) {
          
          const currentI18nLang = getCurrentLanguage();
          console.log(`🌐 Current i18n language: ${currentI18nLang}, User preference: ${userProfile.preferredLanguage}`);
          
          // Only change if different from current
          if (userProfile.preferredLanguage !== currentI18nLang) {
            console.log(`🔄 Changing language from ${currentI18nLang} to ${userProfile.preferredLanguage}`);
            await i18nChangeLanguage(userProfile.preferredLanguage);
            setCurrentLanguage(userProfile.preferredLanguage);
            
            // Update local storage
            localStorage.setItem("preferred-language", userProfile.preferredLanguage);
            sessionStorage.setItem("current-language", userProfile.preferredLanguage);
          }
        }
      } else {
        setIsAuthenticated(false);
        console.log("👤 User not authenticated, using local storage preference");
        
        // For unauthenticated users, use local storage preference
        const storedLang = localStorage.getItem("preferred-language");
        if (storedLang && availableLanguages.some(lang => lang.code === storedLang)) {
          const currentI18nLang = getCurrentLanguage();
          if (storedLang !== currentI18nLang) {
            await i18nChangeLanguage(storedLang);
            setCurrentLanguage(storedLang);
          }
        }
      }
    } catch (error) {
      console.error("Error syncing language with backend:", error);
      setIsAuthenticated(false);
    }
  }, [availableLanguages]);

  // Initialize language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        console.log("🚀 Initializing language context...");
        
        // First, check for stored language preference
        const storedLang = localStorage.getItem("preferred-language") || 
                           sessionStorage.getItem("current-language");
        
        console.log(`📱 Stored language: ${storedLang}`);
        
        // If we have a stored language, set it immediately
        if (storedLang && availableLanguages.some(lang => lang.code === storedLang)) {
          const currentI18nLang = getCurrentLanguage();
          console.log(`🌐 Current i18n: ${currentI18nLang}, Stored: ${storedLang}`);
          
          if (storedLang !== currentI18nLang) {
            console.log(`🔄 Setting language to stored preference: ${storedLang}`);
            await i18nChangeLanguage(storedLang);
            setCurrentLanguage(storedLang);
          }
        }
        
        // Then sync with backend if authenticated
        await syncLanguageWithBackend();
        
        // Ensure current language state matches i18n
        const finalI18nLang = getCurrentLanguage();
        if (currentLanguage !== finalI18nLang) {
          console.log(`🔄 Final sync: ${currentLanguage} -> ${finalI18nLang}`);
          setCurrentLanguage(finalI18nLang);
        }
        
        // Set document attributes
        document.documentElement.lang = finalI18nLang;
        document.documentElement.dir = "ltr"; // All supported languages are LTR
        
        setIsInitialized(true);
        console.log(`✅ Language context initialized with: ${finalI18nLang}`);
      } catch (error) {
        console.error("Error initializing language:", error);
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, [syncLanguageWithBackend, availableLanguages]);

  // Handle language change with enhanced persistence and backend sync
  const handleLanguageChange = useCallback(async (newLanguage) => {
    if (newLanguage === currentLanguage || isLoading) {
      console.log(`⏭️ Skipping language change: ${newLanguage} (current: ${currentLanguage}, loading: ${isLoading})`);
      return;
    }

    console.log(`🌐 Changing language from ${currentLanguage} to ${newLanguage}`);
    setIsLoading(true);
    
    try {
      // Change language in i18n first
      await i18nChangeLanguage(newLanguage);
      
      // Update local state
      setCurrentLanguage(newLanguage);
      
      // Update document attributes
      document.documentElement.lang = newLanguage;
      document.documentElement.dir = "ltr";
      
      // Persist to storage
      localStorage.setItem("preferred-language", newLanguage);
      sessionStorage.setItem("current-language", newLanguage);
      localStorage.setItem("language-changed-at", new Date().toISOString());
      
      // Sync with backend if user is authenticated
      if (isAuthenticated) {
        try {
          await updateLanguagePreference(newLanguage);
          console.log(`✅ Language preference updated to ${newLanguage} in backend`);
        } catch (error) {
          console.error("Failed to sync language with backend:", error);
          // Continue with local change even if backend sync fails
        }
      }
      
      // Dispatch custom events
      window.dispatchEvent(new CustomEvent("languageChanged", { 
        detail: { 
          language: newLanguage,
          previousLanguage: currentLanguage,
          timestamp: Date.now(),
          syncedWithBackend: isAuthenticated
        } 
      }));
      
      console.log(`✅ Language successfully changed to ${newLanguage}`);
      
    } catch (error) {
      console.error("Error changing language:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, isAuthenticated, isLoading]);

  // Listen for authentication changes to sync language
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("🔐 Authentication changed, syncing language...");
      syncLanguageWithBackend();
    };

    const handleLogout = () => {
      console.log("🚪 User logged out");
      setIsAuthenticated(false);
    };

    // Listen for authentication events
    window.addEventListener("userAuthenticated", handleAuthChange);
    window.addEventListener("userLoggedOut", handleLogout);

    return () => {
      window.removeEventListener("userAuthenticated", handleAuthChange);
      window.removeEventListener("userLoggedOut", handleLogout);
    };
  }, [syncLanguageWithBackend]);

  // Listen for i18n language changes to keep state in sync
  useEffect(() => {
    const handleI18nChange = (lng) => {
      console.log(`🌐 i18n language changed to: ${lng}`);
      if (lng !== currentLanguage) {
        setCurrentLanguage(lng);
      }
    };

    // Subscribe to i18n language changes
    if (typeof window !== 'undefined' && window.i18next) {
      window.i18next.on('languageChanged', handleI18nChange);
      
      return () => {
        window.i18next.off('languageChanged', handleI18nChange);
      };
    }
  }, [currentLanguage]);

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
    isAuthenticated,
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
