import { Link } from "react-router-dom";
import { useContext, useState, useMemo } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { HiOutlineInformationCircle } from "react-icons/hi2";
import { CurrencyContext } from "../contexts/CurrencyContext";
import { MobileNavigation } from "./ResponsiveUtils";
import CurrencySelector from "./CurrencySelector";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";
import AboutUsModal from "./AboutUsModal";
import { useTranslation } from "react-i18next";

/**
 * Landing Page Header Component with Route-based Translation
 * Follows SOLID principles - Interface Segregation and Single Responsibility
 * Enhanced with mobile responsiveness and translation loading
 */
function LandingHeaderBase({ 
  logoSrc = "/getSpace_logo.png",
  logoAlt = "GetSpace",
  showNavigation = true,
  showAuth = true,
  className = "",
  user = null
}) {
  const { selectedCurrency, changeCurrency, availableCurrencies } = useContext(CurrencyContext);
  const { t, ready, i18n } = useTranslation(["common", "navigation", "auth"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Memoized navigation items with translations
  const navigationItems = useMemo(() => {
    if (!ready) return {
      browseSpaces: "Browse Spaces",
      myPlaces: "My Places",
      listYourSpace: "List Your Space",
      myAccount: "My Account",
      login: "Log In",
      signup: "Sign Up"
    };
    
    return {
      browseSpaces: t("navigation:header.navigation.browseSpaces", "Browse Spaces"),
      myPlaces: t("navigation:accountNav.spaces", "My Places"),
      listYourSpace: t("navigation:header.navigation.listYourSpace", "List Your Space"),
      myAccount: t("navigation:header.userMenu.myAccount", "My Account"),
      login: t("navigation:header.userMenu.login", "Log In"),
      signup: t("navigation:header.userMenu.signup", "Sign Up")
    };
  }, [t, ready]);

  return (
    <header className={`relative z-50 pl-2 pr-4 md:pl-6 md:pr-14 py-3 flex items-center justify-between bg-transparent ${className}`}>
      {/* Logo with enhanced visibility */}
      <div className="flex items-center">
        <Link to="/" className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg">
  
            <img 
              src={logoSrc}
              alt={logoAlt}
              className="h-6 sm:h-7 lg:h-8 w-auto transition-transform duration-300 hover:scale-110 drop-shadow-xl logo-white"
              style={{ 
                transform: "translateZ(0)"  /* Force GPU acceleration for smoother animation */
              }}
            />
        </Link>
      </div>
  {/* About Us Modal */}


      {/* Desktop Navigation */}
      {showNavigation && (
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8" role="navigation">
          <Link 
            className="text-white hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            aria-label={navigationItems.browseSpaces}
            to="/places"
          >
            <GlobeAltIcon className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" />
            <span className="font-medium">{navigationItems.browseSpaces}</span>
          </Link>
          {user && (user.userType === 'host' || user.userType === 'agent') ? (
            <Link 
              to="/account/user-places"
              className="text-white hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            >
              {navigationItems.myPlaces}
            </Link>
          ) : !user ? (
            <Link 
              to="/register"
              className="text-white hover:bg-white/10 hover:scale-[1.02] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-2 text-sm lg:text-base"
            >
              {navigationItems.listYourSpace}
            </Link>
          ) : null}
        </nav>
      )}

      {/* Auth Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* About Us button - Desktop only, matching currency selector format */}
        <div className="hidden md:block">
          <Link
            to="/about"
            className="flex items-center justify-center px-3 py-3 rounded-full bg-transparent text-white border border-white/20 hover:bg-accent-highlight/20 hover:border-accent-highlight/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-sm font-medium whitespace-nowrap space-x-1.5"
          >
            <HiOutlineInformationCircle className="w-5 h-5" aria-hidden="true" />
            <span>
              {(() => {
                const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
                if (lang === 'uz') return 'Biz haqimizda';
                if (lang === 'ru') return 'О нас';
                return 'About Us';
              })()}
            </span>
          </Link>
        </div>

        {/* Currency Selector - Desktop only */}
        <div className="hidden md:block" style={{ width: '90px' }}>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onChange={changeCurrency}
            availableCurrencies={availableCurrencies}
            compact={true}
            theme="navy"
          />
        </div>
        
        {/* Language Selector - Desktop only */}
    <div className="hidden md:block">
          <LanguageSelector 
            variant="compact"
            showFlag={false}
            showText={false}
      className="pl-2 ml-2"
            theme="navy"
          />
        </div>

        {/* Desktop Auth Buttons */}
        {showAuth && (
          <>
            {user ? (
              /* Authenticated user section */
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/account"
                  className="bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 px-4 lg:px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 text-sm lg:text-base"
                >
                  {navigationItems.myAccount}
                </Link>
              </div>
            ) : (
              /* Non-authenticated user section */
              <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
                <Link 
                  to="/login"
                  className="text-white hover:bg-white/15 hover:scale-[1.02] border border-transparent hover:border-white/30 transition-all duration-200 px-3 lg:px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-white/50 text-sm lg:text-base"
                >
                  {navigationItems.login}
                </Link>
                <Link 
                  to="/register"
                  className="bg-white text-accent-primary hover:bg-accent-highlight hover:text-white hover:scale-[1.02] hover:shadow-lg transition-all duration-200 px-4 lg:px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 text-sm lg:text-base"
                >
                  {navigationItems.signup}
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

// Enhanced LandingHeader with route-based translation loading
export default withTranslationLoading(LandingHeaderBase, {
  namespaces: ["common", "navigation", "auth"],
  preloadNamespaces: ["landing", "search"],
  loadingComponent: ({ children, ...props }) => (
    <header className={`relative z-50 pl-2 pr-4 md:pl-6 md:pr-14 py-3 flex items-center justify-between bg-transparent ${props.className || ""}`}>
      <div className="flex items-center">
        <div className="h-6 sm:h-7 lg:h-8 w-24 bg-white/20 rounded animate-pulse"></div>
      </div>
      <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
        <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden md:flex space-x-4">
          <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
          <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
          <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
    </header>
  ),
  errorComponent: ({ error, retry, ...props }) => (
  <header className={`relative z-50 pl-2 pr-4 md:pl-6 md:pr-14 py-3 flex items-center justify-between bg-transparent ${props.className || ""}`}>
      <div className="flex items-center">
        <Link to="/" className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg">
          <img 
            src="/getSpace_logo.png"
            alt="GetSpace"
            className="h-6 sm:h-7 lg:h-8 w-auto transition-transform duration-300 hover:scale-110 drop-shadow-xl logo-white"
            style={{ 
              transform: "translateZ(0)"
            }}
          />
        </Link>
      </div>
      <div className="hidden lg:flex items-center space-x-4">
        <button 
          onClick={retry}
          className="text-white text-sm underline hover:opacity-80"
          title="Retry loading translations"
        >
          Reload
        </button>
      </div>
    </header>
  )
});
