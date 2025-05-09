import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function Header() {
  const {user} = useContext(UserContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [adminLinkVisible, setAdminLinkVisible] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const filterRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const mobileFilterRef = useRef(null);
  const location = useLocation();
  
  // Form state for search
  const [searchLocation, setSearchLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Available tags for filtering
  const availableTags = ['wifi', 'parking', 'projector', 'videoConference', 'whiteboard', 'coffee', 'catering', 'accessibility'];

  // Effect to read URL params and set states on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('location')) setSearchLocation(params.get('location'));
    if (params.has('checkIn')) setCheckInDate(params.get('checkIn'));
    if (params.has('checkOut')) setCheckOutDate(params.get('checkOut'));
    if (params.has('guests')) setGuestCount(params.get('guests'));
    if (params.has('minPrice')) setMinPrice(params.get('minPrice'));
    if (params.has('maxPrice')) setMaxPrice(params.get('maxPrice'));
    if (params.has('tags')) setSelectedTags(params.get('tags').split(','));
  }, [location.search]);

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
      
      // Handle filter menu closing - check if the click was outside both the filter trigger and dropdown
      if (
        filterExpanded &&
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target) &&
        mobileFilterRef.current &&
        !mobileFilterRef.current.contains(event.target)
      ) {
        setFilterExpanded(false);
      }
    }
    
    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent body scrolling when menu is open
    if (mobileMenuOpen || filterExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, filterExpanded]);

  // Function to get the first letter of the user's name
  const getFirstLetter = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "";
  };

  // Easter egg for admin login - show admin link when logo is clicked 5 times
  const handleLogoClick = () => {
    // Create a counter in sessionStorage
    const currentCount = parseInt(sessionStorage.getItem('logoClickCount') || '0');
    const newCount = currentCount + 1;
    sessionStorage.setItem('logoClickCount', newCount.toString());
    
    // Show admin link after 5 clicks
    if (newCount >= 5) {
      setAdminLinkVisible(true);
    }
  };

  // Function to handle search submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    // Close the menus
    setMobileMenuOpen(false);
    setFilterExpanded(false);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (checkInDate) params.append('checkIn', checkInDate);
    if (checkOutDate) params.append('checkOut', checkOutDate);
    if (guestCount) params.append('guests', guestCount);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
    
    // Navigate to home page with search filters
    navigate(`/?${params.toString()}`);
  };
  
  // Function to handle menu link clicks
  const handleMenuLinkClick = () => {
    setMobileMenuOpen(false);
  };
  
  // Function to handle tag selection
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Function to toggle filter expanded state
  const toggleFilterExpanded = (e) => {
    if (e) e.stopPropagation();
    setFilterExpanded(!filterExpanded);
  };

  // Summary text for search bar based on selected filters
  const getFilterSummary = () => {
    let locationText = searchLocation || 'Anywhere';
    let dateText = (checkInDate && checkOutDate) ? 'Selected dates' : 'Any week';
    let guestsText = guestCount ? `${guestCount} guests` : 'Add guests';
    
    return { locationText, dateText, guestsText };
  };

  const { locationText, dateText, guestsText } = getFilterSummary();

  // Styles for filter dropdown animation
  const filterDropdownStyle = {
    animation: filterExpanded ? 'filterDropdown 0.3s ease-out forwards' : 'none',
    opacity: filterExpanded ? 1 : 0,
    transform: filterExpanded ? 'scale(1)' : 'scale(0.95)',
    maxHeight: filterExpanded ? '1000px' : '0',
    overflow: 'hidden',
    transition: 'opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease'
  };

  // Function to reset all filters
  const resetFilters = (e) => {
    if (e) e.stopPropagation();
    setSearchLocation('');
    setCheckInDate('');
    setCheckOutDate('');
    setGuestCount('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTags([]);
    
    // If we're on the home page with filters, navigate to home without filters
    if (location.pathname === '/' && location.search) {
      navigate('/');
    }
  };

  return (
    <header className="flex justify-between items-center px-4 md:px-14 relative z-50">
      <div className="flex flex-col">
        <Link to={"/"} className="logo flex items-center gap-1 text-primary" onClick={handleLogoClick}>
          <span className="font-bold text-xl">ConferenceHub</span>
        </Link>
      </div>
      
      {/* Empty div for spacing in the center */}
      <div className="hidden md:block flex-grow"></div>
      
      <div className="flex items-center gap-2 relative z-30">
        {/* Desktop filter button - now next to account icon */}
        <button 
          ref={filterRef} 
          className="hidden md:flex border border-gray-300 rounded-full p-1.5 bg-white hover:shadow-md transition-shadow"
          onClick={toggleFilterExpanded}
          aria-label="Toggle search filters"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.8} 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" 
            />
          </svg>
        </button>

        {/* Mobile search button - only shown on mobile */}
        <button 
          ref={mobileFilterRef}
          onClick={toggleFilterExpanded} 
          className="md:hidden border border-gray-300 rounded-full p-1.5 bg-white hover:shadow-md transition-shadow"
          aria-label="Toggle mobile search"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.8} 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" 
            />
          </svg>
        </button>
        
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
          className="profile items-center flex border border-gray-300 rounded-full py-2 px-4 gap-2 bg-white hover:shadow-md transition-shadow"
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
      {(mobileMenuOpen || filterExpanded) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" />
      )}
      
      {/* Mobile menu with user sections */}
      {mobileMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute top-16 left-0 right-0 bg-white p-4 shadow-md z-20 md:hidden rounded-b-lg"
        >
          <div className="flex flex-col gap-4">
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
                    className="flex items-center py-3 px-2 hover:bg-gray-100 rounded-lg"
                    onClick={handleMenuLinkClick}
                  >
                    <span className="mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    My Bookings
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
      
      {/* Expanded filter dropdown - shared between mobile and desktop */}
      {filterExpanded && (
        <div 
          ref={filterDropdownRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 top-16 z-30 bg-white shadow-lg rounded-b-xl p-4 pb-6 mx-auto overflow-auto"
          style={{
            ...filterDropdownStyle,
            width: '100%',
            maxWidth: '1200px',
            maxHeight: 'calc(100vh - 180px)', // Limit height and allow scrolling
            overflowY: 'auto',
            bottom: 'auto', // Remove bottom positioning
            marginBottom: '80px' // Add margin at the bottom
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Location filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, address, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Date filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check in</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check out</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          
            {/* Guests count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <input 
                type="number" 
                placeholder="Number of guests" 
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price range ($/hour)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Features & Services</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                // Map tag keys to display-friendly names
                const tagDisplayNames = {
                  'wifi': 'High-Speed WiFi',
                  'parking': 'On-site Parking',
                  'projector': 'Projector',
                  'videoConference': 'Video Conference',
                  'whiteboard': 'Whiteboard',
                  'coffee': 'Coffee Service',
                  'catering': 'Catering',
                  'accessibility': 'Accessibility'
                };
                
                return (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagToggle(tag);
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tagDisplayNames[tag] || tag}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {/* Check if any filters are active */}
            {(searchLocation || checkInDate || checkOutDate || guestCount || 
              minPrice || maxPrice || selectedTags.length > 0) && (
              <button 
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset Filters
              </button>
            )}
            <div className="flex ml-auto space-x-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterExpanded(false);
                }}
                className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearch();
                }}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add space at the bottom when filter is expanded on mobile */}
      {filterExpanded && (
        <div className="md:hidden h-32"></div>
      )}
      
      {/* Add keyframes for filter dropdown animation */}
      <style jsx="true">{`
        @keyframes filterDropdown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
