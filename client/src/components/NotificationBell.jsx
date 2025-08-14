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
    // For mobile menu, return a badge with count or just a small red dot for large numbers
    return unreadCount > 0 ? (
      <div className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
        <span className="text-white text-xs font-bold leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </div>
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
      {/* Bell SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 transition-colors duration-200 ${
          unreadCount > 0 
            ? "text-red-500" 
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {/* Bell icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      
      {/* Notification count badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-white text-xs font-bold leading-none px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </Link>
  );
}
