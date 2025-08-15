import { useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useTranslation } from "react-i18next";
import PlaceSelector from "../components/PlaceSelector";
import CalendarPageCalendar from "../components/CalendarPageCalendar";

/**
 * CalendarPage Component
 * Calendar management interface for hosts and agents
 * Hosts can view their own places, agents can view all places
 */
export default function CalendarPage() {
  const { t } = useTranslation(["navigation", "common", "places"]);
  const { user, isReady } = useContext(UserContext);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Load selected place from localStorage on mount
  useEffect(() => {
    if (user && isReady) {
      const savedPlaceId = localStorage.getItem(`calendar_selected_place_${user.id}`);
      if (savedPlaceId) {
        // Fetch the place details by ID to restore the full place object
        fetch(`/api/places/${savedPlaceId}`)
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Place not found');
          })
          .then(place => {
            // Verify the user has access to this place
            if (user.userType === 'host' && place.ownerId !== user.id) {
              // Host trying to access place they don't own
              console.warn('Host attempted to access place they do not own');
              localStorage.removeItem(`calendar_selected_place_${user.id}`);
              return;
            }
            
            // If user is an agent, they can access any place
            // If user is a host, they can only access their own places (checked above)
            setSelectedPlace(place);
          })
          .catch(error => {
            console.warn('Failed to restore selected place:', error);
            // Clear invalid place ID from localStorage
            localStorage.removeItem(`calendar_selected_place_${user.id}`);
          });
      }
    }
  }, [user, isReady]);

  // Save selected place to localStorage whenever it changes
  useEffect(() => {
    if (user && selectedPlace) {
      localStorage.setItem(`calendar_selected_place_${user.id}`, selectedPlace.id.toString());
    } else if (user && selectedPlace === null) {
      localStorage.removeItem(`calendar_selected_place_${user.id}`);
    }
  }, [user, selectedPlace]);

  // Show loading while authentication state is being determined
  if (!isReady) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
          </div>
          <p className="text-gray-600">{t("common.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (after auth state is ready)
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Only allow hosts and agents to access calendar
  if (user.userType !== 'host' && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* On desktop, render PlaceSelector inside the left calendar column via leftTopSlot.
            On small screens, keep it above content for usability. */}
        <div className="mb-4 sm:mb-6 lg:mb-0 lg:hidden">
          <div className="w-full max-w-md">
            <div className="sm:hidden mb-2">
              <span className="text-sm font-medium text-gray-700">
                {t("calendar.selectPlace", "Select a place")}
              </span>
            </div>
            <PlaceSelector 
              selectedPlace={selectedPlace}
              onPlaceSelect={handlePlaceSelect}
              compact={false}
            />
          </div>
        </div>

        {/* Main Content Area - Full width */}
        <div className="w-full">
          {selectedPlace ? (
            <div className="w-full">
              {/* Calendar Page Calendar - Tailored for calendar management */}
              <CalendarPageCalendar 
                placeDetail={selectedPlace}
                leftTopSlot={
                  // Only show the selector inside the left column on lg+ screens
                  (
                    <div className="hidden lg:block">
                      <div className="mb-2 text-sm font-medium text-gray-700">
                        {t("calendar.selectPlace", "Select a place")}
                      </div>
                      <PlaceSelector 
                        selectedPlace={selectedPlace}
                        onPlaceSelect={handlePlaceSelect}
                        compact={true}
                      />
                    </div>
                  )
                }
                onDateSelect={(dateStr) => {
                  // Optional: Handle date selection for future features
                  console.log("Selected date:", dateStr);
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 21V9.75m0 0V6.75a.75.75 0 01.75-.75h3.75M6.75 9.75V21m-2.25 0h5.25m13.5-18v18m-2.25 0H21m-3.75 0V6.75a.75.75 0 00-.75-.75h-3.75M21 21V9.75m0 0V6.75a.75.75 0 00-.75-.75h-3.75M6.75 6.75V9.75m13.5 0V6.75" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  {t("calendar.selectPlaceToStart", "Select a place to get started")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("calendar.chooseFromDropdown", "Choose a place from the dropdown above to view its calendar and manage availability.")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
