import { Link, Navigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
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
      <div className="bg-bg-primary min-h-screen">
        <div className="spacing-container spacing-section">
          <div className="animate-pulse space-y-4">
            <div className="card-base">
              <div className="h-16 bg-bg-secondary rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-base">
                  <div className="h-80 bg-bg-secondary rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="spacing-container w-full">
        
        {/* Page header with search and Add Place button in same row */}
        <div className="card-base mb-6">
          <div className="card-content p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Search input */}
              <div className="flex-1">
                <input
                  id="search"
                  type="text"
                  placeholder={t('placesPage.searchPlaceholder', 'Search by property name or address...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base text-primary h-10"
                />
              </div>
              
              {/* Add new room button */}
              {user && user.userType === 'host' && (
                <div className="flex-shrink-0">
                  <Link
                    className="btn-primary h-10 px-6 rounded-xl inline-flex items-center gap-2"
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Places listing */}
        {filteredPlaces.length === 0 ? (
          <div className="card-base text-center">
            <div className="card-content">
              <div className="w-16 h-16 mx-auto mb-4 text-text-muted">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                </svg>
              </div>
              <h3 className="text-heading-3 mb-2 text-text-primary">
                {searchTerm ? t('placesPage.noRoomsFound', 'No rooms found') : t('placesPage.noRoomsYet', 'No conference rooms yet')}
              </h3>
              <p className="text-body text-text-secondary mb-4">
                {searchTerm 
                  ? t('placesPage.tryAdjustingSearch', 'Try adjusting your search criteria.')
                  : t('placesPage.getStartedMessage', 'Get started by adding your first conference room listing.')
                }
              </p>
              {searchTerm ? (
                <button
                  onClick={clearAllFilters}
                  className="btn-outline"
                >
                  {t('placesPage.clearSearch', 'Clear Search')}
                </button>
              ) : (
                <Link
                  to="/account/places/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {t('placesPage.addFirstRoom', 'Add Your First Room')}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-2 text-text-primary">
                {t('placesPage.yourRooms', 'Your Conference Rooms')}
                <span className="ml-2 text-body text-text-secondary">({filteredPlaces.length})</span>
              </h2>
              
              {searchTerm && (
                <div className="text-caption text-text-secondary">
                  {t('placesPage.showingResults', 'Showing results for "{{searchTerm}}"', { searchTerm })}
                </div>
              )}
            </div>

            {/* Places grid using PlaceCard component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                  totalItems={filteredPlaces.length}
                  itemName="rooms"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
