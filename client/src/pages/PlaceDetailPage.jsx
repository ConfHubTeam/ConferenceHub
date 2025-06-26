import api from "../utils/api";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function PlaceDetailPage() {
  const { placeId, bookingId } = useParams();
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
  }, [placeId, bookingId]); // refresh the page if the id changes

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
          notify("Your booking selections have been restored. You can now complete your booking.", "info");
          
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
      notify('Conference room deleted successfully', 'success');
      setShowDeleteModal(false);
      navigate('/account/user-places'); // Redirect to my conference rooms page
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      notify(`Error: ${error.response?.data?.error || error.message}`, 'error');
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
          <p className="text-green-800 font-semibold text-sm md:text-base">You are the owner of this conference room</p>
        </div>
      )}

      {/* Agent notification */}
      {user && user.userType === 'agent' && !isOwner && (
        <div className="bg-blue-100 p-4 mb-4 rounded-lg">
          <p className="text-blue-800 font-semibold text-sm md:text-base">Agent Management Access</p>
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
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Description</h2>
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
            
            {/* Location Map */}
            {hasCoordinates && (
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">Location</h2>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapView places={mapPlaces} disableInfoWindow={true} />
                </div>
              </div>
            )}
            
            {/* Extra Information Section */}
            {placeDetail.extraInfo && (
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">Additional Information</h2>
                <p className="leading-6 md:leading-7 text-sm md:text-base text-gray-700">{placeDetail.extraInfo}</p>
              </div>
            )}

            {/* Refund Policy Section - Only for owners and agents */}
            {canManage && (
              <div className="mb-8">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">Refund Policy</h2>
                <RefundPolicyDisplay 
                  refundPolicy={placeDetail.refundPolicy}
                  placeId={placeDetail.id}
                  isOwner={isOwner}
                  canManage={canManage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right side - Booking widget or management options */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
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
                <h2 className="text-xl font-semibold mb-4">Management Options</h2>
                <div className="flex flex-col gap-2">
                  <a 
                    href={`/account/places/${placeId}`} 
                    className="bg-green-500 py-2 px-5 rounded-2xl text-white text-center"
                  >
                    Edit Conference Room
                  </a>
                  <button 
                    className="bg-red-500 py-2 px-5 rounded-2xl text-white"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Conference Room'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        title="Delete Conference Room"
        itemToDelete={placeDetail}
        itemDetails={[
          { label: "Title", value: placeDetail?.title },
          { label: "Location", value: placeDetail?.address },
          { label: "Price", value: `$${placeDetail?.price} / hour` }
        ]}
        consequences={[
          "The conference room and all its details",
          "All photos associated with this conference room",
          "All bookings made for this conference room",
          "All ratings and reviews for this conference room"
        ]}
        deleteInProgress={deleteInProgress}
      />
    </div>
  );
}
