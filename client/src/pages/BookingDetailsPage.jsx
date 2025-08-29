import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import useSmartPaymentPolling from "../hooks/useSmartPaymentPolling";
import PriceDisplay from "../components/PriceDisplay";
import CloudinaryImage from "../components/CloudinaryImage";
import ConfirmationModal from "../components/ConfirmationModal";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingProgress from "../components/BookingProgress";
import PaymentResponseDisplay from "../components/PaymentResponseDisplay";
import ClickPaymentButton from "../components/ClickPaymentButton";
import PaymentMethodsSection from "../components/PaymentMethodsSection";
import { 
  SectionCard, 
  InfoCard, 
  ContactInfoCard, 
  EnhancedContactInfoCard,
  StatusIndicator, 
  TimeSlotCard, 
  FullDayBookingCard, 
  PaymentButton,
  PricingSection,
  PaymentStatusIndicator,
  PaymentSection,
  RefundPolicySection,
  PropertyDetailsSection,
  SupportContactSection,
  ActionButtonsSection,
  getIconComponent
} from "../components/BookingDetailsComponents";
import {
  getBookingInfoCards,
  getActionButtonClasses,
  canViewContactInfo,
  canViewSupportContact,
  getSupportContactHours,
  formatRefundOption,
  getContactDisplayInfo,
  getLatestContactInfo,
  shouldShowUpdatedIndicator,
  shouldShowPaymentSection,
  getModalConfiguration
} from "../utils/bookingDetailsHelpers";
import api from "../utils/api";
import { format } from "date-fns";
import { 
  getBookingActionButtons, 
  getStatusBadgeClass, 
  getBookingStatusMessage,
  requiresPaymentBeforeApproval,
  canPerformBookingAction
} from "../utils/bookingUtils";

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('booking');
  
  const [booking, setBooking] = useState(null);
  const [competingBookings, setCompetingBookings] = useState([]);
  const [agentContact, setAgentContact] = useState(null);
  const [latestContactInfo, setLatestContactInfo] = useState({
    client: null,
    host: null
  });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Smart payment polling hook - runs silently in background with auto-restart
  const { startPolling, restartPolling, isPolling, hasBeenStopped } = useSmartPaymentPolling(
    bookingId,
    // onPaymentSuccess - handles both Click.uz payments and manual agent approvals
    (paymentData) => {
      if (paymentData.booking) {
        setBooking(paymentData.booking);
      }
      
      if (paymentData.manuallyApproved) {
        notify("Booking approved by agent.", "success");
      } else {
        notify("Payment successful! Booking approved.", "success");
      }
    },
    // onPaymentError
    (errorMessage) => {
      // Silently log errors, don't show to user unless critical
      console.warn(`Payment verification error: ${errorMessage}`);
      
      // Only show user-facing notification for critical errors
      if (errorMessage.includes('timeout')) {
        console.log('💡 Payment verification timeout - polling will auto-restart on page interaction');
      }
    },
    // Options for enhanced restart behavior
    {
      // Disable auto restarts; polling must be explicitly started by Click flow
      autoRestart: false,
      enablePageVisibilityRestart: false,
      restartStatuses: ['selected']
    }
  );

  /**
   * Handles return from Click payment page
   */
  const handlePaymentReturn = async (paymentStatus, transactionId, error) => {
    try {
      if (error) {
        notify(t('notifications.paymentFailed', { error }), "error");
        return;
      }

      if (paymentStatus === 'success' || transactionId) {
        notify(t('notifications.paymentCompleted'), "success");
        
  // Do not auto-start polling here; it will be started only from Click flow
  const { data } = await api.get(`/bookings/${bookingId}`);
  setBooking(data);
  notify(t('notifications.statusUpdated'), "success");
      } else if (paymentStatus === 'failed') {
        notify(t('notifications.paymentNotCompleted'), "warning");
      } else if (paymentStatus === 'cancelled') {
        notify(t('notifications.paymentCancelled'), "info");
      }
    } catch (error) {
      console.error('Error handling payment return:', error);
      notify(t('notifications.errorUpdatingStatus'), "error");
    }
  };

  /**
   * Refresh booking status and details
   */
  const refreshBooking = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);
      
      // Refresh competing bookings if needed
      if ((user?.userType === 'host' || user?.userType === 'agent') && 
          (data.status === 'pending' || data.status === 'selected') && 
          data.timeSlots?.length > 0) {
        try {
          const response = await api.get('/bookings/competing', {
            params: {
              placeId: data.placeId,
              timeSlots: JSON.stringify(data.timeSlots)
            }
          });
          const competitors = response.data.filter(b => b.id !== data.id);
          setCompetingBookings(competitors);
        } catch (error) {
          console.error('Error refreshing competing bookings:', error);
        }
      }
      
      notify(t('notifications.statusUpdated'), "success");
      
      // Start polling if booking is selected and payment is available
      if (data.status === 'selected' && isPaymentAvailable()) {
        startPolling();
      }
    } catch (error) {
      console.error('Error refreshing booking:', error);
      notify(t('notifications.errorLoadingDetails'), "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check for payment return parameters (Click/Payme legacy and Octo)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status');
    const transactionId = searchParams.get('transaction_id');
    const provider = searchParams.get('provider');
    const returnedBookingId = searchParams.get('booking_id');
    const error = searchParams.get('error');

    if (paymentStatus || transactionId || error) {
      // Handle payment completion return
      handlePaymentReturn(paymentStatus, transactionId, error);
      
      // Clean up URL parameters
      setSearchParams({});
  } else if (provider === 'octo' && (!error)) {
      // Octo redirect: run a one-shot smart check and refresh booking
      (async () => {
        try {
          // Only proceed if this redirect matches the current booking
          if (!returnedBookingId || String(returnedBookingId) === String(bookingId)) {
            const { data } = await api.post(`/bookings/${bookingId}/check-payment-smart`);
            if (data?.success && data?.isPaid && data?.booking) {
              setBooking(data.booking);
              notify(t('notifications.paymentCompleted'), 'success');
            } else {
              // No polling for Octo; rely on webhook + manual refresh
              const cur = await api.get(`/bookings/${bookingId}`);
              setBooking(cur.data);
            }
          }
        } catch (e) {
          console.warn('Octo return check failed:', e);
        } finally {
          // Clean up the provider params from URL
          setSearchParams({});
        }
      })();
    }
  }, [searchParams, setSearchParams, bookingId, notify, startPolling, t]);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data);
        
        // Fetch competing bookings only for hosts and agents
        if ((user?.userType === 'host' || user?.userType === 'agent') && 
            (data.status === 'pending' || data.status === 'selected') && 
            data.timeSlots?.length > 0) {
          await fetchCompetingBookings(data);
        }

        // Fetch agent contact information for admin contact section
        if (user?.userType === 'client' || user?.userType === 'host') {
          await fetchAgentContact();
        }

        // Fetch latest contact information for users involved in booking
        if (user?.userType === 'agent') {
          await fetchLatestContactInfo(data);
        }
      } catch (error) {
        notify(t('notifications.errorLoadingDetails'), "error");
        navigate("/account/bookings");
      } finally {
        setLoading(false);
      }
    };

    const fetchCompetingBookings = async (bookingData) => {
      try {
        const response = await api.get('/bookings/competing', {
          params: {
            placeId: bookingData.placeId,
            timeSlots: JSON.stringify(bookingData.timeSlots)
          }
        });
        // Exclude the current booking from competitors
        const competitors = response.data.filter(b => b.id !== bookingData.id);
        setCompetingBookings(competitors);
      } catch (error) {
        console.error('Error loading competing bookings:', error);
        // Don't show error to user as this is not critical
      }
    };

    const fetchAgentContact = async () => {
      try {
        // For clients and hosts, get admin contact information using dedicated endpoint
        const response = await api.get('/users/admin/contact');
        
        if (response.data) {
          setAgentContact({
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber
          });
        }
      } catch (error) {
        console.error('Error loading admin contact:', error);
      }
    };

    const fetchLatestContactInfo = async (bookingData) => {
      try {
        // Use contact info already included in booking response
        const contactInfo = { client: null, host: null };
        
        // Set client contact info from booking user data
        if (bookingData.user) {
          contactInfo.client = {
            name: bookingData.user.name,
            email: bookingData.user.email,
            phoneNumber: bookingData.user.phoneNumber
          };
        }
        
        // Set host contact info from booking place owner data
        if (bookingData.place?.owner) {
          contactInfo.host = {
            name: bookingData.place.owner.name,
            email: bookingData.place.owner.email,
            phoneNumber: bookingData.place.owner.phoneNumber
          };
        }
        
        setLatestContactInfo(contactInfo);
      } catch (error) {
        console.error('Error processing contact info:', error);
        // Fallback to booking's stored contact info if processing fails
      }
    };

    if (bookingId && user) {
      fetchBookingDetails();
    }
  }, [bookingId, navigate, notify, user]);

  // Handle status update
  const handleStatusUpdate = async (newStatus, paymentConfirmed = false) => {
    setIsUpdating(true);
    try {
      const requestBody = { status: newStatus };
      
      // Include payment confirmation for selected bookings being approved
      if (newStatus === "approved" && booking.status === "selected") {
        requestBody.paymentConfirmed = paymentConfirmed;
      }
      
      // Handle agent approval - bypass payment check and mark as agent action
      if (modalConfig.agentApproval && newStatus === "approved") {
        requestBody.agentApproval = true;
        requestBody.paymentConfirmed = true; // Agents can approve without payment confirmation
      }
      
      const { data } = await api.put(`/bookings/${bookingId}`, requestBody);
      
      if (data.deleted) {
        notify(t('notifications.cancelledSuccessfully'), "success");
        navigate("/account/bookings");
      } else {
        setBooking(data.booking);
        
        // Refresh competing bookings after status change (only for hosts and agents)
        if ((user?.userType === 'host' || user?.userType === 'agent') &&
            (data.booking.status === 'pending' || data.booking.status === 'selected') && 
            data.booking.timeSlots?.length > 0) {
          try {
            const response = await api.get('/bookings/competing', {
              params: {
                placeId: data.booking.placeId,
                timeSlots: JSON.stringify(data.booking.timeSlots)
              }
            });
            const competitors = response.data.filter(b => b.id !== data.booking.id);
            setCompetingBookings(competitors);
          } catch (error) {
            console.error('Error refreshing competing bookings:', error);
          }
        } else {
          setCompetingBookings([]); // Clear competing bookings for non-pending/selected statuses or clients
        }
        
        notify(data.message || t('notifications.statusUpdatedSuccess', { status: newStatus }), "success");
      }
      setShowModal(false);
    } catch (error) {
      // Handle payment confirmation requirement
      if (error.response?.data?.requiresPaymentCheck) {
        setModalConfig(prev => ({
          ...prev,
          requiresPaymentCheck: true,
          paymentMessage: error.response.data.message
        }));
        return; // Don't close modal, show payment confirmation
      }
      
      notify(`Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle paid to host action
  const handlePaidToHost = async () => {
    setIsUpdating(true);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/paid-to-host`);
      
      setBooking(data.booking);
      notify(data.message || t('notifications.paidToHostSuccess'), "success");
      setShowModal(false);
    } catch (error) {
      notify(`Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Show confirmation modal for booking actions
  const showConfirmationModal = (actionButton) => {
    const { label, action, description, requiresPaymentCheck, agentApproval } = actionButton;
    
    // Handle paid to host action differently
    if (action === 'paid_to_host') {
      setModalConfig({
        title: `${label}`,
        message: description || `Are you sure you want to mark payment to host as complete?`,
        status: action,
        action: 'paid_to_host',
        requiresPaymentCheck: false,
        agentApproval: false
      });
    } else {
      setModalConfig({
        title: `${label} Booking`,
        message: description || `Are you sure you want to ${label.toLowerCase()} this booking?`,
        status: action,
        action: label.toLowerCase(),
        requiresPaymentCheck: requiresPaymentCheck || false,
        agentApproval: agentApproval || false
      });
    }
    setShowModal(true);
  };

  // Handle payment confirmation for selected bookings
  const handlePaymentConfirmation = (confirmed) => {
    handleStatusUpdate(modalConfig.status, confirmed);
  };

  // Check if payment is available for the current booking
  const isPaymentAvailable = () => {
    return canPerformBookingAction(user, booking, "pay");
  };

  if (loading) {
    return (
      <div>
        
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        
        <div className="text-center py-20">
          <p className="text-gray-600">{t('details.bookingNotFound')}</p>
          <Link to="/account/bookings" className="text-blue-600 hover:underline mt-4 inline-block">
            {t('details.backToBookings')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="spacing-container w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between pt-6 pb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/account/bookings"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-card border border-border-light hover:border-border-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-heading-1 text-text-primary">{t('details.title')}</h1>
              <p className="text-body text-text-muted font-mono">
                {booking.uniqueRequestId || t('card.requestId', { id: booking.id })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Progress */}
            <BookingProgress booking={booking} userType={user?.userType} />
            
            {/* Place Information */}
            <PropertyDetailsSection place={booking.place} />

            {/* Booking Information */}
            <SectionCard title={t('details.sections.bookingInformation')}>
              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {getBookingInfoCards(booking).map((card, index) => (
                  <InfoCard 
                    key={index}
                    title={card.title}
                    icon={card.icon}
                    value={card.value}
                  />
                ))}
              </div>

              {/* Time Slots Section */}
              <div className="border-t border-border-light pt-6">
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 text-text-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-body-lg font-medium text-text-primary">{t('details.bookingInfo.timeSlots')}</h3>
                </div>
                {booking.timeSlots && booking.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {booking.timeSlots.map((slot, index) => (
                      <TimeSlotCard key={index} slot={slot} index={index} />
                    ))}
                  </div>
                ) : (
                  <FullDayBookingCard />
                )}
              </div>
            </SectionCard>

            {/* Contact Information */}
            <SectionCard title={t('details.sections.contactInformation')}>
              {/* Agent can see both client and host info */}
              {canViewContactInfo(user?.userType) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Info for agents */}
                  {booking.user && (
                    <EnhancedContactInfoCard
                      title={t('details.contactInfo.titles.client')}
                      userType="client"
                      booking={booking}
                      latestContactInfo={latestContactInfo}
                      bgGradient="from-blue-50 to-blue-50"
                      borderColor="border-border-light"
                      iconBgColor="bg-accent-primary/10"
                      iconTextColor="text-accent-primary"
                      titleTextColor="text-text-primary"
                    />
                  )}
                  
                  {/* Host Info for agents */}
                  {booking.place?.owner && (
                    <EnhancedContactInfoCard
                      title={t('details.contactInfo.titles.host')}
                      userType="host"
                      booking={booking}
                      latestContactInfo={latestContactInfo}
                      bgGradient="from-green-50 to-green-50"
                      borderColor="border-border-light"
                      iconBgColor="bg-success-subtle"
                      iconTextColor="text-success-primary"
                      titleTextColor="text-text-primary"
                    />
                  )}
                </div>
              )}
              
              {/* Client and Host see admin contact info instead */}
              {canViewSupportContact(user?.userType) && (
                <SupportContactSection 
                  agentContact={agentContact}
                  getSupportContactHours={getSupportContactHours}
                />
              )}
            </SectionCard>

            {/* Cancellation & Refund Policy */}
            <RefundPolicySection 
              booking={booking}
              formatRefundOption={formatRefundOption}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing */}
              <PricingSection booking={booking} user={user}>
                <PaymentStatusIndicator status={booking.status} userType={user?.userType} booking={booking} />
              </PricingSection>

              {/* Payment Section - Only for clients */}
              {shouldShowPaymentSection(user, booking) && (
                <div className="card-base card-content">
                  <div className="mb-4">
                    <h3 className="text-body-lg font-medium text-text-primary">
                      {t('details.sections.payment', 'Payment')}
                    </h3>
                  </div>
                  
                  {isPaymentAvailable() ? (
                    <div className="space-y-4">
                      {/* Payment Methods with Click, Payme, and Octo */}
                      <PaymentMethodsSection
                        booking={booking}
                        isPaymentAvailable={isPaymentAvailable()}
                        onPaymentInitiated={(paymentData) => {
                          notify(t('notifications.paymentWindowOpened'), "success");
                          // Start polling only for Click and only when booking is selected
                          if (paymentData?.provider === 'click' && booking.status === 'selected') {
                            startPolling();
                          }
                        }}
                        onPaymentError={(error) => {
                          notify(error, "error");
                        }}
                      />
                      
                      {/* Success Message */}
                      <div className="mt-4 p-3 bg-success-subtle border border-success-muted rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-success-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-body-sm">
                            <div className="font-medium text-success-primary mb-1">
                              {t('details.payment.selectedMessage', 'Your booking has been selected! Payment is now available.')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-bg-secondary border border-border-light rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-text-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-body-sm">
                          <div className="font-medium text-text-primary mb-1">
                            {t('details.payment.notAvailableTitle', 'Payment Not Available')}
                          </div>
                          <div className="text-text-muted">
                            {t('details.payment.notAvailableMessage', 'Payment will be available once the host selects your booking.')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Actions */}
            {(() => {
              const { buttons, note } = getBookingActionButtons(booking, user, competingBookings, t);
              return (
                <>
                  {note && (
                    <div className="mb-4 p-3 bg-warning-subtle border border-warning-muted rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-warning-primary mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-body-sm text-warning-primary">{note}</p>
                      </div>
                    </div>
                  )}
                  <ActionButtonsSection 
                    actionButtons={buttons}
                    isUpdating={isUpdating}
                    onActionClick={showConfirmationModal}
                    getActionButtonClasses={getActionButtonClasses}
                    title={t('details.sections.actions')}
                  />
                </>
              );
            })()}

            {/* Show if payment response exists */}
            {booking?.paymentResponse && (
              <PaymentResponseDisplay 
                paymentResponse={booking.paymentResponse}
                bookingId={booking.id}
                booking={booking}
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {(() => {
        const modalProps = getModalConfiguration(modalConfig, isUpdating);
        return (
          <ConfirmationModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onConfirm={() => {
              if (modalConfig.action === 'paid_to_host') {
                handlePaidToHost();
              } else if (modalConfig.requiresPaymentCheck && !modalConfig.agentApproval) {
                // Show payment confirmation options for non-agent approvals
                return;
              } else {
                handleStatusUpdate(modalConfig.status);
              }
            }}
            title={modalProps.title}
            message={modalProps.message}
            confirmText={modalProps.confirmText}
            cancelText={modalProps.cancelText}
            confirmButtonClass={modalProps.confirmButtonClass}
            isLoading={modalProps.isLoading}
          >
            {/* Payment confirmation buttons for selected bookings (not for agent approvals) */}
            {modalProps.showPaymentOptions && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handlePaymentConfirmation(true)}
                  disabled={isUpdating}
                  className="w-full bg-success-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-success-hover disabled:opacity-50 transition-colors"
                >
                  {t('details.actions.confirmations.paymentConfirmed')}
                </button>
                <button
                  onClick={() => handlePaymentConfirmation(false)}
                  disabled={isUpdating}
                  className="w-full bg-warning-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-warning-hover disabled:opacity-50 transition-colors"
                >
                  {t('details.actions.confirmations.approveWithoutPayment')}
                </button>
              </div>
            )}
          </ConfirmationModal>
        );
      })()}
    </div>
  );
}