import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useReviewNotifications } from "../contexts/ReviewNotificationContext";
import { HiOutlineBell } from "react-icons/hi2";

export default function NotificationBell({ isMobile = false, onClick, theme = "light" }) {
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
      className={`relative p-2 rounded-full transition-all duration-200 hover-pop ${
        theme === "dark" ? "hover:bg-white/10" : "hover:bg-bg-secondary"
      }`}
      title="View notifications"
      onClick={onClick}
    >
      {/* Bell Icon */}
      <HiOutlineBell 
        className={`w-6 h-6 transition-colors duration-200 ${
          unreadCount > 0
            ? "text-red-500"
            : theme === "dark"
              ? "text-white/90 hover:text-white"
              : "text-gray-600 hover:text-gray-800"
        }`}
      />
      
      {/* Notification count badge */}
      {unreadCount > 0 && (
        <div className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center border-2 ${
          theme === "dark" ? "border-navy-800" : "border-white"
        }`}>
          <span className="text-white text-xs font-bold leading-none px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </Link>
  );
}
