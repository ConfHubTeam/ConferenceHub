import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../i18n/hooks/useTranslation";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import ReactCountryFlag from "react-country-flag";

/**
 * Language Selector Component with Flags
 * Provides a dropdown to switch between available languages
 * Features: Flag emojis, session persistence, immediate UI updates
 */
const LanguageSelector = ({ 
  className = "", 
  variant = "default", 
  showFlag = true,
  showText = true,
  placement = "bottom-right",
  theme = "light", // Default to light theme
  textColorClass = "", // Optional override for main text color (e.g., 'text-accent-primary')
  size = "md", // new: align sizes with currency selector
  onOpen
}) => {
  const { t } = useTranslation("common");
  const { 
    currentLanguageObject, 
    availableLanguages, 
    changeLanguage, 
    isLoading 
  } = useLanguageContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Language configuration with react-country-flag
  // Helper to render flag with dynamic size
  // Map language code to country code for flag
  const langToCountry = {
    en: "US",
    ru: "RU",
    uz: "UZ"
  };

  const renderFlag = (langCode, size = "1.25em", responsive = false) => {
    const countryCode = langToCountry[langCode.toLowerCase()] || "US";
    let title = "";
    let aria = "";
    if (countryCode === "US") { title = "English (US)"; aria = "United States"; }
    else if (countryCode === "RU") { title = "Русский"; aria = "Russia"; }
    else if (countryCode === "UZ") { title = "O'zbek"; aria = "Uzbekistan"; }
    else { title = countryCode; aria = countryCode; }
    // Responsive: 2em on md+ screens, 1.5em on mobile
    const style = responsive
      ? { width: "1.5em", height: "1.5em" }
      : { width: size, height: size };
    return (
      <span className={responsive ? "md:w-[2em] md:h-[2em] w-[1.5em] h-[1.5em] inline-block align-middle" : "inline-block align-middle"}>
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={style}
          title={title}
          aria-label={aria}
        />
      </span>
    );
  };

  const languageConfig = {
    en: {
      flag: renderFlag("en"),
      name: t("language.english"),
      nativeName: "English"
    },
    uz: {
      flag: renderFlag("uz"),
      name: t("language.uzbek"),
      nativeName: "O'zbek"
    },
    ru: {
      flag: renderFlag("ru"),
      name: t("language.russian"),
      nativeName: "Русский"
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle language selection with session persistence
  const handleLanguageSelect = async (languageCode) => {
    if (languageCode === currentLanguageObject.code || isLoading) return;
    
    try {
      await changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to change language:", error);
      // Could show toast notification here
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event, languageCode) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLanguageSelect(languageCode);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          button: "px-3 py-2 text-sm",
          dropdown: "min-w-[120px]",
          item: "px-3 py-2 text-sm"
        };
      case "minimal":
        return {
          button: "px-3 py-2 text-sm border-none bg-transparent hover:bg-gray-100",
          dropdown: "min-w-[140px]",
          item: "px-3 py-2 text-sm"
        };
      default:
        return {
          button: "px-3 py-2 text-base",
          dropdown: "min-w-[160px]",
          item: "px-4 py-3"
        };
    }
  };

  const styles = getVariantStyles();

  // Get dropdown position classes
  const getDropdownPosition = () => {
    switch (placement) {
      case "bottom-left":
        return "left-0 mt-1";
      case "top-right":
        return "right-0 mb-1 bottom-full";
      case "top-left":
        return "left-0 mb-1 bottom-full";
      default: // bottom-right
        return "right-0 mt-1";
    }
  };

  // Notify parent when dropdown opens so it can auto-scroll into view
  useEffect(() => {
    if (isOpen && typeof onOpen === "function") {
      try { onOpen(); } catch (_) {}
    }
  }, [isOpen, onOpen]);

  return (
  <div className={`relative w-full ${className}`}>
      {/* Language Selector Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center w-full
          ${theme === "dark"
            ? 'bg-black text-white hover:bg-white/10'
            : theme === 'navy'
              ? 'bg-accent-primary text-white border border-white/20 hover:bg-white/10 hover:border-white/50'
              : theme === 'transparent'
                ? 'bg-transparent text-white hover:bg-white/10'
                : 'bg-bg-card border border-border-default hover:bg-bg-secondary'}
          rounded-full cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${theme === "dark" || theme === 'transparent' ? 'focus:ring-white/20' : 'focus:ring-white/20'}
          transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${theme === 'transparent' ? '' : 'hover:border-white/50'}
          disabled:opacity-50 disabled:cursor-not-allowed
      ${styles.button}
      ${size === 'sm' ? 'h-10' : size === 'md' ? 'h-12' : 'h-14'}
        `}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Current Language Display */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Show language code instead of flag when selected */}
          <span className={`font-medium text-base ${
            textColorClass || ((theme === "dark" || theme === 'navy' || theme === 'transparent') ? 'text-white' : 'text-gray-700')
          }`}>
            {currentLanguageObject.code.toUpperCase()}
          </span>
          {showText && (
            <span className={`font-medium text-base ml-3 ${
              textColorClass || ((theme === "dark" || theme === 'navy' || theme === 'transparent') ? 'text-white' : 'text-gray-700')
            }`}>
              {languageConfig[currentLanguageObject.code]?.nativeName || currentLanguageObject.name}
            </span>
          )}
          {!showText && !showFlag && (
            <GlobeAltIcon className={`w-5 h-5 ${
              (theme === "dark" || theme === 'navy' || theme === 'transparent') ? 'text-white/80' : 'text-gray-600'
            }`} />
          )}
        </div>

        {/* Loading indicator or chevron */}
  {/* No chevron arrow in button */}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 ${getDropdownPosition()}
            bg-white rounded-lg shadow-lg border border-gray-200
            py-1 focus:outline-none
            ${styles.dropdown}
          `}
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          role="listbox"
          aria-label={t("language.select")}
        >
          {availableLanguages.map((language) => {
            const isSelected = language.code === currentLanguageObject.code;
            const config = languageConfig[language.code];
            
            return (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                onKeyDown={(e) => handleKeyDown(e, language.code)}
                disabled={isSelected || isLoading}
                className={`
                  w-full text-left flex items-center justify-between gap-3
                  hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 focus:outline-none
                  transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-default
                  ${styles.item}
                  ${isSelected ? "bg-navy-100" : "text-gray-700"}
                `}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  {/* Keep flags in dropdown */}
                  <span className="text-lg" aria-hidden="true">
                    {renderFlag(language.code, "1.25em")}
                  </span>
                  <div className="flex flex-col">
                    <span className={`font-medium ${isSelected ? 'text-navy-700' : ''}`}>
                      {config?.nativeName}
                    </span>
                    {config?.nativeName !== config?.name && (
                      <span className="text-xs text-gray-500">
                        {config?.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                  <CheckIcon className="w-4 h-4 text-navy-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Notify parent when dropdown opens so it can auto-scroll into view
// Do it via effect near the end to ensure state is set
// Note: defined after component to avoid recreating effect earlier
// We'll attach effect inside the component above at the right place

export default LanguageSelector;
