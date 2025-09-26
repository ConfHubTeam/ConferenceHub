/**
 * Get CSS classes for booking status badge
 * @param {string} status - Booking status
 * @returns {string} CSS classes for badge
 */
export const getStatusBadgeClass = (status) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full border";
  
  switch (status?.toLowerCase()) {
    case "pending":
      return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`;
    case "selected":
      return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
    case "approved":
      return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
    case "rejected":
      return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
    case "cancelled":
      return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
  }
};

/**
 * Get display text for booking status
 * @param {string} status - Booking status
 * @returns {string} Display text
 */
export const getStatusDisplayText = (status) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Check if user can perform action on booking
 * @param {Object} user - Current user
 * @param {Object} booking - Booking object
 * @param {string} action - Action type ('approve', 'reject', 'cancel', 'select')
 * @param {Array} competingBookings - Array of competing bookings (optional)
 * @returns {boolean} True if action is allowed
 */
export const canPerformBookingAction = (user, booking, action, competingBookings = []) => {
  if (!user || !booking) return false;
  
  const { userType, id: userId } = user;
  const { status, userId: bookingUserId, place } = booking;
  
  // Define which statuses allow which actions
  const allowedStatusesForAction = {
    "approve": ["pending", "selected"], // Can approve pending or selected bookings
    "reject": ["pending", "selected", "approved"],  // Can reject pending, selected, or approved bookings (agents can reject approved)
    "select": ["pending"],              // Can only select pending bookings
    "cancel": ["pending", "selected"],  // Clients can cancel pending or selected bookings
    "view": ["pending", "selected", "approved", "rejected", "cancelled"], // Can view any status
    "pay": ["selected"]                 // Clients can only pay for selected bookings
  };
  
  // Check if action is allowed for current status
  if (!allowedStatusesForAction[action]?.includes(status)) return false;
  
  switch (action) {
    case "approve":
    case "reject":
      // Check if user has authorization
      const hasAuthorization = (
        userType === "agent" || 
        (userType === "host" && place?.ownerId === userId)
      );
      
      if (!hasAuthorization) return false;
      
      // Special case: only agents can reject approved bookings
      if (action === "reject" && status === "approved" && userType !== "agent") {
        return false;
      }
      
      // For approve action, check competing bookings
      if (action === "approve" && status === "pending") {
        // Check if there's a selected booking among competitors
        const hasSelectedCompetitor = competingBookings.some(
          competitor => competitor.status === "selected" && competitor.id !== booking.id
        );
        
        // If there's a selected competitor, this pending booking cannot be approved
        if (hasSelectedCompetitor) return false;
      }
      
      return true;
    
    case "select":
      // Only hosts/agents can select pending bookings
      const canSelect = (
        userType === "agent" || 
        (userType === "host" && place?.ownerId === userId)
      );
      
      if (!canSelect) return false;
      
      // Check if there's already a selected booking among competitors
      const hasSelectedCompetitor = competingBookings.some(
        competitor => competitor.status === "selected" && competitor.id !== booking.id
      );
      
      return !hasSelectedCompetitor;
    
    case "cancel":
      return (
        userType === "client" && 
        bookingUserId === userId
      );
    
    case "pay":
      // Only clients can pay for their own selected bookings
      return (
        userType === "client" && 
        bookingUserId === userId &&
        status === "selected"
      );
    
    case "view":
      return (
        userType === "agent" ||
        (userType === "client" && bookingUserId === userId) ||
        (userType === "host" && place?.ownerId === userId)
      );
    
    default:
      return false;
  }
};

/**
 * Get booking priority based on status and creation time
 * @param {Object} booking - Booking object
 * @returns {number} Priority number (lower = higher priority)
 */
export const getBookingPriority = (booking) => {
  const statusPriority = {
    "selected": 1,    // Highest priority - payment pending
    "pending": 2,     // Second priority - awaiting selection
    "approved": 3,    // Third priority - completed bookings
    "rejected": 4,    // Fourth priority
    "cancelled": 5    // Lowest priority
  };
  
  return statusPriority[booking.status] || 6;
};

/**
 * Calculate total booking amount including all fees
 * @param {Object} booking - Booking object
 * @returns {number} Total amount
 */
export const calculateBookingTotal = (booking) => {
  if (!booking) return 0;
  
  const {
    totalPrice = 0,
    serviceFee = 0,
    protectionPlanFee = 0,
    finalTotal
  } = booking;
  
  // Use finalTotal if available, otherwise calculate
  return finalTotal || (totalPrice + serviceFee + protectionPlanFee);
};

/**
 * Check if booking is editable
 * @param {Object} booking - Booking object
 * @param {Object} user - Current user
 * @returns {boolean} True if editable
 */
export const isBookingEditable = (booking, user) => {
  if (!booking || !user) return false;
  
  // Only pending and selected bookings can be edited
  if (!["pending", "selected"].includes(booking.status)) return false;
  
  // Only clients can edit their own bookings
  return user.userType === "client" && booking.userId === user.id;
};

/**
 * Get action buttons available for a booking based on user permissions and booking status
 * @param {Object} booking - Booking object
 * @param {Object} user - Current user object
 * @param {Array} competingBookings - Array of competing bookings
 * @param {Function} t - Translation function
 * @returns {Object} Object with buttons array and optional note
 */
export const getBookingActionButtons = (booking, user, competingBookings = [], t = (key) => key) => {
  const buttons = [];
  let note = null;
  
  // Check if there's a selected competitor for pending bookings
  const hasSelectedCompetitor = competingBookings.some(
    competitor => competitor.status === "selected" && competitor.id !== booking.id
  );
  
  // Add note for pending bookings that cannot be approved/selected due to competing selection
  if (booking.status === "pending" && hasSelectedCompetitor) {
    note = "Note: Cannot be approved or selected due to another competing request being selected for this time slot.";
  }
  
  // Select button for hosts/agents on pending bookings
  if (canPerformBookingAction(user, booking, "select", competingBookings)) {
    buttons.push({
      label: t('details.actions.buttons.select'),
      action: "selected",
      variant: "primary",
      icon: "check-circle",
      description: t('details.actions.confirmations.select')
    });
  }
  
  // Approve button logic
  if (canPerformBookingAction(user, booking, "approve", competingBookings)) {
    const isSelected = booking.status === "selected";
    const isPending = booking.status === "pending";
    const isHost = user.userType === "host";
    const isAgent = user.userType === "agent";
    
    if (isPending && hasSelectedCompetitor) {
      // For pending bookings with selected competitors - disable approve
      buttons.push({
        label: t('details.actions.buttons.approve'),
        action: "approved",
        variant: "secondary",
        icon: "check",
        disabled: true,
        description: "Cannot approve - another booking is already selected for this time slot"
      });
    } else if (isPending && isHost) {
      // For hosts on pending bookings: Approve button is not visible (no payment yet)
      // Don't add approve button for hosts until payment is made
    } else if (isSelected && isHost) {
      // For hosts on selected bookings: Approve button is disabled (waiting for payment)
      buttons.push({
        label: t('details.actions.buttons.approve'),
        action: "approved",
        variant: "secondary",
        icon: "check",
        disabled: true,
        description: "Waiting for client payment before approval"
      });
    } else if (isSelected && isAgent) {
      // For agents on selected bookings: Approve button is available
      buttons.push({
        label: t('details.actions.buttons.approve'),
        action: "approved",
        variant: "success",
        icon: "check",
        requiresPaymentCheck: false, 
        agentApproval: true, 
        description: t('details.actions.confirmations.approve')
      });
    } else if (isPending && isAgent) {
      // For agents on pending bookings: Approve button is always available
      buttons.push({
        label: t('details.actions.buttons.approve'),
        action: "approved",
        variant: "success",
        icon: "check",
        description: t('details.actions.confirmations.approve')
      });
    }
  }
  
  // Reject button
  if (canPerformBookingAction(user, booking, "reject", competingBookings)) {
    buttons.push({
      label: t('details.actions.buttons.reject'),
      action: "rejected",
      variant: "danger",
      icon: "x",
      description: t('details.actions.confirmations.reject')
    });
  }
  
  // Cancel button for clients
  if (canPerformBookingAction(user, booking, "cancel", competingBookings)) {
    buttons.push({
      label: t('details.actions.buttons.cancel'),
      action: "rejected",
      variant: "danger",
      icon: "x",
      description: t('details.actions.confirmations.cancel')
    });
  }

  // Paid to Host button for agents on approved unpaid bookings
  if (canMarkPaidToHost(user, booking)) {
    buttons.push({
      label: t('details.actions.buttons.markPaid'),
      action: "paid_to_host",
      variant: "primary",
      icon: "dollar-sign",
      description: t('details.actions.confirmations.markPaid')
    });
  }
  
  return { buttons, note };
};

/**
 * Check if booking requires payment before approval
 * @param {Object} booking - Booking object
 * @returns {boolean} True if payment is required
 */
export const requiresPaymentBeforeApproval = (booking) => {
  return booking?.status === "selected";
};

/**
 * Get booking status message for display
 * @param {string} status - Booking status
 * @param {Object} user - Current user context
 * @returns {string} Status message
 */
export const getBookingStatusMessage = (status, user) => {
  const isClient = user?.userType === "client";
  
  switch (status?.toLowerCase()) {
    case "pending":
      return isClient 
        ? "Your booking request is pending review" 
        : "Booking request awaiting your decision";
    case "selected":
      return isClient 
        ? "Your booking has been selected! Complete payment to confirm." 
        : "Booking selected - awaiting client payment";
    case "approved":
      return "Booking confirmed and approved";
    case "rejected":
      return "Booking request was declined";
    case "cancelled":
      return "Booking was cancelled";
    default:
      return "Unknown booking status";
  }
};

/**
 * Check if booking can transition to selected status
 * @param {Object} booking - Booking object
 * @param {Array} competingBookings - Array of competing bookings
 * @returns {boolean} True if can be selected
 */
export const canSelectBooking = (booking, competingBookings = []) => {
  // Can only select pending bookings
  if (booking.status !== "pending") return false;
  
  // Check if there's already a selected booking for the same time slots
  const hasSelectedCompetitor = competingBookings.some(
    competitor => competitor.status === "selected" && competitor.id !== booking.id
  );
  
  return !hasSelectedCompetitor;
};

/**
 * Get notification message for booking status changes
 * @param {string} newStatus - New booking status
 * @param {string} oldStatus - Previous booking status
 * @param {Object} user - User who performed the action
 * @returns {string} Notification message
 */
export const getBookingStatusChangeMessage = (newStatus, oldStatus, user) => {
  const userType = user?.userType || "user";
  
  switch (newStatus) {
    case "selected":
      return `Booking has been selected by the ${userType}. You can now proceed with payment.`;
    case "approved":
      return oldStatus === "selected" 
        ? "Payment completed successfully! Your booking is now confirmed."
        : "Your booking request has been approved!";
    case "rejected":
      return oldStatus === "selected"
        ? "Booking was declined after selection."
        : "Your booking request was declined.";
    default:
      return `Booking status updated to ${newStatus}`;
  }
};

/**
 * Validate booking status transition
 * @param {string} currentStatus - Current booking status
 * @param {string} newStatus - Intended new status
 * @returns {Object} Validation result with isValid and message
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    "pending": ["selected", "approved", "rejected"],
    "selected": ["approved", "rejected"],
    "approved": [], // Final status - no transitions allowed
    "rejected": [], // Final status - no transitions allowed
    "cancelled": [] // Final status - no transitions allowed
  };
  
  const allowedTransitions = validTransitions[currentStatus] || [];
  const isValid = allowedTransitions.includes(newStatus);
  
  return {
    isValid,
    message: isValid 
      ? "Status transition is valid"
      : `Cannot transition from ${currentStatus} to ${newStatus}`
  };
};

/**
 * Check if user can mark booking as paid to host
 * @param {Object} user - Current user object
 * @param {Object} booking - Booking object
 * @returns {boolean} True if user can mark as paid to host
 */
export const canMarkPaidToHost = (user, booking) => {
  return (
    user?.userType === 'agent' &&
    booking.status === 'approved' &&
    !booking.paidToHost
  );
};

/**
 * Check if booking shows paid to host status (for display purposes)
 * @param {Object} user - Current user object
 * @param {Object} booking - Booking object
 * @returns {boolean} True if paid to host status should be shown
 */
export const shouldShowPaidToHostStatus = (user, booking) => {
  return (
    (user?.userType === 'agent' || user?.userType === 'host') &&
    booking.status === 'approved'
  );
};
