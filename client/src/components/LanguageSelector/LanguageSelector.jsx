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
  theme = "light" // Default to light theme
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
          button: "px-2 py-1 text-sm",
          dropdown: "min-w-[120px]",
          item: "px-3 py-2 text-sm"
        };
      case "minimal":
        return {
          button: "px-1 py-1 text-sm border-none bg-transparent hover:bg-gray-100",
          dropdown: "min-w-[140px]",
          item: "px-3 py-2 text-sm"
        };
      default:
        return {
          button: "px-3 py-2",
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

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Language Selector Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          ${theme === "dark"
            ? 'bg-black text-white hover:bg-white/10'
            : 'border border-gray-300 bg-gray-100 hover:bg-gray-200'}
          rounded-full
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${theme === "dark" ? 'focus:ring-white/20' : 'focus:ring-indigo-500'}
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${styles.button}
        `}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Current Language Display */}
        <div className="flex items-center gap-2">
          {showFlag && (
            <span className="text-lg" aria-hidden="true" style={{background: 'none', border: 'none', boxShadow: 'none', padding: 0}}>
              {renderFlag(currentLanguageObject.code, undefined, true)}
            </span>
          )}
          {showText && (
            <span className={`font-medium ${
              theme === "dark" ? 'text-white' : 'text-gray-700'
            }`}>
              {languageConfig[currentLanguageObject.code]?.nativeName || currentLanguageObject.name}
            </span>
          )}
          {!showText && !showFlag && (
            <GlobeAltIcon className={`w-5 h-5 ${
              theme === "dark" ? 'text-white/80' : 'text-gray-600'
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
                  hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-default
                  ${styles.item}
                  ${isSelected ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}
                `}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden="true">
                    {isSelected
                      ? renderFlag(language.code, "2em")
                      : renderFlag(language.code, "1.25em")}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">
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
                  <CheckIcon className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
