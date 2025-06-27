import { format } from "date-fns";

/**
 * Helper functions for BookingDetailsPage
 */

/**
 * Format refund options for display
 */
export const formatRefundOption = (option) => {
  const optionMap = {
    'flexible_14_day': 'Flexible 14-Day: Full refund if canceled 14+ days before check-in',
    'moderate_7_day': 'Moderate 7-Day: 50% refund if canceled 7+ days before check-in', 
    'strict': 'Strict: No refund unless exceptional circumstances',
    'non_refundable': 'Non-Refundable: No refunds allowed',
    'reschedule_only': 'Reschedule Only: Can reschedule but no monetary refund',
    'client_protection_plan': 'Client Protection Plan: Additional insurance coverage available'
  };
  return optionMap[option] || option;
};

/**
 * Get contact info display object
 */
export const getContactDisplayInfo = (contactData) => {
  if (!contactData) return null;
  
  return {
    name: contactData.name,
    email: contactData.email,
    phoneNumber: contactData.phoneNumber
  };
};

/**
 * Get booking info cards data
 */
export const getBookingInfoCards = (booking) => {
  return [
    {
      title: "Number of Guests",
      icon: "guests",
      value: booking.numOfGuests
    },
    {
      title: "Booking Date",
      icon: "calendar",
      value: format(new Date(booking.createdAt), "MMM d, yyyy 'at' HH:mm")
    },
    {
      title: "Request ID",
      icon: "code",
      value: booking.uniqueRequestId || `REQ-${booking.id}`,
      className: "font-mono"
    }
  ];
};

/**
 * Get action button styles
 */
export const getActionButtonClasses = (variant) => {
  const baseClasses = "w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50";
  
  switch (variant) {
    case "primary":
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    case "success":
      return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
    case "danger":
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    case "secondary":
      return `${baseClasses} bg-gray-400 text-white cursor-not-allowed`;
    default:
      return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
  }
};

/**
 * Get payment provider data
 */
export const getPaymentProviders = () => [
  {
    id: 'click',
    name: 'Click',
    iconSrc: '/click_pay_icon.jpg',
    alt: 'Click Pay'
  },
  {
    id: 'payme',
    name: 'Payme',
    iconSrc: '/payme_icon.png',
    alt: 'Payme'
  },
  {
    id: 'octo',
    name: 'Octo',
    iconSrc: '/octo_pay_icon.webp',
    alt: 'Octo Pay'
  }
];

/**
 * Generate payment status message
 */
export const getPaymentStatusMessage = (isAvailable) => {
  return isAvailable 
    ? 'Choose your preferred payment method to complete the booking:' 
    : 'Payment options will be available once your booking is selected by the host.';
};

/**
 * Check if user can see contact information
 */
export const canViewContactInfo = (userType) => {
  return userType === 'agent';
};

/**
 * Check if user can see support contact
 */
export const canViewSupportContact = (userType) => {
  return userType === 'client' || userType === 'host';
};

/**
 * Check if user can see payment section
 */
export const canViewPaymentSection = (userType) => {
  return userType === 'client';
};

/**
 * Check if user can see payment status for host/agent
 */
export const canViewPaymentStatus = (userType) => {
  return userType === 'host' || userType === 'agent';
};

/**
 * Check if user can see actions section
 */
export const canViewActionsSection = (actionButtons) => {
  return actionButtons && actionButtons.length > 0;
};

/**
 * Get property details for display
 */
export const getPropertyDetails = (place) => {
  if (!place) return null;

  return {
    id: place.id,
    title: place.title,
    address: place.address,
    checkIn: place.checkIn,
    checkOut: place.checkOut,
    description: place.description,
    photos: place.photos
  };
};

/**
 * Calculate total price including fees
 */
export const calculateTotalPrice = (booking) => {
  let total = booking.totalPrice || 0;
  
  if (booking.serviceFee) {
    total += booking.serviceFee;
  }
  
  if (booking.protectionPlanSelected && booking.protectionPlanFee) {
    total += booking.protectionPlanFee;
  }
  
  return booking.finalTotal || total;
};

/**
 * Get payment section visibility
 */
export const shouldShowPaymentSection = (user) => {
  return user?.userType === 'client';
};

/**
 * Get payment status visibility for hosts/agents
 */
export const shouldShowPaymentStatus = (user, booking) => {
  const canView = user?.userType === 'host' || user?.userType === 'agent';
  const hasStatus = booking.status === 'approved' || booking.status === 'selected';
  return canView && hasStatus;
};

/**
 * Get refund policy display data
 */
export const getRefundPolicyData = (place) => {
  return {
    refundOptions: place?.refundOptions || [],
    hasRefundOptions: place?.refundOptions && place.refundOptions.length > 0
  };
};

