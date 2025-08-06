const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const path = require("path");

// Translation namespaces for the backend
const NAMESPACES = [
  "common",
  "errors",
  "validation",
  "email",
  "notifications",
  "auth",
  "booking",
  "payment",
  "reviews",
  "sms"
];

// Initialize i18next for backend
i18next
  .use(Backend)
  .init({
    lng: "en", // Default language
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    // Namespace configuration
    ns: NAMESPACES,
    defaultNS: "common",

    // Backend configuration
    backend: {
      loadPath: path.join(__dirname, "locales/{{lng}}/{{ns}}.json"),
      addPath: path.join(__dirname, "locales/{{lng}}/{{ns}}.missing.json"),
      allowMultiLoading: false,
      ident: 2
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // Not needed for server-side
      formatSeparator: ",",
      format: (value, format, lng) => {
        if (format === "uppercase") return value.toUpperCase();
        if (format === "lowercase") return value.toLowerCase();
        if (format === "currency") {
          const locale = lng === "uz" ? "uz-UZ" : lng === "ru" ? "ru-RU" : "en-US";
          const currency = lng === "uz" ? "UZS" : lng === "ru" ? "RUB" : "USD";
          return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency
          }).format(value);
        }
        if (format === "date") {
          const locale = lng === "uz" ? "uz-UZ" : lng === "ru" ? "ru-RU" : "en-US";
          return new Intl.DateTimeFormat(locale).format(new Date(value));
        }
        return value;
      },
    },

    // Translation options
    returnNull: false,
    returnEmptyString: false,
    returnObjects: true,
    joinArrays: " ",

    // Supported languages
    supportedLngs: ["en", "uz", "ru"],
    nonExplicitSupportedLngs: false,

    // Performance optimizations
    load: "languageOnly",
    preload: ["en", "uz", "ru"],

    // Error handling
    saveMissing: process.env.NODE_ENV === "development",
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    },

    // Pluralization
    pluralSeparator: "_",
    contextSeparator: "_",
  });

/**
 * Get translation function for specific language
 * @param {string} lng - Language code
 * @param {string} ns - Namespace
 * @returns {Function} Translation function
 */
const getTranslationFunction = (lng = "en", ns = "common") => {
  return i18next.getFixedT(lng, ns);
};

/**
 * Get translation for specific key and language
 * @param {string} key - Translation key
 * @param {Object} options - Translation options
 * @param {string} options.lng - Language code
 * @param {string} options.ns - Namespace
 * @param {Object} options.interpolation - Interpolation values
 * @returns {string} Translated text
 */
const translate = (key, options = {}) => {
  const { lng = "en", ns = "common", ...interpolationOptions } = options;

  try {
    return i18next.t(key, {
      lng,
      ns,
      ...interpolationOptions
    });
  } catch (error) {
    console.error(`Translation error for key ${key}:`, error);
    return key; // Return key as fallback
  }
};

/**
 * Express middleware to detect language from request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const languageMiddleware = (req, res, next) => {
  // Get language from various sources
  const headerLang = req.headers["accept-language"]?.split(",")[0]?.split("-")[0];
  const queryLang = req.query.lang;
  const bodyLang = req.body?.language;
  const userLang = req.user?.preferredLanguage;

  // Determine language priority: query > body > user preference > header > default
  const detectedLanguage = queryLang || bodyLang || userLang || headerLang || "en";

  // Validate language is supported
  const supportedLanguages = ["en", "uz", "ru"];
  const language = supportedLanguages.includes(detectedLanguage) ? detectedLanguage : "en";

  // Attach language to request object
  req.language = language;

  // Create translation function for this request
  req.t = (key, options = {}) => translate(key, { lng: language, ...options });

  // Create namespace-specific translation functions
  req.tError = (key, options = {}) => translate(key, { lng: language, ns: "errors", ...options });
  req.tValidation = (key, options = {}) => translate(key, { lng: language, ns: "validation", ...options });
  req.tEmail = (key, options = {}) => translate(key, { lng: language, ns: "email", ...options });
  req.tNotification = (key, options = {}) => translate(key, { lng: language, ns: "notifications", ...options });

  next();
};

/**
 * Format currency according to language/locale
 * @param {number} amount - Amount to format
 * @param {string} lng - Language code
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, lng = "en", currency = null) => {
  const locale = lng === "uz" ? "uz-UZ" : lng === "ru" ? "ru-RU" : "en-US";
  const currencyCode = currency || (lng === "uz" ? "UZS" : lng === "ru" ? "RUB" : "USD");

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date according to language/locale
 * @param {Date|string} date - Date to format
 * @param {string} lng - Language code
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
const formatDate = (date, lng = "en", options = {}) => {
  const locale = lng === "uz" ? "uz-UZ" : lng === "ru" ? "ru-RU" : "en-US";
  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
};

/**
 * Get available languages
 * @returns {Array} Array of language objects
 */
const getAvailableLanguages = () => {
  return [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "uz", name: "O'zbek", flag: "🇺🇿" },
    { code: "ru", name: "Русский", flag: "🇷🇺" }
  ];
};

/**
 * Change default language
 * @param {string} lng - Language code
 * @returns {Promise} Promise that resolves when language is changed
 */
const changeLanguage = (lng) => {
  return i18next.changeLanguage(lng);
};

module.exports = {
  i18next,
  translate,
  getTranslationFunction,
  languageMiddleware,
  formatCurrency,
  formatDate,
  getAvailableLanguages,
  changeLanguage,
  NAMESPACES
};
