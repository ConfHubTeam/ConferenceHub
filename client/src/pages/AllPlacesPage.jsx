import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import { UserContext } from "../components/UserContext";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { convertCurrency } from "../utils/currencyUtils";
import CloudinaryImage from "../components/CloudinaryImage";
import PriceDisplay from "../components/PriceDisplay";
import Pagination from "../components/Pagination";
import ActiveFilters, { FilterCreators } from "../components/ActiveFilters";

export default function AllPlacesPage() {
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
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (selectedUserId) {
        queryParams.set('userId', selectedUserId);
      }
      
      const endpoint = `/places?${queryParams.toString()}`;
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
      
      // Apply price filter
      if (hasActivePriceFilter && filtered.length > 0) {
        console.log("Applying price filter:", { minPrice, maxPrice, filterCurrency: priceFilterCurrency?.charCode || selectedCurrency?.charCode });
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
                  console.error("Error converting price for filtering:", error);
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
              
              // Debug log for price filtering
              if (minPrice !== null || maxPrice !== null) {
                console.log(`Place "${place.title}": ${placePrice} ${placeCurrency.charCode} → ${convertedPrice.toFixed(2)} ${filterCurrency.charCode}, Range: ${minPrice || 'no min'} - ${maxPrice || 'no max'}, Passes: ${passesFilter}`);
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
  }, [searchTerm, places, minPrice, maxPrice, hasActivePriceFilter, priceFilterCurrency, selectedCurrency]);

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
      <div>
        <AccountNav />
        <div className="px-8 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="px-8">
        
        {/* Page header with Create Place button for agents */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            
            {/* Create Place button for agents */}
            {user && user.userType === 'agent' && (
              <Link
                className="inline-flex items-center gap-2 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-medium"
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
                Create Place
              </Link>
            )}
          </div>
        </div>
        
        {/* Filters and controls */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Rooms
              </label>
              <input
                type="text"
                placeholder="Search by title, address, or host name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
              />
            </div>
          </div>
          
          {/* Active filters */}
          <ActiveFilters 
            filters={getActiveFilters()}
            onClearAllFilters={clearAllFilters}
          />
        </div>
        
        {/* Places listing */}
        {filteredPlaces.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conference rooms found</h3>
            <p className="text-gray-500 mb-4">
              {selectedUserId || searchTerm 
                ? "Try adjusting your filters to see more results." 
                : "No conference rooms have been listed yet."
              }
            </p>
            {(selectedUserId || searchTerm) && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="mb-8">
            {/* Results summary */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredPlaces.length} of {totalItems} conference room{totalItems !== 1 ? 's' : ''}
              {selectedUserId && ` by ${getSelectedUser()?.name}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map(place => (
                <div key={place.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <a href={`/place/${place.id}`} className="block">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {place.photos?.[0] && (
                        <CloudinaryImage
                          photo={place.photos[0]}
                          alt={place.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      )}
                      {!place.photos?.[0] && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 truncate">{place.title}</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{place.address}</p>
                      
                      {/* Additional details */}
                      <div className="space-y-2 mb-3">
                        {place.maxGuests && (
                          <div className="flex items-center text-xs text-gray-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Up to {place.maxGuests} guests
                          </div>
                        )}
                        {place.squareMeters && (
                          <div className="flex items-center text-xs text-gray-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            {place.squareMeters} m²
                          </div>
                        )}
                      </div>
                      
                      {place.owner && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Host: {place.owner.name}
                          </span>
                          <span className="text-sm text-primary font-semibold">
                            <PriceDisplay 
                              price={place.price} 
                              currency={place.currency}
                              suffix="/hour"
                              priceClassName="text-sm"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                  </a>
                </div>
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