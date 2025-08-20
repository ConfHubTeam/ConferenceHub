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

// Color theme mapping for consistent styling
const COLOR_THEMES = {
  yellow: {
    active: "bg-orange-500 text-white border-orange-500",
    inactive: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    badge: "bg-orange-100 text-orange-700"
  },
  green: {
    active: "bg-status-success text-white border-status-success",
    inactive: "bg-success-50 text-status-success border-success-200 hover:bg-success-100",
    badge: "bg-success-100 text-status-success"
  },
  red: {
    active: "bg-status-error text-white border-status-error",
    inactive: "bg-error-50 text-status-error border-error-200 hover:bg-error-100",
    badge: "bg-error-100 text-status-error"
  },
  blue: {
    active: "bg-accent-primary text-white border-accent-primary",
    inactive: "bg-accent-50 text-accent-primary border-accent-200 hover:bg-accent-100",
    badge: "bg-accent-100 text-accent-primary"
  },
  primary: {
    active: "bg-slate-700 text-white border-slate-700",
    inactive: "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100",
    badge: "bg-slate-100 text-slate-800"
  },
  lightgray: {
    active: "bg-slate-400 text-white border-slate-400",
    inactive: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
    badge: "bg-slate-100 text-slate-700"
  },
  gray: {
    active: "bg-neutral-600 text-white border-neutral-600",
    inactive: "bg-bg-secondary text-text-secondary border-border-light hover:bg-neutral-100",
    badge: "bg-neutral-100 text-text-secondary"
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
    default: "px-3 py-2 text-sm sm:px-4 sm:py-2.5",
    large: "px-6 py-4 text-base"
  };
  
  return (
    <button
      onClick={() => onClick(status)}
      className={`
        border rounded-lg font-medium whitespace-nowrap
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
    default: "gap-3", 
    large: "gap-4"
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
