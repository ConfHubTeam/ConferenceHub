import api from "../utils/api";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BookingWidget from "../components/BookingWidget";
import PhotoGallery from "../components/PhotoGallery";
import BookingCard from "../components/BookingCard";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import PlaceStaticMap from "../components/PlaceStaticMap";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import PlaceDetailsInfo from "../components/PlaceDetailsInfo";
import WeeklyAvailabilityDisplay from "../components/WeeklyAvailabilityDisplay";
import PlaceAvailabilityCalendar from "../components/PlaceAvailabilityCalendar";
import PlacePerks from "../components/PlacePerks";
import RefundPolicyDisplay from "../components/RefundPolicyDisplay";
import PlaceReviews from "../components/PlaceReviews";
import { parseISO, isValid } from "date-fns";

export default function PlaceDetailPage() {
  const { t } = useTranslation('places');
  const { placeId, bookingId } = useParams();
  const location = useLocation();
  const [placeDetail, setPlaceDetail] = useState();
  const [bookingDetail, setBookingDetail] = useState();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [selectedCalendarDates, setSelectedCalendarDates] = useState([]); // Shared state for calendar selections
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();

  // Function to clear calendar selections
  const clearCalendarSelections = () => {
    setSelectedCalendarDates([]);
  };

  // Helper function to parse date/time from URL parameters and pre-populate booking selection
  // Follows DRY principle by reusing existing date/time parsing logic
  const parseUrlFiltersAndPrePopulate = () => {
    const urlParams = new URLSearchParams(location.search);
    const dates = urlParams.get('dates');
    const startTime = urlParams.get('startTime');
    const endTime = urlParams.get('endTime');

    // If we have filter parameters, pre-populate the calendar selection
    if (dates || startTime || endTime) {
      const preSelectedDates = [];

      // Parse dates if available
      if (dates) {
        try {
          const dateStrings = dates.split(',');
          dateStrings.forEach(dateStr => {
            const parsedDate = parseISO(dateStr.trim());
            if (isValid(parsedDate)) {
              // Create date slot object compatible with PlaceAvailabilityCalendar
              const dateSlot = {
                date: dateStr.trim(),
                startTime: startTime || "09:00", // Default to 9 AM if not specified
                endTime: endTime || "17:00"     // Default to 5 PM if not specified
              };
              preSelectedDates.push(dateSlot);
            }
          });
        } catch (error) {
          console.warn("Error parsing dates from URL:", error);
        }
      }

      // If we successfully parsed dates, set them
      if (preSelectedDates.length > 0) {
        setSelectedCalendarDates(preSelectedDates);
        // Notify user that dates were pre-selected from filter
        notify(t('placeDetail.filterDatesPreSelected'), "info");
      }
    }
  };

  useEffect(() => {
    if (!placeId) {
      return;
    }
    api.get("/places/" + placeId).then((response) => {
      setPlaceDetail(response.data);
    });

    if (placeId && bookingId) {
      api.get("/places/" + placeId + "/" + bookingId).then((response) => {
        setBookingDetail(response.data);
      });
      setButtonDisabled(true);
    }

    // Pre-populate booking selection from URL filter parameters
    // This enables the feature where filtered date/time is pre-selected in booking modal
    parseUrlFiltersAndPrePopulate();
  }, [placeId, bookingId, location.search]); // Add location.search to dependency array to react to URL changes

  // Restore booking selections from sessionStorage after login redirect
  useEffect(() => {
    const storedBookingData = sessionStorage.getItem("bookingSelections");
    if (storedBookingData && user) {
      try {
        const bookingData = JSON.parse(storedBookingData);
        // Check if this is the same place
        if (bookingData.placeId === placeId) {
          // Restore all booking data
          setSelectedCalendarDates(bookingData.selectedCalendarDates || []);
          
          // If we have guest information, pre-populate it to the booking widget
          if (bookingData.guestName) {
            // We don't need to set it here directly as the BookingWidget component
            // has its own state, but we can keep the data available for it
          }
          
          // Notify the user that their booking selections were restored
          notify(t('placeDetail.bookingRestored'), "info");
          
          // Clear the stored data after restoring
          sessionStorage.removeItem("bookingSelections");
        }
      } catch (error) {
        console.error("Error restoring booking selections:", error);
        // Clear invalid data
        sessionStorage.removeItem("bookingSelections");
      }
    }
  }, [user, placeId, notify]); // Run when user login state changes or placeId changes

  // Show delete confirmation modal
  function handleDeleteClick() {
    setShowDeleteModal(true);
    setError("");
  }

  // Delete conference room function
  async function handleDelete() {
    setIsDeleting(true);
    setDeleteInProgress(true);
    setError("");
    
    try {
      await api.delete(`/places/${placeId}`);
      notify(t('placeDetail.deleteSuccess'), 'success');
      setShowDeleteModal(false);
      navigate('/account/user-places'); // Redirect to my conference rooms page
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      notify(`${t('common.error')}: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteInProgress(false);
    }
  }

  if (!placeDetail) return "";

  // Check if current user is the owner of this conference room or an agent
  const isOwner = user && placeDetail.ownerId === user.id;
  const canManage = user && (placeDetail.ownerId === user.id || user.userType === 'agent');

  // Prepare place for map view (as an array with just this one place)
  const mapPlaces = placeDetail.lat && placeDetail.lng ? [placeDetail] : [];
  const hasCoordinates = placeDetail.lat && placeDetail.lng;

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="spacing-container w-full">
        {/* Header Section */}
        <div className="pt-6 pb-6">
          <h1 className="text-heading-1 mb-3 text-text-primary">{placeDetail.title}</h1>
          <a
            className="flex gap-2 font-medium underline items-center text-body text-accent-primary hover:text-accent-hover transition-colors"
            target="_blank"
            href={placeDetail.lat && placeDetail.lng 
              ? `http://maps.google.com/?q=${placeDetail.lat},${placeDetail.lng}`
              : `http://maps.google.com/?q=${encodeURIComponent(placeDetail.address)}`}
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            {placeDetail.address}
          </a>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg spacing-card mb-6">
            <p className="text-error-700 text-body">{error}</p>
          </div>
        )}

        {/* Booking card for existing bookings */}
        <BookingCard bookingDetail={bookingDetail} competingBookings={[]}/>

        {/* Main content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Photos and content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <div className="card-base overflow-hidden">
              <PhotoGallery placeDetail={placeDetail} />
            </div>
            
            {/* Place Details Info Section */}
            <div className="card-base">
              <div className="card-content">
                <PlaceDetailsInfo placeDetail={placeDetail} />
              </div>
            </div>

            {/* Description Section */}
            {placeDetail.description && (
              <div className="card-base">
                <div className="card-content">
                  <h2 className="text-heading-2 mb-4 text-text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-accent-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B10.5 1.125 1.875 2.75 1.875 6.125v2.25" />
                    </svg>
                    {t('placeDetail.sections.description')}
                  </h2>
                  <p className="text-body text-text-secondary leading-relaxed">{placeDetail.description}</p>
                </div>
              </div>
            )}

            {/* Availability Calendar Section - MOVED BEFORE PERKS */}
            <PlaceAvailabilityCalendar 
              placeDetail={placeDetail} 
              onSelectedDatesChange={setSelectedCalendarDates}
              selectedCalendarDates={selectedCalendarDates}
            />

            {/* Perks Section - NOW AFTER AVAILABILITY */}
            {placeDetail.perks && placeDetail.perks.length > 0 && (
              <div className="card-base">
                <div className="card-content">
                  <PlacePerks perks={placeDetail.perks} />
                </div>
              </div>
            )}

            {/* Weekly Availability Section */}
            <WeeklyAvailabilityDisplay 
              weekdayTimeSlots={placeDetail.weekdayTimeSlots}
              blockedWeekdays={placeDetail.blockedWeekdays}
            />
            
            {/* Location Map */}
            {hasCoordinates && (
              <div className="h-64 border-4 border-white rounded-lg shadow-ui bg-white">
                <PlaceStaticMap place={placeDetail} />
              </div>
            )}
            
            {/* Extra Information Section */}
            {placeDetail.extraInfo && (
              <div className="card-base">
                <div className="card-content">
                  <h2 className="text-heading-2 mb-4 text-text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-accent-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    {t('placeDetail.sections.additionalInfo')}
                  </h2>
                  <p className="text-body text-text-secondary leading-relaxed">{placeDetail.extraInfo}</p>
                </div>
              </div>
            )}

            {/* Refund Policy Section - Only for owners and agents */}
            {canManage && (
              <RefundPolicyDisplay placeDetail={placeDetail} />
            )}

            {/* Reviews Section - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <PlaceReviews 
                placeId={placeDetail.id} 
                placeOwnerId={placeDetail.ownerId} 
              />
            </div>
          </div>

          {/* Right side - Booking widget or management options */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Show booking widget only for clients or if viewing a booking */}
              {(!user || user.userType === 'client' || bookingId) && (
                <BookingWidget
                  placeDetail={placeDetail}
                  buttonDisabled={buttonDisabled || canManage}
                  selectedCalendarDates={selectedCalendarDates}
                  onClearCalendarSelections={clearCalendarSelections}
                />
              )}
              
              {/* Show management options for hosts who own this conference room or agents */}
              {user && canManage && !bookingId && (
                <div className="bg-white rounded-lg p-6 shadow-ui border border-border-light">
                  <h2 className="text-heading-3 mb-4 text-text-primary">{t('placeDetail.managementOptions.title')}</h2>
                  <div className="space-y-3">
                    <a 
                      href={`/account/places/${placeId}`} 
                      className="btn-primary btn-size-md w-full"
                    >
                      {t('placeDetail.managementOptions.edit')}
                    </a>
                    <button 
                      className="w-full px-4 py-2 bg-error-100 text-error-700 border border-error-200 rounded-lg font-medium hover:bg-error-200 hover:text-error-800 transition-colors disabled:opacity-50"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                    >
                      {isDeleting ? t('placeDetail.managementOptions.deleting') : t('placeDetail.managementOptions.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section - Shown on mobile after main content, hidden on desktop */}
        <div className="block lg:hidden mt-8">
          <PlaceReviews 
            placeId={placeDetail.id} 
            placeOwnerId={placeDetail.ownerId} 
          />
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDelete}
          title={t('placeDetail.deleteModal.title')}
          itemToDelete={placeDetail}
          itemDetails={[
            { label: t('placeDetail.deleteModal.titleLabel'), value: placeDetail?.title },
            { label: t('placeDetail.deleteModal.locationLabel'), value: placeDetail?.address },
            { label: t('placeDetail.deleteModal.priceLabel'), value: `$${placeDetail?.price} / ${t('placeDetail.deleteModal.hour')}` }
          ]}
          consequences={[
            t('placeDetail.deleteModal.consequences.roomDetails'),
            t('placeDetail.deleteModal.consequences.photos'),
            t('placeDetail.deleteModal.consequences.bookings'),
            t('placeDetail.deleteModal.consequences.reviews')
          ]}
          deleteInProgress={deleteInProgress}
        />
      </div>
    </div>
  );
}
