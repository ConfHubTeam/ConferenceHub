import api from "../utils/api";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BookingWidget from "../components/BookingWidget";
import PhotoGallery from "../components/PhotoGallery";
import BookingCard from "../components/BookingCard";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import MapView from "../components/MapView";
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
    <div className="mx-3 md:mx-8 lg:mx-14 -mt-4">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl mb-2 font-bold">{placeDetail.title}</h1>
        <a
          className="flex gap-1 font-semibold underline items-center text-sm md:text-base"
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
            className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Owner notification */}
      {isOwner && (
        <div className="bg-green-100 p-4 mb-4 rounded-lg">
          <p className="text-green-800 font-semibold text-sm md:text-base">{t('placeDetail.ownerNotification')}</p>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 mb-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Booking card for existing bookings */}
      <BookingCard bookingDetail={bookingDetail} competingBookings={[]}/>

      {/* Main content layout - photos and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left side - Photos and description */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <PhotoGallery placeDetail={placeDetail} />
          </div>
          
          <div className="mt-6">
            {/* Place Details Info Section */}
            <div className="mb-8">
              <PlaceDetailsInfo placeDetail={placeDetail} />
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">{t('placeDetail.sections.description')}</h2>
              <p className="leading-6 md:leading-7 text-sm md:text-base text-gray-700">{placeDetail.description}</p>
            </div>

            {/* Perks Section */}
            {placeDetail.perks && placeDetail.perks.length > 0 && (
              <div className="mb-8">
                <PlacePerks perks={placeDetail.perks} />
              </div>
            )}

            {/* Weekly Availability Section */}
            <div className="mb-8">
              <WeeklyAvailabilityDisplay 
                weekdayTimeSlots={placeDetail.weekdayTimeSlots}
                blockedWeekdays={placeDetail.blockedWeekdays}
              />
            </div>

            {/* Availability Calendar Section */}
            <div className="mb-8">
              <PlaceAvailabilityCalendar 
                placeDetail={placeDetail} 
                onSelectedDatesChange={setSelectedCalendarDates}
                selectedCalendarDates={selectedCalendarDates}
              />
            </div>

            {/* Refund & Cancellation Policy Section */}
            <div className="mb-8">
              <RefundPolicyDisplay placeDetail={placeDetail} />
            </div>
            
            {/* Location Map - Hidden on mobile */}
            {hasCoordinates && (
              <div className="mb-8 hidden md:block">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">{t('placeDetail.sections.location')}</h2>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapView places={mapPlaces} disableInfoWindow={true} />
                </div>
              </div>
            )}
            
            {/* Extra Information Section */}
            {placeDetail.extraInfo && (
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">{t('placeDetail.sections.additionalInfo')}</h2>
                <p className="leading-6 md:leading-7 text-sm md:text-base text-gray-700">{placeDetail.extraInfo}</p>
              </div>
            )}

            {/* Refund Policy Section - Only for owners and agents */}
            {canManage && (
              <div className="mb-8">
                <RefundPolicyDisplay 
                  refundPolicy={placeDetail.refundPolicy}
                  placeId={placeDetail.id}
                  isOwner={isOwner}
                  canManage={canManage}
                />
              </div>
            )}

            {/* Reviews Section - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <PlaceReviews 
                placeId={placeDetail.id} 
                placeOwnerId={placeDetail.ownerId} 
              />
            </div>
          </div>
        </div>

        {/* Right side - Booking widget or management options */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
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
              <div className="bg-white shadow p-4 rounded-2xl">
                <h2 className="text-xl font-semibold mb-4">{t('placeDetail.managementOptions.title')}</h2>
                <div className="flex flex-col gap-2">
                  <a 
                    href={`/account/places/${placeId}`} 
                    className="bg-green-500 py-2 px-5 rounded-2xl text-white text-center"
                  >
                    {t('placeDetail.managementOptions.edit')}
                  </a>
                  <button 
                    className="bg-orange-500 py-2 px-5 rounded-2xl text-white"
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

      {/* Reviews Section - Shown on mobile after price section, hidden on desktop */}
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
  );
}
