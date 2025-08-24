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
    paid_to_host: { key: "paid_to_host", color: "primary" },
    all: { key: "all", color: "gray" }
  },
  agent: {
    pending: { key: "pending", color: "yellow" },
    approved: { key: "approved", color: "green" },
    rejected: { key: "rejected", color: "red" },
    paid_to_host: { key: "paid_to_host", color: "primary" },
    all: { key: "all", color: "gray" }
  }
};

// Color theme mapping for consistent styling - updated to match UsersPage with visible borders
const COLOR_THEMES = {
  yellow: {
    active: "bg-orange-500 text-white border-orange-600 shadow-ui hover:bg-orange-600",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300",
    badge: "bg-white/20 text-white"
  },
  green: {
    active: "bg-success-500 text-white border-success-600 shadow-ui hover:bg-success-600",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-success-50 hover:text-success-600 hover:border-success-300",
    badge: "bg-white/20 text-white"
  },
  red: {
    active: "bg-error-500 text-white border-error-600 shadow-ui hover:bg-error-600",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-error-50 hover:text-error-600 hover:border-error-300",
    badge: "bg-white/20 text-white"
  },
  blue: {
    active: "bg-info-500 text-white border-info-600 shadow-ui hover:bg-info-600",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-info-50 hover:text-info-600 hover:border-info-300",
    badge: "bg-white/20 text-white"
  },
  primary: {
    active: "bg-secondary text-white border-accent-primary shadow-ui hover:bg-secondary/90",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30",
    badge: "bg-white/20 text-white"
  },
  lightgray: {
    active: "bg-slate-400 text-white border-slate-500 shadow-ui hover:bg-slate-500",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300",
    badge: "bg-white/20 text-white"
  },
  gray: {
    active: "bg-accent-primary text-white border-accent-hover shadow-ui hover:bg-accent-hover",
    inactive: "bg-bg-card text-text-primary border-border-default hover:bg-accent-primary/10 hover:text-accent-primary hover:border-accent-primary",
    badge: "bg-white/20 text-white"
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
  
  // Size variants for different layouts - updated to match UsersPage
  const sizeClasses = {
    compact: "px-2 py-2 text-xs",
    default: "px-2 sm:px-4 py-2 text-xs sm:text-sm",
    large: "px-6 py-4 text-base"
  };
  
  return (
    <button
      onClick={() => onClick(status)}
      className={`
        flex-shrink-0 border rounded-lg font-medium whitespace-nowrap
        transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-1
        ${buttonClasses} ${sizeClasses[size]} ${className}
      `}
      aria-pressed={isActive}
      role="button"
    >
      <span className="flex items-center gap-1.5 sm:gap-2">
        <span className="truncate">{label}</span>
        <span className={`
          px-1.5 py-0.5 rounded-full font-semibold text-xs min-w-[1.25rem] text-center
          ${isActive ? theme.badge : 'bg-neutral-100 text-text-secondary'}
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
  
  // Size variants for different use cases - updated to match UsersPage
  const sizeClasses = {
    compact: "gap-1",
    default: "gap-1 sm:gap-2", 
    large: "gap-4"
  };

  // Container classes to match UsersPage layout with proper space for all borders
  const containerClasses = `flex overflow-x-auto scrollbar-hide px-2 py-2 ${sizeClasses[size]} ${className}`;

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
            className="flex-shrink-0"
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
