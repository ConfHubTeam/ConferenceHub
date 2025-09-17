import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "./UserContext";
import { useCurrency } from "../contexts/CurrencyContext";
import CurrencySelector from "./CurrencySelector";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import UserNavigation from "./UserNavigation";
import AboutUsModal from "./AboutUsModal";

export default function Header() {
  const { t } = useTranslation("navigation");
  const { user } = useContext(UserContext);
  const { selectedCurrency, changeCurrency, availableCurrencies } = useCurrency();
  const location = useLocation();
  const isLanding = location.pathname === "/"; // Landing page route
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const menuRef = useRef(null);
  const currencyRef = useRef(null);
  const languageRef = useRef(null);
  const menuButtonRef = useRef(null);
  const navScrollRef = useRef(null);
  const navContentRef = useRef(null);

  // Horizontal nav overflow detection for desktop
  const [navHasOverflow, setNavHasOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1; // tolerance
      setNavHasOverflow(hasOverflow);
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };

    // Trigger after layout settles
    requestAnimationFrame(() => requestAnimationFrame(update));
    const id = window.setTimeout(update, 250);

    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);

    // Observe size/content changes
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (navContentRef.current) ro.observe(navContentRef.current);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
      window.clearTimeout(id);
      ro.disconnect();
    };
  }, []);

  const scrollNavBy = (delta) => {
    const el = navScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle mobile menu closing
      if (
        mobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scrolling when menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Function to get the first letter of the user's name
  const getFirstLetter = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "";
  };

  // Function to handle menu link clicks
  const handleMenuLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
    <header className="flex items-center justify-between pl-2 pr-4 md:pl-6 md:pr-14 py-3 relative z-[70] bg-accent-primary text-white sticky top-0 border-b border-navy-700 flex-shrink-0">
        {/* Logo - Fixed width */}
        <div className="flex-shrink-0">
          <Link to={user ? "/places" : "/"} className="logo flex items-center gap-1 rounded-full transition-colors">
            <img
              src="/getSpace_logo.png"
              alt={t("header.logo.alt")}
              title={t("header.logo.title")}
              className="h-6 sm:h-7 lg:h-8 w-auto object-contain logo-white"
              style={{
                transform: "translateZ(0)"
              }}
            />
          </Link>
        </div>

        {/* About Us button (only on landing page) */}
        {isLanding && (
          <button
            className="ml-4 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
            onClick={() => setAboutOpen(true)}
            type="button"
          >
            {t("header.aboutUs", "About Us")}
          </button>
        )}
  {/* About Us Modal */}
  <AboutUsModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

        {/* User Navigation - Desktop only, horizontally scrollable with indicators */}
        <div className="hidden md:block flex-1 min-w-0 mx-4 relative">
          <div
            ref={navScrollRef}
            className={`overflow-x-auto overflow-y-visible scroll-smooth flex ${navHasOverflow ? 'justify-start' : 'justify-center'}`}
            style={{ scrollbarWidth: 'none' }}
          >
            <div ref={navContentRef} className="inline-flex items-center gap-4">
              <UserNavigation />
            </div>
          </div>

          {/* Edge fade indicators */}
          {navHasOverflow && !atStart && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-accent-primary to-transparent" />
          )}
          {navHasOverflow && !atEnd && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-accent-primary to-transparent" />
          )}

          {/* Right scroll indicator */}
          {navHasOverflow && !atEnd && (
            <button
              type="button"
              aria-label="Scroll navigation right"
              onClick={() => scrollNavBy(Math.max(160, (navScrollRef.current?.clientWidth || 400) * 0.6))}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center ring-1 ring-white/25 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Left scroll indicator */}
          {navHasOverflow && !atStart && (
            <button
              type="button"
              aria-label="Scroll navigation left"
              onClick={() => scrollNavBy(-Math.max(160, (navScrollRef.current?.clientWidth || 400) * 0.6))}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center ring-1 ring-white/25 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Right section - Mobile: notification + hamburger + profile, Desktop: all elements */}
        <div className="flex items-center gap-3 relative z-30 flex-shrink-0">
          {/* Notification Bell - only shown for logged-in users */}
          <NotificationBell theme="dark" />

          {/* Currency Selector */}
      <div className="hidden md:block" style={{ width: '100px' }}>
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onChange={changeCurrency}
              availableCurrencies={availableCurrencies}
              compact={true}
        theme={isLanding ? "transparent" : "navy"}
            />
          </div>

          {/* Language Selector - clearly separated from currency */}
      <div className="hidden md:block" style={{ width: '80px' }}>
            <LanguageSelector
              variant="default"
              showFlag={false}
              showText={false}
        theme={isLanding ? "transparent" : "navy"}
            />
          </div>

          {/* Hamburger menu button - only shown on mobile */}
          <button
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden border border-white/30 rounded-full p-2 text-white hover:bg-white/10 hover:border-white/50 transition-colors"
            aria-label={t("header.mobileMenu.toggleMenu")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <Link
            to={user ? "/account" : "/login"}
            className="profile flex items-center justify-center h-12 px-2 md:px-3 text-base rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-md gap-2 relative text-white bg-accent-primary border border-white/20 hover:bg-white/10 hover:border-white/50 flex-shrink-0"
          >
            {!user ? (
              <div className="user">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <>
                <div className="bg-white text-accent-primary rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                  {getFirstLetter()}
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Semi-transparent overlay when menu is open */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[85]" />
        )}

        {/* Enhanced Mobile menu with better navigation for authenticated users */}
        {mobileMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-14 left-0 right-0 mx-2 sm:mx-3 bg-accent-primary text-white z-[90] md:hidden rounded-xl max-h-[calc(100vh-56px)] overflow-y-auto shadow-2xl ring-1 ring-white/15 border border-white/10"
          >
            <div className="flex flex-col">
              {/* User Navigation Section for authenticated users */}
              {user && (
                <div className="border-b border-white/20 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white text-accent-primary rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                      {getFirstLetter()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-sm text-white/80 capitalize">{user.userType}</div>
                    </div>
                  </div>

                  {/* Quick Navigation Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/places"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                      onClick={handleMenuLinkClick}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {t("header.navigation.home", "Home")}
                    </Link>
                    <Link
                      to="/account"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                      onClick={handleMenuLinkClick}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {t("accountNav.profile")}
                    </Link>
                    <Link
                      to="/account/bookings"
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                      onClick={handleMenuLinkClick}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {t("accountNav.bookings")}
                    </Link>

                    {/* Show favorites only for clients */}
                    {user.userType !== 'host' && user.userType !== 'agent' && (
                      <Link
                        to="/account/favorites"
                        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                        onClick={handleMenuLinkClick}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {t("accountNav.favorites")}
                      </Link>
                    )}



                    {/* Host specific links */}
                    {user.userType === 'host' && (
                      <>
                        <Link
                          to="/account/user-places"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                          {t("header.navigation.myPlaces", "My Places")}
                        </Link>
                        <Link
                          to="/account/calendar"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {t("accountNav.calendar", "Calendar")}
                        </Link>
                        <Link
                          to="/account/hostdashboard"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                          {t("accountNav.hostDashboard")}
                        </Link>
                      </>
                    )}

                    {/* Agent specific links */}
                    {user.userType === 'agent' && (
                      <>
                        <Link
                          to="/account/users"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          {t("accountNav.users")}
                        </Link>
                        <Link
                          to="/account/all-places"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          {t("accountNav.places")}
                        </Link>
                        <Link
                          to="/account/calendar"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {t("accountNav.calendar", "Calendar")}
                        </Link>
                        <Link
                          to="/account/reviews"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {t("accountNav.reviews")}
                        </Link>
                        <Link
                          to="/account/dashboard"
                          className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm transition-all duration-200 hover-pop-sm text-white"
                          onClick={handleMenuLinkClick}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                          {t("accountNav.dashboard")}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Settings and Options Section */}
              <div className="p-4 text-white">
                {/* Currency and Language selectors side by side */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Currency selector */}
                    <div ref={currencyRef}>
                      <div className="w-full">
                        <CurrencySelector
                          selectedCurrency={selectedCurrency}
                          onChange={changeCurrency}
                          availableCurrencies={availableCurrencies}
                          theme="light"
                          textColorClass="text-accent-primary"
                          size="md"
                          onOpen={() => {
                            // Auto-scroll currency into view when its dropdown opens
                            const container = menuRef.current;
                            const target = currencyRef.current;
                            if (container && target) {
                              const rectContainer = container.getBoundingClientRect();
                              const rectTarget = target.getBoundingClientRect();
                              const offset = rectTarget.top - rectContainer.top;
                              container.scrollTo({ top: offset - 16, behavior: 'smooth' });
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Language selector */}
                    <div ref={languageRef}>
                      <div className="w-full">
                        <LanguageSelector
                          variant="dropdown"
                          showFlag={true}
                          showText={true}
                          theme="light"
                          textColorClass="text-accent-primary"
                          size="md"
                          onOpen={() => {
                            // Auto-scroll language into view when its dropdown opens
                            const container = menuRef.current;
                            const target = languageRef.current;
                            if (container && target) {
                              const rectContainer = container.getBoundingClientRect();
                              const rectTarget = target.getBoundingClientRect();
                              const offset = rectTarget.top - rectContainer.top;
                              container.scrollTo({ top: offset - 16, behavior: 'smooth' });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authentication section for unauthenticated users */}
                {!user && (
                  <div className="border-t border-white/20 pt-4">
                    <Link
                      to="/login"
                      className="flex items-center py-3 px-3 hover:bg-white/10 rounded-lg mb-2 text-white"
                      onClick={handleMenuLinkClick}
                    >
                      <span className="mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {t("header.userMenu.login")}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center py-3 px-3 hover:bg-white/10 rounded-lg text-white"
                      onClick={handleMenuLinkClick}
                    >
                      <span className="mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                      </span>
                      {t("header.userMenu.signup")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
