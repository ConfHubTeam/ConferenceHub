import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "./UserContext";
import { useReviewNotifications } from "../contexts/ReviewNotificationContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { 
  HiOutlineHome, 
  HiOutlineClipboardList, 
  HiOutlineHeart,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineStar
} from "react-icons/hi";
import { PiWarehouse } from "react-icons/pi";


/**
 * UserNavigation Component
 * Compact header navigation for authenticated users
 * Positioned centrally in the header between logo and notifications
 */
export default function UserNavigation() {
  const { t } = useTranslation("navigation");
  const { pathname } = useLocation();
  const { user } = useContext(UserContext);
  const { unreadCount } = useReviewNotifications();
  const { favoritesCount } = useFavorites();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  let subpage = pathname.split("/")?.[2]; 
  if (subpage === undefined) {
    // If we're on /account, default to profile
    if (pathname === "/account") {
      subpage = "profile";
    }
    // If we're on /places, set to home
    else if (pathname === "/places") {
      subpage = "home";
    }
    // Default fallback
    else {
      subpage = "profile";
    }
  }

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      
      if (scrollLeft <= 5) {
        setShowLeftArrow(false);
        setShowRightArrow(maxScroll > 5);
      } else if (scrollLeft >= maxScroll - 5) {
        setShowLeftArrow(true);
        setShowRightArrow(false);
      } else {
        setShowLeftArrow(true);
        setShowRightArrow(true);
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      // Initial check
      checkScrollPosition();
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  // Define navigation items by category
  const homeNavItem = {
    key: "home",
    to: "/places",
    icon: <HiOutlineHome className="w-6 h-6" />,
    label: t("header.navigation.home", "Home")
  };

  const coreNavItems = [
    { 
      key: "bookings", 
      to: "/account/bookings", 
      icon: <HiOutlineClipboardList className="w-6 h-6" />,
      label: t("accountNav.bookings")
    },
    // Only show favorites for regular users (not hosts or agents)
    ...(user?.userType !== 'host' && user?.userType !== 'agent' ? [{ 
      key: "favorites", 
      to: "/account/favorites", 
      icon: <HiOutlineHeart className="w-6 h-6" />,
      label: t("accountNav.favorites"),
      hasCount: favoritesCount > 0,
      count: favoritesCount
    }] : [])
  ];

  const hostNavItems = [
    { 
      key: "user-places", 
      to: "/account/user-places", 
      icon: <PiWarehouse className="w-6 h-6" />,
      label: t("header.navigation.myPlaces", "My Places")
    },
    { 
      key: "hostdashboard", 
      to: "/account/hostdashboard", 
      icon: <HiOutlineChartBar className="w-6 h-6" />,
      label: t("accountNav.dashboard")
    }
  ];

  const agentNavItems = [
    { 
      key: "users", 
      to: "/account/users", 
      icon: <HiOutlineUsers className="w-6 h-6" />,
      label: t("accountNav.users")
    },
    { 
      key: "all-places", 
      to: "/account/all-places", 
      icon: <PiWarehouse className="w-6 h-6" />,
      label: t("accountNav.places")
    },
    { 
      key: "reviews", 
      to: "/account/reviews", 
      icon: <HiOutlineStar className="w-6 h-6" />,
      label: t("accountNav.reviews")
    },
    { 
      key: "dashboard", 
      to: "/account/dashboard", 
      icon: <HiOutlineChartBar className="w-6 h-6" />,
      label: t("accountNav.dashboard")
    }
  ];

  // Get all navigation items based on user type
  // Only show home button when not on the /places page
  const allNavItems = [
    ...(pathname !== "/places" ? [homeNavItem] : []),
    ...coreNavItems,
    ...(user?.userType === 'host' ? hostNavItems : []),
    ...(user?.userType === 'agent' ? agentNavItems : [])
  ];

  // Don't render if user is not authenticated
  if (!user) return null;

  return (
    <div className="flex items-center min-w-0 relative max-w-fit">
      {/* Left Arrow - positioned like FilterRow */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-sm hover:bg-white transition-all border border-gray-200"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {/* Right Arrow - positioned like FilterRow */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-sm hover:bg-white transition-all border border-gray-200"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Navigation container with FilterRow-style scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center space-x-1 overflow-x-auto scrollbar-hide pb-1 -mb-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={checkScrollPosition}
      >
        <div className="flex items-center space-x-1 flex-shrink-0 px-6">
          {allNavItems.map((item) => (
            <Link
              key={item.key}
              className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                item.key === subpage
                  ? 'bg-white text-primary border border-primary shadow-sm'
                  : 'bg-white text-gray-600 border border-transparent hover:text-primary hover:bg-gray-50'
              }`}
              to={item.to}
            >
              <div className="relative">
                {item.icon}
                {item.hasNotification && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
                {item.hasCount && item.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                    {item.count > 9 ? '9+' : item.count}
                  </div>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
