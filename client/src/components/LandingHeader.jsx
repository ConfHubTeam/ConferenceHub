import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { GlobeAltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { CurrencyContext } from "../contexts/CurrencyContext";
import { MobileNavigation } from "./ResponsiveUtils";

/**
 * Reusable Landing Page Header Component
 * Follows SOLID principles - Interface Segregation and Single Responsibility
 * Enhanced with mobile responsiveness
 */
export default function LandingHeader({ 
  logoSrc = "/getSpace_logo.png",
  logoAlt = "GetSpace",
  showNavigation = true,
  showAuth = true,
  className = "",
  user = null
}) {
  const { selectedCurrency, changeCurrency, availableCurrencies } = useContext(CurrencyContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // Get currency flag emoji (simplified version)
  const getCurrencyFlag = (charCode) => {
    switch(charCode) {
      case "UZS": return "🇺🇿";
      case "USD": return "🇺🇸";
      case "RUB": return "🇷🇺";
      default: return "";
    }
  };

  return (
    <header className={`relative z-50 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between ${className}`}>
      {/* Logo with enhanced visibility */}
      <div className="flex items-center">
        <Link to="/" className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg">
  
            <img 
              src={logoSrc}
              alt={logoAlt}
              className="h-8 sm:h-10 lg:h-12 w-auto transition-transform duration-300 hover:scale-110 drop-shadow-xl"
              style={{ 
                filter: "brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.8))",
                transform: "translateZ(0)"  /* Force GPU acceleration for smoother animation */
              }}
            />
        </Link>
      </div>

      {/* Desktop Navigation */}
      {showNavigation && (
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8" role="navigation">
          <Link 
            className="text-white hover:text-brand-orange transition-colors duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            aria-label="Browse Spaces"
            to="/places"
          >
            <GlobeAltIcon className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" />
            <span className="font-medium">Browse Spaces</span>
            <ChevronDownIcon className="w-3 h-3 lg:w-4 lg:h-4" aria-hidden="true" />
          </Link>
          {user ? (
            <Link 
              to="/account/user-places"
              className="text-white hover:text-brand-orange transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            >
              My Places
            </Link>
          ) : (
            <Link 
              to="/register"
              className="text-white hover:text-brand-orange transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            >
              List Your Space
            </Link>
          )}
        </nav>
      )}

      {/* Auth Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Currency Selector with Flag */}
        <div className="relative hidden sm:block">
          <div className="flex items-center cursor-pointer">
            <select 
              className="appearance-none bg-transparent text-white text-xs sm:text-sm font-medium border border-white/30 rounded-md pl-7 pr-6 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50"
              value={selectedCurrency?.charCode || "UZS"}
              onChange={(e) => {
                const newCurrency = availableCurrencies.find(
                  c => c.charCode === e.target.value
                );                                                        
                if (newCurrency) {
                  changeCurrency(newCurrency);
                }
              }}
              aria-label="Select currency"
            >
              {availableCurrencies && availableCurrencies.length > 0 ? (
                availableCurrencies.map(curr => (
                  <option 
                    key={curr.id} 
                    value={curr.charCode}
                    className="text-gray-900"
                  >
                    {curr.charCode}
                  </option>
                ))
              ) : (
                <option value="UZS" className="text-gray-900">UZS</option>
              )}
            </select>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none">
              {selectedCurrency && getCurrencyFlag(selectedCurrency.charCode)}
            </div>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white pointer-events-none" />
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        {showAuth && (
          <>
            {user ? (
              /* Authenticated user section */
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/account"
                  className="bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-200 px-4 lg:px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 text-sm lg:text-base"
                >
                  My Account
                </Link>
              </div>
            ) : (
              /* Non-authenticated user section */
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/login"
                  className="text-white hover:text-brand-orange transition-colors duration-200 px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 text-sm lg:text-base"
                >
                  Log In
                </Link>
                <Link 
                  to="/register"
                  className="bg-white text-gray-900 hover:bg-gray-100 transition-colors duration-200 px-4 lg:px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 text-sm lg:text-base"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <MobileNavigation 
              isOpen={isMobileMenuOpen}
              onToggle={toggleMobileMenu}
              onClose={closeMobileMenu}
              user={user}
            />
          </>
        )}
      </div>
    </header>
  );
}
