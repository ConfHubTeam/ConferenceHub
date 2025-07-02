import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import CloudinaryImage from "../components/CloudinaryImage";
import MapView from "../components/MapView";
import PriceDisplay from "../components/PriceDisplay";
import Pagination from "../components/Pagination";
import FilterRow from "../components/FilterRow";
import Header from "../components/Header";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAttendeesFilter } from "../contexts/AttendeesFilterContext";
import { useSizeFilter } from "../contexts/SizeFilterContext";
import { usePerksFilter } from "../contexts/PerksFilterContext";
import { usePoliciesFilter } from "../contexts/PoliciesFilterContext";
import { convertCurrency } from "../utils/currencyUtils";
import api from "../utils/api";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // Number of places to show per page
  
  // Resizable layout state
  const [listingsWidth, setListingsWidth] = useState(50); // Percentage width of listings section
  const [isDragging, setIsDragging] = useState(false);
  
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  
  // Date/Time filter context
  const { setFromSerializedValues } = useDateTimeFilter();
  
  // Price filter context
  const { minPrice, maxPrice, hasActivePriceFilter, selectedCurrency: priceFilterCurrency } = usePriceFilter();
  
  // Currency context
  const { selectedCurrency } = useCurrency();
  
  // Attendees filter context
  const { filterPlacesByAttendees, hasActiveAttendeesFilter, setFromSerializedValues: setAttendeesFromSerializedValues } = useAttendeesFilter();
  
  // Size filter context
  const { filterPlacesBySize, hasActiveSizeFilter, setFromSerializedValues: setSizeFromSerializedValues } = useSizeFilter();
  
  // Perks filter context  
  const { filterPlacesByPerks, hasSelectedPerks } = usePerksFilter();
  
  // Policies filter context
  const { filterPlacesByPolicies, hasSelectedPolicies } = usePoliciesFilter();
  
  // Get map state from outlet context (passed down from Layout)
  const context = useOutletContext();
  const { 
    isMapVisible = false, 
    isMobileMapView = false, 
    hideMap = () => {}, 
    hideMobileMap = () => {} 
  } = context || {};
  
  const location = useLocation();
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagePlaces = filteredPlaces.slice(startIndex, endIndex);
  const showingFrom = filteredPlaces.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, filteredPlaces.length);
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of listings when page changes
    const listingsSection = document.querySelector('[data-listings-section]');
    if (listingsSection) {
      listingsSection.scrollTop = 0;
    }
  };
  
  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(1); // Reset to first page when search changes
    // Get URL params if any
    const params = new URLSearchParams(location.search);
    
    // Initialize DateTimeFilter from URL parameters
    if (params.has('dates') || params.has('startTime') || params.has('endTime')) {
      setFromSerializedValues({
        dates: params.get('dates') || '',
        startTime: params.get('startTime') || '',
        endTime: params.get('endTime') || ''
      });
    }
    
    // Initialize AttendeesFilter from URL parameters
    if (params.has('attendeesMin') || params.has('attendeesMax') || params.has('attendeesRange')) {
      setAttendeesFromSerializedValues({
        minAttendees: params.get('attendeesMin') || '',
        maxAttendees: params.get('attendeesMax') || '',
        attendeesRange: params.get('attendeesRange') || ''
      });
    }
    
    // Initialize SizeFilter from URL parameters
    if (params.has('minSize') || params.has('maxSize') || params.has('sizeRange')) {
      setSizeFromSerializedValues({
        minSize: params.get('minSize') || '',
        maxSize: params.get('maxSize') || '',
        sizeRange: params.get('sizeRange') || ''
      });
    }
    
    // Using our API utility instead of direct axios import
    api.get("/places/home" + (location.search ? location.search : "")).then((response) => {
      setPlaces(response.data);
      setFilteredPlaces(response.data);
      setTotalItems(response.data.length);
      setIsLoading(false);
    });
  }, [location.search, setFromSerializedValues, setAttendeesFromSerializedValues, setSizeFromSerializedValues]);

  // Apply all filters whenever any filter or places change
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = [...places];
      
      // If no filters are active, show all places
      if (!hasActiveAttendeesFilter && !hasActivePriceFilter && !hasActiveSizeFilter && !hasSelectedPerks && !hasSelectedPolicies) {
        setFilteredPlaces(places);
        setTotalItems(places.length);
        return;
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
          
          console.log("Applying price filter:", { minPrice, maxPrice, filterCurrency: filterCurrency?.charCode });
          
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
      setTotalItems(filtered.length);
      setCurrentPage(1); // Reset to first page when filter changes
    };

    applyFilters();
  }, [places, minPrice, maxPrice, hasActivePriceFilter, priceFilterCurrency, selectedCurrency, hasActiveAttendeesFilter, filterPlacesByAttendees, hasActiveSizeFilter, filterPlacesBySize, hasSelectedPerks, filterPlacesByPerks, hasSelectedPolicies, filterPlacesByPolicies]);

  // Resizable functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => {
        const mainContent = document.querySelector('[data-main-content]');
        if (mainContent) {
          const containerRect = mainContent.getBoundingClientRect();
          const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
          const constrainedWidth = Math.min(Math.max(newWidth, 25), 75);
          setListingsWidth(constrainedWidth);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  // Load saved layout preference
  useEffect(() => {
    const savedWidth = localStorage.getItem('listingsWidth');
    if (savedWidth) {
      const width = parseFloat(savedWidth);
      if (width >= 25 && width <= 75) {
        setListingsWidth(width);
      }
    }
  }, []);

  // Save layout preference when it changes
  useEffect(() => {
    localStorage.setItem('listingsWidth', listingsWidth.toString());
  }, [listingsWidth]);

  // Calculate grid columns based on listings width
  const getGridColumns = () => {
    if (!isMapVisible) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    
    if (listingsWidth >= 65) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    if (listingsWidth >= 45) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1";
  };

  // Memoize filtered places to prevent unnecessary re-renders
  const memoizedFilteredPlaces = useMemo(() => filteredPlaces, [filteredPlaces]);

  // Memoize map visibility to prevent unnecessary renders
  const mapVisible = useMemo(() => isMapVisible, [isMapVisible]);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Map View - Full Screen */}
      {isMobileMapView && (
        <div className="md:hidden fixed inset-0 z-[70] bg-white flex flex-col">
          {/* Header - Fixed at top */}
          <div className="fixed top-0 left-0 right-0 z-[80] bg-white shadow-sm">
            <Header />
          </div>
          
          {/* Filter Row - Fixed below header */}
          <div className="fixed top-[73px] left-0 right-0 z-[75] bg-white shadow-sm">
            <FilterRow 
              isMapVisible={false}
              toggleMap={() => {}}
              showMobileMap={() => {}}
              isMobileMapView={true}
            />
          </div>
          
          {/* X button to close mobile map - bottom center */}
          <button
            onClick={() => hideMobileMap && hideMobileMap()}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[75] bg-white shadow-lg hover:shadow-xl p-4 transition-shadow rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Mobile Map container - remaining height with padding for header and filter */}
          <div className="flex-1 w-full pt-[120px] border-0 outline-0">
            <MapView places={memoizedFilteredPlaces} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div 
        className="flex-1 flex overflow-hidden relative"
        data-main-content
      >
        {/* Listings section */}
        <div 
          className={`overflow-y-auto ${isDragging ? '' : 'transition-all duration-75 ease-linear'}`}
          style={{ 
            width: mapVisible ? `${listingsWidth}%` : '100%'
          }}
          data-listings-section
        >
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="text-center my-12">
                <h3 className="text-xl font-bold text-gray-700">No results found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your filters to find more options</p>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${getGridColumns()}`}
              >
                {currentPagePlaces.map((place) => (
                  <div key={place.id} className="relative group">
                    <Link to={"/place/" + place.id}>
                      <div className="bg-white overflow-hidden shadow hover:shadow-lg transition-shadow">
                        <div className="aspect-square overflow-hidden">
                          {place.photos?.length > 0 && (
                            <CloudinaryImage
                              photo={place.photos[0]}
                              alt={place.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="p-4">
                          <h2 className="font-semibold text-base truncate">{place.address}</h2>
                          <h3 className="text-gray-500 text-sm truncate mt-1">{place.title}</h3>
                          {place.startDate && place.endDate && (
                            <p className="text-gray-500 text-sm mt-1">
                              {new Date(place.startDate).getDate()} {months[new Date(place.startDate).getMonth()]}
                              {" - "}{new Date(place.endDate).getDate()} {months[new Date(place.endDate).getMonth()]}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <PriceDisplay 
                              price={place.price} 
                              currency={place.currency} 
                              suffix=" / hour"
                              className="text-primary text-base font-semibold"
                            />
                            {place.type && (
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1">{place.type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {!isLoading && filteredPlaces.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showingFrom={showingFrom}
                showingTo={showingTo}
                totalItems={filteredPlaces.length}
                itemName="places"
              />
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        {mapVisible && (
          <div
            className={`hidden md:flex w-1 hover:w-2 flex-shrink-0 relative group transition-all duration-75 ease-linear ${
              isDragging 
                ? 'bg-primary w-2' 
                : 'bg-gray-200 hover:bg-primary'
            } cursor-col-resize`}
            onMouseDown={handleMouseDown}
            title="Drag to resize layout"
          >
            {/* Drag handle indicator */}
            <div className={`absolute inset-y-0 -left-1 -right-1 flex items-center justify-center transition-opacity duration-75 ease-linear ${
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex flex-col space-y-0.5">
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Expanded hover area for better UX */}
            <div className="absolute inset-y-0 -left-3 -right-3"></div>
          </div>
        )}

        {/* Desktop Map section */}
        {mapVisible && (
          <div 
            className={`hidden md:block relative flex-1 ${isDragging ? '' : 'transition-all duration-75 ease-linear'}`}
            style={{ 
              width: `${100 - listingsWidth}%`
            }}
          >
            {/* X button to close map */}
            <button
              onClick={() => hideMap && hideMap()}
              className="absolute top-4 right-4 z-40 bg-white shadow-lg hover:shadow-xl p-3 transition-shadow rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Map container - only render when visible */}
            <div className="w-full h-full overflow-hidden relative border-0 outline-0">
              <MapView places={memoizedFilteredPlaces} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
