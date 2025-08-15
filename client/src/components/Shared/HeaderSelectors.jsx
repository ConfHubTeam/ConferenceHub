import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../contexts/CurrencyContext";
import CurrencySelector from "../CurrencySelector";
import LanguageSelector from "../LanguageSelector/LanguageSelector";

/**
 * Shared Header Selectors Component
 * Reusable language and currency selectors for both LandingHeader and main Header
 * Follows DRY principle to avoid code duplication
 */

/**
 * Desktop Header Selectors
 * Used in desktop view for both headers
 */
export const DesktopHeaderSelectors = ({ 
  theme = "light", // "light" for landing page, "dark" for main header
  className = "",
  showLanguage = true,
  showCurrency = true 
}) => {
  const { selectedCurrency, changeCurrency, availableCurrencies } = useCurrency();

  const themeClasses = useMemo(() => {
    return theme === "light" 
      ? "text-white border-white/30" // For landing page with dark background
      : "text-gray-700 border-gray-300"; // For main page with light background
  }, [theme]);

  return (
    <div className={`flex items-center space-x-2 sm:space-x-4 ${className}`}>
      {/* Language Selector */}
      {showLanguage && (
        <div className="relative">
          <LanguageSelector 
            variant="compact"
            showFlag={true}
            showText={false}
            className={`${themeClasses} ${theme === "dark" ? "border-l border-gray-300 pl-2 ml-2" : ""}`}
            placement="bottom-right"
          />
        </div>
      )}

      {/* Currency Selector */}
      {showCurrency && (
        <div className="relative" style={{ width: theme === "dark" ? "90px" : "auto" }}>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onChange={changeCurrency}
            availableCurrencies={availableCurrencies}
            compact={true}
            className={themeClasses}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Mobile Header Selectors
 * Used in mobile menu for both headers
 */
export const MobileHeaderSelectors = ({ 
  onSelectionChange = null,
  showLanguage = true,
  showCurrency = true,
  className = ""
}) => {
  const { selectedCurrency, changeCurrency, availableCurrencies } = useCurrency();

  const handleCurrencyChange = (currency) => {
    changeCurrency(currency);
    if (onSelectionChange) {
      onSelectionChange();
    }
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {/* Currency selector */}
      {showCurrency && (
        <div>
          <div className="max-w-full">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onChange={handleCurrencyChange}
              availableCurrencies={availableCurrencies}
              compact={false}
            />
          </div>
        </div>
      )}
      
      {/* Language selector */}
      {showLanguage && (
        <div>
          <div className="max-w-full">
            <LanguageSelector 
              variant="dropdown"
              showFlag={true}
              showText={true}
              placement="bottom-center"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Header Selectors Factory
 * Returns appropriate selector component based on device type
 */
export const HeaderSelectors = ({ 
  isMobile = false, 
  theme = "light",
  onSelectionChange = null,
  showLanguage = true,
  showCurrency = true,
  className = ""
}) => {
  if (isMobile) {
    return (
      <MobileHeaderSelectors 
        onSelectionChange={onSelectionChange}
        showLanguage={showLanguage}
        showCurrency={showCurrency}
        className={className}
      />
    );
  }

  return (
    <DesktopHeaderSelectors 
      theme={theme}
      showLanguage={showLanguage}
      showCurrency={showCurrency}
      className={className}
    />
  );
};

export default HeaderSelectors;
