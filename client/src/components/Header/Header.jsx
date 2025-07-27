import React, { useState } from "react";
import { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import CurrencySelector from "../CurrencySelector";
import { TranslatedButton } from "../forms";

/**
 * Sample Header Component
 * Demonstrates proper integration of language selector with other header elements
 * Shows language and currency selectors side by side (not confusing them)
 */
const Header = () => {
  const { translate: t, getLanguageClasses, getDirection } = useEnhancedTranslation("header");
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  
  const langClasses = getLanguageClasses();
  const direction = getDirection();

  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm ${langClasses}`} dir={direction}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img className="h-8 w-8" src="/logo.svg" alt="Logo" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <TranslatedButton
                  href="/"
                  variant="link"
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  translationKey="navigation.home"
                />
                <TranslatedButton
                  href="/stays"
                  variant="link"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  translationKey="navigation.stays"
                />
                <TranslatedButton
                  href="/experiences"
                  variant="link"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  translationKey="navigation.experiences"
                />
              </div>
            </div>
          </div>

          {/* Right side - Language & Currency selectors + User menu */}
          <div className="flex items-center space-x-4">
            {/* Professional Currency Selector */}
            <div className="hidden md:block">
              <CurrencySelector 
                selectedCurrency={selectedCurrency}
                onChange={setSelectedCurrency}
                compact={true}
              />
            </div>

            {/* Language Selector - clearly separated from currency */}
            <div className="hidden md:block">
              <LanguageSelector 
                variant="compact"
                showFlag={true}
                showText={false}
                className="border-l border-gray-300 pl-4"
              />
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <TranslatedButton
                variant="secondary"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                translationKey="userMenu.logIn"
              />
              <TranslatedButton
                variant="primary"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                translationKey="userMenu.signUp"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-xs font-medium text-gray-700">{t("mobileMenu.currency")}</span>
            <div className="w-24">
              <CurrencySelector 
                selectedCurrency={selectedCurrency}
                onChange={setSelectedCurrency}
                compact={true}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{t("mobileMenu.language")}</span>
            <LanguageSelector 
              variant="minimal"
              showFlag={true}
              showText={true}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
