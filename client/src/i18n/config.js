import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

// Translation namespaces for lazy loading
const NAMESPACES = [
  "common",
  "header",
  "navigation", 
  "landing",
  "booking",
  "forms",
  "places",
  "auth",
  "profile",
  "reviews",
  "notifications",
  "payments",
  "refundPolicies"
];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: undefined, // Let LanguageDetector determine the language
    fallbackLng: "en",
    debug: false, // Disable debug logs to reduce console noise

    // Namespace configuration
    ns: NAMESPACES,
    defaultNS: "common",

    // Language detection options - enhanced for better persistence
    detection: {
      order: [
        "localStorage", 
        "sessionStorage",
        "navigator",
        "htmlTag"
      ],
      lookupLocalStorage: "preferred-language", // Match our LanguageContext key
      lookupSessionStorage: "current-language", // Match our LanguageContext key
      caches: ["localStorage", "sessionStorage"],
      excludeCacheFor: ["cimode"],
      // Check specific keys and ensure they persist
      checkWhitelist: true,
    },

    // Backend configuration for lazy loading
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
      addPath: "/locales/add/{{lng}}/{{ns}}",
      allowMultiLoading: false,
      crossDomain: false,
      withCredentials: false,
      overrideMimeType: false,
      requestOptions: {
        mode: "cors",
        credentials: "same-origin",
        cache: "default",
      },
    },

    // React-specific options
    react: {
      useSuspense: true,
      bindI18n: "languageChanged",
      bindI18nStore: "added removed",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
    },

        // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes by default
      formatSeparator: ",",
    },

    // Translation options
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    joinArrays: " ",
    
    // Performance optimizations
    load: "languageOnly", // Load only language, not region (e.g., 'en' not 'en-US')
    preload: ["ru", "en", "uz"],
    
    // Error handling
    saveMissing: process.env.NODE_ENV === "development",
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    },

    // Pluralization
    pluralSeparator: "_",
    contextSeparator: "_",

    // Supported languages
    supportedLngs: ["en", "uz", "ru"],
    nonExplicitSupportedLngs: false,
  });

// Helper function to change language
export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

// Helper function to get current language
export const getCurrentLanguage = () => {
  return i18n.language || "ru";
};

// Helper function to get available languages
export const getAvailableLanguages = () => {
  return [
    { code: "ru", name: "Русский", flag: "��" },
    { code: "en", name: "English", flag: "🇺�" },
    { code: "uz", name: "O'zbek", flag: "🇺🇿" }
  ];
};

// Helper function to preload namespaces
export const preloadNamespaces = (namespaces = []) => {
  const currentLng = getCurrentLanguage();
  return Promise.all(
    namespaces.map(ns => i18n.loadNamespaces(ns, currentLng))
  );
};

// Helper function to get resource status
export const getResourceStatus = (lng, ns) => {
  return i18n.hasResourceBundle(lng, ns);
};

export default i18n;
