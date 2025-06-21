import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useBookingNotifications } from "../contexts/BookingNotificationContext";
import NotificationBadge from "./NotificationBadge";

export default function NotificationBell({ isMobile = false, onClick }) {
  const { user } = useContext(UserContext);
  const { getRelevantCount } = useBookingNotifications();

  // Only show notification bell for logged-in users
  if (!user) return null;

  const notificationCount = getRelevantCount();

  if (isMobile) {
    // For mobile menu, return just the notification badge
    return notificationCount > 0 ? (
      <NotificationBadge count={notificationCount} size="sm" className="absolute top-2 right-2" />
    ) : null;
  }

  return (
    <Link 
      to="/account/bookings" 
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
      title="View notifications"
      onClick={onClick}
    >
      {notificationCount > 0 ? (
        // Bell with red lines and larger dot SVG for notifications
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="#ef4444"
          className="w-6 h-6 animate-shake transition-colors duration-200"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
          <circle cx="17" cy="6" r="4" fill="#ef4444" stroke="white" strokeWidth="2"/>
        </svg>
      ) : (
        // Regular bell SVG for no notifications
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
      )}
    </Link>
  );
}
