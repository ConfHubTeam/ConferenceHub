import React from "react";
import { useTranslation } from "react-i18next";

/**
 * StatusFilter Component
 * 
 * Displays clickable status buttons instead of dropdown for filtering bookings
 * Follows DRY and SOLID principles by being reusable across different user types
 */

// Status configuration for different user types
const STATUS_CONFIG = {
  client: {
    pending: { key: "pending", color: "yellow" },
    approved: { key: "approved", color: "green" },
    rejected: { key: "rejected", color: "red" },
    all: { key: "all", color: "gray" }
  },
  host: {
    pending: { key: "pending", color: "yellow" },
    approved: { key: "approved", color: "green" },
    rejected: { key: "rejected", color: "red" },
    paid_to_host: { key: "paid_to_host", color: "blue" },
    all: { key: "all", color: "gray" }
  },
  agent: {
    pending: { key: "pending", color: "yellow" },
    approved: { key: "approved", color: "green" },
    rejected: { key: "rejected", color: "red" },
    paid_to_host: { key: "paid_to_host", color: "blue" },
    all: { key: "all", color: "gray" }
  }
};

// Color theme mapping for consistent styling
const COLOR_THEMES = {
  yellow: {
    active: "bg-yellow-500 text-white border-yellow-500",
    inactive: "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-800"
  },
  green: {
    active: "bg-green-500 text-white border-green-500",
    inactive: "bg-white text-green-600 border-green-300 hover:bg-green-50",
    badge: "bg-green-100 text-green-800"
  },
  red: {
    active: "bg-orange-500 text-white border-orange-500",
    inactive: "bg-white text-orange-600 border-orange-300 hover:bg-orange-50",
    badge: "bg-orange-100 text-orange-800"
  },
  blue: {
    active: "bg-blue-500 text-white border-blue-500",
    inactive: "bg-white text-blue-600 border-blue-300 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-800"
  },
  gray: {
    active: "bg-gray-500 text-white border-gray-500",
    inactive: "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
    badge: "bg-gray-100 text-gray-800"
  }
};

/**
 * Individual Status Button Component
 * Encapsulates the display logic for a single status filter button
 */
const StatusButton = ({ 
  status, 
  label, 
  color, 
  count, 
  isActive, 
  onClick,
  size = "default",
  className = "" 
}) => {
  const theme = COLOR_THEMES[color];
  const buttonClasses = isActive ? theme.active : theme.inactive;
  
  // Size variants for different layouts
  const sizeClasses = {
    compact: "px-3 py-2 text-xs",
    default: "px-3 sm:px-4 py-2 sm:py-2.5 text-sm",
    large: "px-4 py-3 text-base"
  };
  
  return (
    <button
      onClick={() => onClick(status)}
      className={`
        border-2 rounded-lg font-medium whitespace-nowrap
        transition-all duration-200 ease-in-out transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500
        ${buttonClasses} ${sizeClasses[size]} ${className}
      `}
      aria-pressed={isActive}
      role="button"
    >
      <span className="flex items-center gap-1.5">
        <span className="truncate">{label}</span>
        <span className={`
          px-1.5 py-0.5 rounded-full font-semibold
          ${size === 'compact' ? 'text-xs' : 'text-xs'}
          ${isActive ? 'bg-white/20 text-white' : theme.badge}
        `}>
          {count}
        </span>
      </span>
    </button>
  );
};

/**
 * StatusFilter Component
 * Main component that renders clickable status filter buttons
 */
export default function StatusFilter({ 
  userType, 
  currentStatus, 
  onStatusChange, 
  stats,
  className = "",
  size = "default" // "compact" | "default" | "large"
}) {
  const { t } = useTranslation('booking');
  const statusConfig = STATUS_CONFIG[userType] || STATUS_CONFIG.client;
  
  // Define the order of status buttons
  const statusOrder = userType === 'client' 
    ? ["pending", "approved", "rejected", "all"]
    : ["pending", "approved", "paid_to_host", "rejected", "all"];
  
  // Size variants for different use cases
  const sizeClasses = {
    compact: "gap-2",
    default: "gap-2 sm:gap-3", 
    large: "gap-3 sm:gap-4"
  };

  // For compact size, use horizontal scroll to prevent overflow
  const containerClasses = size === 'compact' 
    ? `flex overflow-x-auto scrollbar-hide ${sizeClasses[size]} ${className}`
    : `flex flex-wrap items-center ${sizeClasses[size]} ${className}`;

  const handleStatusClick = (status) => {
    if (typeof onStatusChange === "function") {
      onStatusChange(status);
    }
  };

  return (
    <div className={containerClasses} role="group" aria-label="Status filter">
      {statusOrder.map((status) => {
        const config = statusConfig[status];
        
        // Get the translated label
        const label = t(`filters.statusLabels.${userType}.${status}`) || status;
        
        // Calculate count - for "all", sum all status counts
        let count;
        if (status === "all") {
          count = (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0) + (stats.paidToHostCount || 0);
        } else if (status === "paid_to_host") {
          count = stats.paidToHostCount || 0;
        } else {
          count = stats[status] || 0;
        }
        
        return (
          <StatusButton
            key={status}
            status={status}
            label={label}
            color={config.color}
            count={count}
            isActive={currentStatus === status}
            onClick={handleStatusClick}
            size={size}
            className={size === 'compact' ? 'flex-shrink-0' : ''}
          />
        );
      })}
    </div>
  );
}

/**
 * Helper hook for managing status filter state
 * Encapsulates the logic for status changes and provides a clean API
 */
export const useStatusFilter = (initialStatus = "pending") => {
  const [statusFilter, setStatusFilter] = React.useState(initialStatus);
  
  const handleStatusChange = React.useCallback((newStatus) => {
    setStatusFilter(newStatus);
  }, []);
  
  const resetToDefault = React.useCallback(() => {
    setStatusFilter("pending");
  }, []);
  
  return {
    statusFilter,
    setStatusFilter,
    handleStatusChange,
    resetToDefault
  };
};
