/**
 * NotificationBadge - Reusable notification badge component
 * Follows DRY principle for consistent notification display
 */
export default function NotificationBadge({ count, size = "sm", className = "" }) {
  if (!count || count === 0) return null;

  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={`
      absolute -top-1 -right-1 
      ${sizeClasses[size]} 
      bg-red-500 
      rounded-full 
      border-2 border-white
      z-10
      ${className}
    `}>
    </div>
  );
}
