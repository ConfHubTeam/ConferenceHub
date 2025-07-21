import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useReviewNotifications } from "../contexts/ReviewNotificationContext";

export default function NotificationBell({ isMobile = false, onClick }) {
  const { user } = useContext(UserContext);
  const { unreadCount } = useReviewNotifications(); // Now handles both review and booking notifications

  // Only show notification bell for logged-in users
  if (!user) return null;

  if (isMobile) {
    // For mobile menu, return just a small red dot
    return unreadCount > 0 ? (
      <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
    ) : null;
  }

  // Determine the link destination based on unread count
  const linkTo = unreadCount > 0 ? "/account/notifications?filter=unread" : "/account/notifications";

  return (
    <Link 
      to={linkTo}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
      title="View notifications"
      onClick={onClick}
    >
      {/* Single Bell SVG with built-in red dot when there are notifications */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 transition-colors duration-200 ${
          unreadCount > 0 
            ? "text-red-500 animate-shake" 
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {/* Bell icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
        
        {/* Built-in red dot notification indicator */}
        {unreadCount > 0 && (
          <circle
            cx="18"
            cy="6"
            r="3"
            fill="#ef4444"
            stroke="white"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </Link>
  );
}
