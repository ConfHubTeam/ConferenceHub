import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAttendeesFilter } from "../contexts/AttendeesFilterContext";
import { useSizeFilter } from "../contexts/SizeFilterContext";
import { usePerksFilter } from "../contexts/PerksFilterContext";
import { usePoliciesFilter } from "../contexts/PoliciesFilterContext";
import { convertCurrency } from "../utils/currencyUtils";
import PlaceCard from "../components/PlaceCard";
import PriceDisplay from "../components/PriceDisplay";
import Pagination from "../components/Pagination";
import ActiveFilters, { FilterCreators } from "../components/ActiveFilters";

export default function AllPlacesPage() {
  const { t } = useTranslation('places');
  const { user } = useContext(UserContext);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  
  // Price filter context
  const { minPrice, maxPrice, hasActivePriceFilter, selectedCurrency: priceFilterCurrency } = usePriceFilter();
  
  // Currency context
  const { selectedCurrency } = useCurrency();
  
  // Attendees filter context
  const { filterPlacesByAttendees, hasActiveAttendeesFilter } = useAttendeesFilter();
  
  // Size filter context
  const { filterPlacesBySize, hasActiveSizeFilter } = useSizeFilter();
  
  // Perks filter context
  const { filterPlacesByPerks, hasSelectedPerks } = usePerksFilter();
  
  // Policies filter context
  const { filterPlacesByPolicies, hasSelectedPolicies } = usePoliciesFilter();
  
  // Agent-specific state for user filtering
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Extract userId from query params if present (for agent filtering)
  const params = new URLSearchParams(location.search);
  const userId = params.get('userId');
  const pageParam = params.get('page');

  // Set initial page from URL
  useEffect(() => {
    if (pageParam && !isNaN(pageParam)) {
      setCurrentPage(parseInt(pageParam));
    }
  }, [pageParam]);

  // Load users list for agent filtering
  useEffect(() => {
    if (user?.userType === 'agent') {
      api.get('/users/all')
        .then(({data}) => {
          setAllUsers(data);
        })
        .catch(err => {
          console.error('Error fetching users:', err);
        });
    }
  }, [user]);

  // Set selected user ID from URL params
  useEffect(() => {
    if (userId && user?.userType === 'agent') {
      setSelectedUserId(userId);
    }
  }, [userId, user]);

  // Handle user filter changes
  const handleUserFilterChange = (newUserId) => {
    setSelectedUserId(newUserId);
    setCurrentPage(1); // Reset to first page when filtering
    
    // Update URL to reflect the filter
    const newParams = new URLSearchParams(location.search);
    if (newUserId) {
      newParams.set('userId', newUserId);
    } else {
      newParams.delete('userId');
    }
    newParams.delete('page'); // Reset page when filtering
    
    // Navigate to the new URL
    const newUrl = `${location.pathname}?${newParams.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    
    // Update URL to reflect the page
    const newParams = new URLSearchParams(location.search);
    if (newPage > 1) {
      newParams.set('page', newPage.toString());
    } else {
      newParams.delete('page');
    }
    
    const newUrl = `${location.pathname}?${newParams.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Fetch places from API
  async function loadPlaces() {
    setLoading(true);
    try {
      // Check if user is authenticated and is an agent
      if (!user || user.userType !== 'agent') {
        console.error('User is not an agent:', user);
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (selectedUserId) {
        queryParams.set('userId', selectedUserId);
      }
      
      const endpoint = `/places?${queryParams.toString()}`;
      console.log('Fetching places from:', endpoint);
      const { data } = await api.get(endpoint);
      
      // Handle both old format (direct array) and new format (with pagination)
      if (data.places) {
        // New paginated format
        setPlaces(data.places);
        setFilteredPlaces(data.places);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } else {
        // Old format fallback
        setPlaces(data);
        setFilteredPlaces(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
        setTotalItems(data.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching places:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLoading(false);
    }
  }

  // Load places when dependencies change
  useEffect(() => {
    if (user?.userType === 'agent') {
      loadPlaces();
    }
  }, [user, selectedUserId, currentPage]);

  // Filter places by search term and price range (client-side for current page)
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = [...places];
      
      // Apply search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(place => 
          place.title.toLowerCase().includes(term) || 
          place.address.toLowerCase().includes(term) ||
          (place.owner && place.owner.name.toLowerCase().includes(term))
        );
      }
      
      // Apply attendees filter
      if (hasActiveAttendeesFilter) {
        filtered = filterPlacesByAttendees(filtered);
      }
      
      // Apply size filter
      if (hasActiveSizeFilter) {
        filtered = filterPlacesBySize(filtered);
      }
      
      // Apply perks filter
      if (hasSelectedPerks) {
        filtered = filterPlacesByPerks(filtered);
      }
      
      // Apply policies filter
      if (hasSelectedPolicies) {
        filtered = filterPlacesByPolicies(filtered);
      }
      
      // Apply price filter
      if (hasActivePriceFilter && filtered.length > 0) {
        try {
          // Get the currency to filter in (from price filter context or current currency context)
          const filterCurrency = priceFilterCurrency || selectedCurrency;
          
          if (filterCurrency) {
            const priceFiltered = [];
            
            for (const place of filtered) {
              // Get place price and currency
              const placePrice = place.price;
              const placeCurrency = place.currency;
              
              // Skip places without price or currency info
              if (!placePrice || !placeCurrency) {
                continue;
              }
              
              let convertedPrice = placePrice;
              
              // Convert place price to filter currency if they're different
              if (placeCurrency.charCode !== filterCurrency.charCode) {
                try {
                  convertedPrice = await convertCurrency(
                    placePrice, 
                    placeCurrency.charCode, 
                    filterCurrency.charCode
                  );
                } catch (error) {
                  // If conversion fails, skip this place from filtering
                  continue;
                }
              }
              
              // Apply price range filter
              let passesFilter = true;
              
              if (minPrice !== null && minPrice !== undefined) {
                if (convertedPrice < minPrice) {
                  passesFilter = false;
                }
              }
              
              if (maxPrice !== null && maxPrice !== undefined) {
                if (convertedPrice > maxPrice) {
                  passesFilter = false;
                }
              }
              
              if (passesFilter) {
                priceFiltered.push(place);
              }
            }
            
            filtered = priceFiltered;
          }
        } catch (error) {
          console.error("Error applying price filter:", error);
          // On error, don't apply price filter
        }
      }
      
      setFilteredPlaces(filtered);
    };

    applyFilters();
  }, [searchTerm, places, minPrice, maxPrice, hasActivePriceFilter, priceFilterCurrency, selectedCurrency, hasActiveAttendeesFilter, filterPlacesByAttendees, hasActiveSizeFilter, filterPlacesBySize, hasSelectedPerks, filterPlacesByPerks, hasSelectedPolicies, filterPlacesByPolicies]);

  // Redirect non-agents away from this page
  if (user && user.userType !== 'agent') {
    return <Navigate to="/account" />;
  }

  // Helper function to get selected user details
  const getSelectedUser = () => {
    return allUsers.find(u => u.id.toString() === selectedUserId.toString());
  };

  // Filter users for dropdown display
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Helper function to clear all filters
  const clearAllFilters = () => {
    handleUserFilterChange("");
    setSearchTerm("");
    setUserSearchTerm("");
  };

  // Helper function to get active filters for the ActiveFilters component
  const getActiveFilters = () => {
    const filters = [];
    
    if (selectedUserId) {
      filters.push(FilterCreators.host(getSelectedUser(), () => {
        handleUserFilterChange("");
        setUserSearchTerm("");
      }));
    }
    
    if (searchTerm) {
      filters.push(FilterCreators.search(searchTerm, () => setSearchTerm("")));
    }
    
    return filters;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="animate-pulse space-y-4">
            <div className="card-base">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-base">
                  <div className="h-80 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
        
        {/* Page header with search and Add Place button in same row */}
        <div className="card-base mb-6">
          <div className="card-content p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Search input */}
              <div className="flex-1">
                <input
                  id="search"
                  type="text"
                  placeholder={t('allPlacesPage.searchPlaceholder', 'Search by title, address, or host name...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base text-primary h-10"
                />
              </div>
              
              {/* Create Place button for agents */}
              {user && user.userType === 'agent' && (
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
                    {t('allPlacesPage.createPlace', 'Create Place')}
                  </Link>
                </div>
              )}
            </div>
            
            {/* Active filters */}
            <div className="mt-4">
              <ActiveFilters 
                filters={getActiveFilters()}
                onClearAllFilters={clearAllFilters}
              />
            </div>
          </div>
        </div>
        
        {/* Places listing */}
        {filteredPlaces.length === 0 ? (
          <div className="card-base text-center">
            <div className="card-content">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">{t('allPlacesPage.noRoomsFound', 'No conference rooms found')}</h3>
              <p className="text-secondary mb-4">
                {selectedUserId || searchTerm 
                  ? t('allPlacesPage.tryAdjustingFilters', 'Try adjusting your filters to see more results.') 
                  : t('allPlacesPage.noRoomsListed', 'No conference rooms have been listed yet.')
                }
              </p>
              {(selectedUserId || searchTerm) && (
                <button
                  onClick={clearAllFilters}
                  className="btn-outline"
                >
                  {t('allPlacesPage.clearAllFilters', 'Clear all filters')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Results header */}
            <div className="flex items-center justify-between mb-spacing-md">
              <h2 className="text-lg font-semibold text-primary">
                {t('allPlacesPage.allRooms', 'All Conference Rooms')}
                <span className="ml-2 text-sm text-secondary">({filteredPlaces.length})</span>
              </h2>
            </div>

            {/* Places grid using PlaceCard component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  showActions={false}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {!searchTerm && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemName="conference rooms"
            />
          </div>
        )}
      </div>
    </div>
  );
}