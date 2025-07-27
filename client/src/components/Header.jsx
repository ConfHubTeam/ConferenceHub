import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useCurrency } from "../contexts/CurrencyContext";
import CurrencySelector from "./CurrencySelector";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector/LanguageSelector";

export default function Header() {
  const {user} = useContext(UserContext);
  const { selectedCurrency, changeCurrency, availableCurrencies } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

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
    <header className="flex justify-between items-center pl-2 pr-4 md:pl-6 md:pr-14 relative z-50">
      <div className="flex flex-col">
        <Link to={user ? "/places" : "/"} className="logo flex items-center gap-1">
          <img 
            src="/getSpace_logo.png" 
            alt="GetSpace" 
            className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
          />
        </Link>
      </div>
      
      {/* Empty div for spacing in the center */}
      <div className="hidden md:block flex-grow"></div>
      
      <div className="flex items-center gap-2 relative z-30">
        {/* Notification Bell - only shown for logged-in users */}
        <NotificationBell />
        
        {/* Currency Selector */}
        <div className="hidden md:block" style={{ width: '90px' }}>
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onChange={changeCurrency}
            availableCurrencies={availableCurrencies}
            compact={true}
          />
        </div>
        
        {/* Language Selector - clearly separated from currency */}
        <div className="hidden md:block">
          <LanguageSelector 
            variant="compact"
            showFlag={true}
            showText={false}
            className="border-l border-gray-300 pl-2 ml-2"
          />
        </div>
        
        {/* Hamburger menu button - only shown on mobile */}
        <button 
          ref={menuButtonRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden border border-gray-300 rounded-full p-2 bg-white hover:shadow-md transition-shadow"
          aria-label="Toggle mobile menu"
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
          className="profile items-center flex border border-gray-300 rounded-full py-2 px-4 gap-2 bg-white hover:shadow-md transition-shadow relative"
        >
          {!user ? (
            <div className="user">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#717171ff"
                className="w-7 h-7"
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
              <div className="bg-rose-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                {getFirstLetter()}
              </div>
            </>
          )}
        </Link>
      </div>
      
      {/* Semi-transparent overlay when menu is open */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" />
      )}
      
      {/* Mobile menu with user sections */}
      {mobileMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute top-16 left-0 right-0 bg-white p-4 shadow-md z-20 md:hidden rounded-b-lg"
        >
          <div className="flex flex-col gap-4">
            {/* Currency selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <div className="max-w-full">
                <CurrencySelector
                  selectedCurrency={selectedCurrency}
                  onChange={changeCurrency}
                  availableCurrencies={availableCurrencies}
                />
              </div>
            </div>
            
            {/* Language selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <div className="max-w-full">
                <LanguageSelector 
                  variant="dropdown"
                  showFlag={true}
                  showText={true}
                />
              </div>
            </div>
            
            {/* User menu section */}
            <div className="border-t pt-3">
              {user ? (
                <>
                  <Link 
                    to="/account" 
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </span>
                    My Account
                  </Link>
                  <Link 
                    to="/account/bookings" 
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg relative"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    My Bookings
                    <NotificationBell isMobile={true} />
                  </Link>
                  <Link 
                    to={user.userType === 'host' ? "/account/user-places" : "/"}
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </span>
                    {user.userType === 'host' ? 'My Listings' : 'Browse Listings'}
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    </span>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
