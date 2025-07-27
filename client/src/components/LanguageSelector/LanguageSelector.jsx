import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../i18n/hooks/useTranslation";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { ChevronDownIcon, CheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

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
  placement = "bottom-right"
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

  // Language configuration with flags and metadata
  const languageConfig = {
    en: {
      flag: "🇺🇸",
      name: t("language.english"),
      nativeName: "English"
    },
    uz: {
      flag: "🇺🇿", 
      name: t("language.uzbek"),
      nativeName: "O'zbek"
    },
    ru: {
      flag: "🇷🇺",
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
          border border-gray-300 rounded-lg
          bg-white hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
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
            <span className="text-lg" role="img" aria-hidden="true">
              {languageConfig[currentLanguageObject.code]?.flag}
            </span>
          )}
          {showText && (
            <span className="font-medium text-gray-700">
              {languageConfig[currentLanguageObject.code]?.nativeName || currentLanguageObject.name}
            </span>
          )}
          {!showText && !showFlag && (
            <GlobeAltIcon className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* Loading indicator or chevron */}
        {isLoading ? (
          <div className="w-4 h-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-indigo-600"></div>
          </div>
        ) : (
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        )}
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
                  <span className="text-lg" role="img" aria-hidden="true">
                    {config?.flag}
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