/**
 * Get loading state component props
 */
export const getLoadingProps = () => ({
  showAccountNav: true,
  message: "Loading booking details...",
  className: "flex items-center justify-center py-20"
});

/**
 * Get not found state component props
 */
export const getNotFoundProps = () => ({
  showAccountNav: true,
  message: "Booking not found",
  linkText: "Back to Bookings",
  linkTo: "/account/bookings",
  className: "text-center py-20"
});

/**
 * Get page header props
 */
export const getPageHeaderProps = (booking) => ({
  title: "Booking Details",
  requestId: booking.uniqueRequestId || `REQ-${booking.id}`,
  backLink: "/account/bookings"
});

/**
 * Get modal configuration for confirmation
 */
export const getModalConfiguration = (modalConfig, isUpdating) => ({
  title: modalConfig.title,
  message: modalConfig.requiresPaymentCheck && modalConfig.paymentMessage ? 
    modalConfig.paymentMessage : 
    modalConfig.message,
  confirmText: modalConfig.agentApproval ? "Approve" : (modalConfig.requiresPaymentCheck ? "Approve Anyway" : "Confirm"),
  cancelText: "Cancel",
  confirmButtonClass: modalConfig.status === "approved" || modalConfig.status === "selected"
    ? "bg-green-600 hover:bg-green-700" 
    : "bg-red-600 hover:bg-red-700",
  isLoading: isUpdating,
  showPaymentOptions: modalConfig.requiresPaymentCheck && !modalConfig.agentApproval
});

/**
 * Get support contact hours display
 */
export const getSupportContactHours = () => {
  return "Mon-Fri: 9 AM - 6 PM, Sat: 10 AM - 4 PM";
};

/**
 * Generate payment confirmation modal config
 */
export const getPaymentConfirmationConfig = (requiresPaymentCheck, agentApproval, paymentMessage, message) => {
  if (requiresPaymentCheck && paymentMessage) {
    return paymentMessage;
  }
  return message;
};

/**
 * Get modal confirm button text
 */
export const getModalConfirmText = (agentApproval, requiresPaymentCheck) => {
  if (agentApproval) return "Approve";
  if (requiresPaymentCheck) return "Approve Anyway";
  return "Confirm";
};

/**
 * Get modal confirm button class
 */
export const getModalConfirmButtonClass = (status) => {
  return status === "approved" || status === "selected"
    ? "bg-green-600 hover:bg-green-700" 
    : "bg-red-600 hover:bg-red-700";
};

/**
 * Get sidebar sections configuration
 */
export const getSidebarSections = (booking, user, actionButtons) => {
  const sections = [];
  
  // Always show pricing
  sections.push({
    type: 'pricing',
    component: 'PricingSection',
    props: { booking, user }
  });
  
  // Show payment section for clients
  if (shouldShowPaymentSection(user)) {
    sections.push({
      type: 'payment',
      component: 'PaymentSection',
      props: { booking, user }
    });
  }
  
  // Show actions if available
  if (canViewActionsSection(actionButtons)) {
    sections.push({
      type: 'actions',
      component: 'ActionButtonsSection',
      props: { actionButtons, booking, user }
    });
  }
  
  return sections;
};

/**
 * Get main content sections configuration
 */
export const getMainContentSections = (booking, user) => {
  const sections = [];
  
  // Always show property details
  sections.push({
    type: 'property',
    component: 'PropertyDetailsSection',
    props: { place: booking.place }
  });
  
  // Always show booking information
  sections.push({
    type: 'booking-info',
    component: 'BookingInformationSection',
    props: { booking }
  });
  
  // Always show contact information
  sections.push({
    type: 'contact',
    component: 'ContactInformationSection',
    props: { booking, user }
  });
  
  // Always show refund policy
  sections.push({
    type: 'refund-policy',
    component: 'RefundPolicySection',
    props: { refundOptions: booking.place?.refundOptions }
  });
  
  return sections;
};

// Update the default export
export default {
  formatRefundOption,
  getContactDisplayInfo,
  getBookingInfoCards,
  getActionButtonClasses,
  getPaymentProviders,
  getPaymentStatusMessage,
  canViewContactInfo,
  canViewSupportContact,
  canViewPaymentSection,
  canViewPaymentStatus,
  getSupportContactHours,
  getPaymentConfirmationConfig,
  getModalConfirmText,
  getModalConfirmButtonClass,
  canViewActionsSection,
  getPropertyDetails,
  calculateTotalPrice,
  shouldShowPaymentSection,
  shouldShowPaymentStatus,
  getRefundPolicyData,
  getLoadingProps,
  getNotFoundProps,
  getPageHeaderProps,
  getModalConfiguration,
  getSidebarSections,
  getMainContentSections
};
