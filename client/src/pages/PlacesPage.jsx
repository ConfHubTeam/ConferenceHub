import { Link, Navigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import PlaceFilters from "../components/PlaceFilters";
import PlaceCard from "../components/PlaceCard";
import Pagination from "../components/Pagination";

export default function PlacesPage() {
  const { t } = useTranslation('places');
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const { user } = useContext(UserContext);
  
  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    setLoading(true);
    try {
      const { data } = await api.get("/places/user-places");
      setPlaces(data);
      setFilteredPlaces(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading places:", error);
      setLoading(false);
    }
  }

  // Filter places based on search term
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = places.filter(place => 
        place.title.toLowerCase().includes(term) || 
        place.address.toLowerCase().includes(term)
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(places);
    }
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchTerm, places]);

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
  };

  // Get current page items
  function getCurrentPageItems() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPlaces.slice(startIndex, endIndex);
  }

  // Calculate pagination info
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const showingFrom = filteredPlaces.length > 0 
    ? (currentPage - 1) * itemsPerPage + 1 
    : 0;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredPlaces.length);

  if (user && user.userType !== 'host') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div>
        
        <div className="spacing-container spacing-section">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      
      <div className="spacing-container spacing-section max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            
            {/* Add new room button */}
            {user && user.userType === 'host' && (
              <Link
                className="inline-flex items-center gap-2 bg-primary text-white py-2 px-4 sm:py-3 sm:px-6 rounded-full hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                to={"/account/places/new"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                {t('placesPage.addNewRoom', 'Add New Room')}
              </Link>
            )}
          </div>
        </div>

        {/* Filters and controls */}
        <PlaceFilters
          user={user}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClearAllFilters={clearAllFilters}
        />

        {/* Places listing */}
        {filteredPlaces.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg spacing-content text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('placesPage.noRoomsFound', 'No rooms found') : t('placesPage.noRoomsYet', 'No conference rooms yet')}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? t('placesPage.tryAdjustingSearch', 'Try adjusting your search criteria.')
                : t('placesPage.getStartedMessage', 'Get started by adding your first conference room listing.')
              }
            </p>
            {searchTerm ? (
              <button
                onClick={clearAllFilters}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('placesPage.clearSearch', 'Clear Search')}
              </button>
            ) : (
              <Link
                to="/account/places/new"
                className="bg-primary text-white py-2 px-4 sm:py-2.5 sm:px-6 rounded-full hover:bg-primary/90 transition-all duration-200 inline-block font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('placesPage.addFirstRoom', 'Add Your First Room')}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                {t('placesPage.yourRooms', 'Your Conference Rooms')}
                <span className="ml-2 text-sm text-gray-500">({filteredPlaces.length})</span>
              </h2>
              
              {searchTerm && (
                <div className="text-sm text-gray-600">
                  {t('placesPage.showingResults', 'Showing results for "{{searchTerm}}"', { searchTerm })}
                </div>
              )}
            </div>

            {/* Places grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {getCurrentPageItems().map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  showActions={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showingFrom={showingFrom}
                showingTo={showingTo}
                totalItems={filteredPlaces.length}
                itemName="rooms"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
