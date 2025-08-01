import { format } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import i18n from "../i18n/config";

/**
 * Helper functions for BookingDetailsPage
 */

/**
 * Format refund options for display
 */
export const formatRefundOption = (option) => {
  const t = i18n.getFixedT(null, 'booking');
  
  const optionMap = {
    'flexible_14_day': t('details.refundPolicy.options.flexible14Day', { default: 'Flexible 14-Day: Full refund if canceled 14+ days before check-in' }),
    'moderate_7_day': t('details.refundPolicy.options.moderate7Day', { default: 'Moderate 7-Day: 50% refund if canceled 7+ days before check-in' }),
    'strict': t('details.refundPolicy.options.strict', { default: 'Strict: No refund if canceled less than 6 days before check-in' }),
    'non_refundable': t('details.refundPolicy.options.nonRefundable', { default: 'Non-Refundable: No refunds allowed' }),
    'reschedule_only': t('details.refundPolicy.options.rescheduleOnly', { default: 'Reschedule Only: No refund, but reschedule allowed with 3+ days notice' }),
    'client_protection_plan': t('details.refundPolicy.options.protectionPlan', { default: 'Client Protection Plan: Additional insurance coverage available' })
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
  const t = i18n.getFixedT(null, 'booking');
  const currentLanguage = i18n.language || 'en';
  
  // Get appropriate locale for date formatting
  const getLocale = (lang) => {
    switch (lang) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };
  
  return [
    {
      title: t('details.bookingInfo.guestsCount'),
      icon: "guests",
      value: booking.numOfGuests
    },
    {
      title: t('details.bookingInfo.bookedDate'),
      icon: "calendar",
      value: `${format(new Date(booking.createdAt), "MMM d, yyyy", { locale: getLocale(currentLanguage) })} ${t('card.dateFormatting.at')} ${format(new Date(booking.createdAt), "HH:mm", { locale: getLocale(currentLanguage) })}`
    },
    {
      title: t('details.bookingInfo.requestId'),
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
  // Handle both old array format and new object format
  if (Array.isArray(actionButtons)) {
    return actionButtons.length > 0;
  }
  // New object format with buttons property
  return actionButtons && actionButtons.buttons && actionButtons.buttons.length > 0;
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
 * Get refund policy display data from booking snapshot
 * Filters out protection plan if not selected by client
 */
export const getRefundPolicyData = (booking) => {
  const snapshotOptions = booking?.refundPolicySnapshot || [];
  
  // Filter out protection plan if client didn't select it
  const filteredOptions = snapshotOptions.filter(option => {
    if (option === 'client_protection_plan') {
      return booking.protectionPlanSelected === true;
    }
    return true;
  });
  
  return {
    refundOptions: filteredOptions,
    hasRefundOptions: filteredOptions.length > 0,
    isFromSnapshot: true // Indicates this is from booking time, not current place policy
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
export const getModalConfiguration = (modalConfig, isUpdating) => {
  const t = i18n.getFixedT(null, 'booking');
  
  return {
    title: modalConfig.title,
    message: modalConfig.requiresPaymentCheck && modalConfig.paymentMessage ? 
      modalConfig.paymentMessage : 
      modalConfig.message,
    confirmText: modalConfig.agentApproval ? 
      t('details.actions.buttons.approve') : 
      (modalConfig.requiresPaymentCheck ? 
        t('details.actions.confirmations.approveWithoutPayment') : 
        t('common.buttons.ok')),
    cancelText: t('common.buttons.cancel'),
    confirmButtonClass: modalConfig.status === "approved" || modalConfig.status === "selected"
      ? "bg-green-600 hover:bg-green-700" 
      : "bg-red-600 hover:bg-red-700",
    isLoading: isUpdating,
    showPaymentOptions: modalConfig.requiresPaymentCheck && !modalConfig.agentApproval
  };
};

/**
 * Get support contact hours display
 */
export const getSupportContactHours = () => {
  const t = i18n.getFixedT(null, 'booking');
  return t('details.contactInfo.support.hours', { default: "Mon-Fri: 9 AM - 6 PM, Sat: 10 AM - 4 PM" });
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
  const t = i18n.getFixedT(null, 'booking');
  
  if (agentApproval) return t('details.actions.buttons.approve');
  if (requiresPaymentCheck) return t('details.actions.confirmations.approveWithoutPayment');
  return t('common.buttons.ok');
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
  
  // Always show refund policy from booking snapshot
  sections.push({
    type: 'refund-policy',
    component: 'RefundPolicySection',
    props: { booking } // Pass booking instead of just refundOptions
  });
  
  return sections;
};

/**
 * Get the most up-to-date contact information for a user
 * Falls back to booking's stored contact info if latest info is not available
 */
export const getLatestContactInfo = (userType, booking, latestContactInfo) => {
  const latestInfo = latestContactInfo[userType];
  
  if (latestInfo) {
    // Return latest contact info if available
    return latestInfo;
  }
  
  // Fallback to booking's stored contact info
  if (userType === 'client' && booking.user) {
    return getContactDisplayInfo(booking.user);
  }
  
  if (userType === 'host' && booking.place?.owner) {
    return getContactDisplayInfo(booking.place.owner);
  }
  
  return null;
};

/**
 * Check if we should show updated contact info indicator
 */
export const shouldShowUpdatedIndicator = (userType, booking, latestContactInfo) => {
  const latestInfo = latestContactInfo[userType];
  if (!latestInfo) return false;
  
  let originalInfo = null;
  if (userType === 'client' && booking.user) {
    originalInfo = booking.user;
  } else if (userType === 'host' && booking.place?.owner) {
    originalInfo = booking.place.owner;
  }
  
  if (!originalInfo) return false;
  
  // Check if any contact info has changed
  return (
    latestInfo.name !== originalInfo.name ||
    latestInfo.email !== originalInfo.email ||
    latestInfo.phoneNumber !== originalInfo.phoneNumber
  );
};

/**
 * Check if protection plan should be displayed for this booking
 */
export const shouldShowProtectionPlan = (booking) => {
  return booking.protectionPlanSelected === true;
};

/**
 * Get protection plan display text
 */
export const getProtectionPlanText = (booking) => {
  if (booking.protectionPlanSelected) {
    return `Protection Plan Selected (+${booking.protectionPlanFee || 0} ${booking.place?.currency?.code || 'USD'})`;
  }
  return null;
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
  getMainContentSections,
  getLatestContactInfo,
  shouldShowUpdatedIndicator,
  shouldShowProtectionPlan,
  getProtectionPlanText
};
