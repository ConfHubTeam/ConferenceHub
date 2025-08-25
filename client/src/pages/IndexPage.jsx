import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ImageHoverQuadSquare from "../components/ImageHoverQuadSquare";
import FavoriteButton from "../components/FavoriteButton";
import MapView from "../components/MapView";
import PriceDisplay from "../components/PriceDisplay";
import Pagination from "../components/Pagination";
import FilterRow from "../components/FilterRow";
import Header from "../components/Header";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";
import { useDateTimeFilter } from "../contexts/DateTimeFilterContext";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAttendeesFilter } from "../contexts/AttendeesFilterContext";
import { useSizeFilter } from "../contexts/SizeFilterContext";
import { usePerksFilter } from "../contexts/PerksFilterContext";
import { usePoliciesFilter } from "../contexts/PoliciesFilterContext";
import { convertCurrency } from "../utils/currencyUtils";
import { createRegionService } from "../services/RegionService.js";
import { useTranslation as useI18n } from "react-i18next";
import { DEFAULT_MAP_CONFIG, REGION_FILTER_CONFIG } from "../utils/regionConstants.js";
import api from "../utils/api";

function IndexPageBase() {
  const { t, ready } = useTranslation(["places", "common", "navigation"]);
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [placesForMap, setPlacesForMap] = useState([]); // Places for map markers (without bounds filtering)
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [isClientPaginated, setIsClientPaginated] = useState(false);
  
  // Map bounds state for additional filtering
  const [mapBounds, setMapBounds] = useState(null);
  
  // Map ref for focus operations
  const mapRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 50; // Number of places to show per page
  
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
  
  // Region service for filtering
  const { i18n } = useI18n();
  const regionService = useMemo(() => createRegionService(i18n), [i18n]);
  
  // Get map state from outlet context (passed down from Layout)
  const context = useOutletContext();
  const { 
    isMapVisible = false, 
    isMobileMapView = false, 
    hideMap = () => {}, 
    hideMobileMap = () => {},
    selectedRegionId = null,
    onRegionChange = () => {},
    onMapFocus = () => {},
    mapFocusRef
  } = context || {};
  
  // Memoize map visibility to prevent unnecessary renders
  const mapVisible = useMemo(() => isMapVisible, [isMapVisible]);
  
  const location = useLocation();
  
  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPagePlaces = filteredPlaces; // Server already returns the correct page
  const showingFrom = totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of listings when page changes
    const listingsSection = document.querySelector('[data-listings-section]');
    if (listingsSection) {
      listingsSection.scrollTop = 0;
    }
  };
  
  // Reset to page 1 when filters change (location.search changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [location.search]);
  
  // Handle map bounds changes
  const handleMapBoundsChanged = useCallback((bounds) => {
    setMapBounds(bounds);
  }, []);
  
  // Handle when map is ready - connect ref to Layout's mapFocusRef and do initial focus
  const handleMapReady = useCallback((mapInstance) => {
    // Map is ready for focus operations
    if (mapFocusRef && mapRef.current) {
      mapFocusRef.current = mapRef.current;
    }
    
    // If we have a selected region when map loads, focus on it
    if (selectedRegionId && regionService && onMapFocus) {
      if (selectedRegionId === 'tashkent-city') {
        // For the default region, use the exact DEFAULT_MAP_CONFIG to ensure consistent zoom
        const defaultRegion = regionService.getDefaultRegion();
        if (defaultRegion) {
          onMapFocus({
            center: defaultRegion.coordinates,
            zoom: DEFAULT_MAP_CONFIG.zoom, // Use exact default zoom
            regionId: defaultRegion.id
          });
        }
      } else {
        // For other regions, use the standard approach
        const mapConfig = regionService.getMapConfigForRegion(selectedRegionId, 'CITY');
        if (mapConfig) {
          onMapFocus(mapConfig);
        }
      }
    }
  }, [mapFocusRef, selectedRegionId, regionService, onMapFocus]);
  
  // Connect mapRef to Layout's mapFocusRef when component mounts
  useEffect(() => {
    if (mapFocusRef && mapRef.current) {
      mapFocusRef.current = mapRef.current;
    }
  }, [mapFocusRef]);
  
  // Reset map bounds when map visibility changes
  useEffect(() => {
    if (!mapVisible) {
      setMapBounds(null);
    }
  }, [mapVisible]);
  
  useEffect(() => {
    setIsLoading(true);
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

    // Initialize AttendeesFilter from URL parameters (normalized to context keys)
    if (params.has('minAttendees') || params.has('maxAttendees') || params.has('attendeesRange')) {
      setAttendeesFromSerializedValues({
        minAttendees: params.get('minAttendees') || '',
        maxAttendees: params.get('maxAttendees') || '',
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

    // Decide whether to use server or client pagination based on active non-availability filters
    const nonAvailabilityFiltersActive = hasActivePriceFilter || hasActiveAttendeesFilter || hasActiveSizeFilter || hasSelectedPerks || hasSelectedPolicies || !!selectedRegionId;

    // Apply pagination parameters only when using server pagination
    if (!nonAvailabilityFiltersActive) {
      params.set('page', currentPage.toString());
      params.set('limit', itemsPerPage.toString());
    } else {
      params.delete('page');
      params.delete('limit');
    }

    api.get("/places/home?" + params.toString()).then((response) => {
      // Handle both old format (direct array) and new format (with pagination)
      if (!nonAvailabilityFiltersActive && response.data.places) {
        // New paginated format (server pagination)
        setPlaces(response.data.places);
        setFilteredPlaces(response.data.places);
        setPlacesForMap(response.data.places);
        setTotalItems(response.data.pagination.totalItems);
        setIsClientPaginated(false);
      } else {
        // Old format or client-side pagination mode
        const list = response.data.places ? response.data.places : response.data;
        setPlaces(list);
        setFilteredPlaces(list);
        setPlacesForMap(list);
        setTotalItems(Array.isArray(list) ? list.length : 0);
        setIsClientPaginated(true);
      }
      setIsLoading(false);
    });
  }, [location.search, currentPage, itemsPerPage, setFromSerializedValues, setAttendeesFromSerializedValues, setSizeFromSerializedValues, hasActivePriceFilter, hasActiveAttendeesFilter, hasActiveSizeFilter, hasSelectedPerks, hasSelectedPolicies, selectedRegionId]);

  // Helper function to check if a place belongs to a region (address match or proximity)
  const placeMatchesRegion = useCallback((place, regionId) => {
    if (!place || !regionId || !regionService) return false;
    
    const region = regionService.getRegionById(regionId);
    if (!region) return false;
    
    let matchScore = 0;
    let matchReason = '';
    
    // Strategy 1: Check if address contains any of the region names (uz, en, ru)
    if (place.address) {
      const addressLower = place.address.toLowerCase();
      
      // Check for exact matches first (higher priority)
      for (const [lang, name] of Object.entries(region.names)) {
        const nameLower = name.toLowerCase();
        if (addressLower.includes(nameLower)) {
          matchScore = REGION_FILTER_CONFIG.STRATEGY_PRIORITIES.ADDRESS_EXACT_MATCH;
          matchReason = `Address contains region name "${name}" (${lang})`;
          
          // Debug log for development
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Place "${place.title}" matches region "${regionId}": ${matchReason}`);
          }
          
          return true;
        }
      }
    }
    
    // Strategy 2: Check geographical proximity if coordinates are available
    if (place.lat && place.lng && region.coordinates) {
      const distance = regionService.calculateDistance(
        parseFloat(place.lat),
        parseFloat(place.lng),
        region.coordinates.lat,
        region.coordinates.lng
      );
      
      // Get proximity threshold from configuration
      const proximityThreshold = REGION_FILTER_CONFIG.PROXIMITY_THRESHOLDS[regionId] 
        || REGION_FILTER_CONFIG.PROXIMITY_THRESHOLDS.default;
      
      if (distance <= proximityThreshold) {
        matchScore = distance <= proximityThreshold * 0.5 
          ? REGION_FILTER_CONFIG.STRATEGY_PRIORITIES.PROXIMITY_CLOSE
          : REGION_FILTER_CONFIG.STRATEGY_PRIORITIES.PROXIMITY_MEDIUM;
        matchReason = `Within ${distance.toFixed(1)}km of region center (threshold: ${proximityThreshold}km)`;
        
        return true;
      }
    }
    
    return false;
  }, [regionService]);

  // Apply all client-side filters (perks, policies, attendees, size, price, region, map bounds) and handle pagination
  useEffect(() => {
    let cancelled = false;

    const runFiltering = async () => {
      let working = Array.isArray(places) ? [...places] : [];

      // Apply perks and policies first (fast, synchronous)
      working = filterPlacesByPerks(working);
      working = filterPlacesByPolicies(working);

      // Apply attendees and size filters
      working = filterPlacesByAttendees(working);
      working = filterPlacesBySize(working);

      // Apply price filter with currency conversion
      if (hasActivePriceFilter && (minPrice != null || maxPrice != null)) {
        const targetCode = (priceFilterCurrency && priceFilterCurrency.charCode) || (selectedCurrency && selectedCurrency.charCode) || null;
        if (targetCode) {
          const matches = await Promise.all(
            working.map(async (place) => {
              const placeCurrency = place.currency?.charCode || null;
              const basePrice = place.price;
              if (basePrice == null || isNaN(parseFloat(basePrice))) return false;

              try {
                let comparable = basePrice;
                if (placeCurrency && placeCurrency !== targetCode) {
                  comparable = await convertCurrency(basePrice, placeCurrency, targetCode);
                }
                if (minPrice != null && comparable < minPrice) return false;
                if (maxPrice != null && comparable > maxPrice) return false;
                return true;
              } catch (e) {
                // On conversion failure, be conservative and include only if within raw price
                if (minPrice != null && basePrice < minPrice) return false;
                if (maxPrice != null && basePrice > maxPrice) return false;
                return true;
              }
            })
          );
          working = working.filter((_, idx) => matches[idx]);
        }
      }

      // Apply region filter when map is closed (list view only)
      if (!mapVisible && selectedRegionId) {
        working = working.filter(place => placeMatchesRegion(place, selectedRegionId));
      }

      // Set data for map markers prior to bounds filtering so map shows all filtered items
      const mapData = working;

      // Apply map bounds filter only for the listing display (only if bounds are available)
      let displayPlaces = working;
      if (mapBounds && mapVisible && window.google && window.google.maps) {
        displayPlaces = working.filter(place => {
          if (!place.lat || !place.lng) return false;
          const position = new window.google.maps.LatLng(
            parseFloat(place.lat), 
            parseFloat(place.lng)
          );
          return mapBounds.contains(position);
        });
      }

      // Handle pagination depending on mode
      if (isClientPaginated) {
        const total = displayPlaces.length;
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const pageSlice = displayPlaces.slice(startIdx, endIdx);

        if (!cancelled) {
          setTotalItems(total);
          setFilteredPlaces(pageSlice);
          setPlacesForMap(mapData);
        }
      } else {
        // Server pagination mode; keep totalItems from server, but apply display filters
        if (!cancelled) {
          setFilteredPlaces(displayPlaces);
          setPlacesForMap(mapData);
        }
      }
    };

    runFiltering();

    return () => { cancelled = true; };
  }, [places, filterPlacesByPerks, filterPlacesByPolicies, filterPlacesByAttendees, filterPlacesBySize, hasActivePriceFilter, minPrice, maxPrice, priceFilterCurrency, selectedCurrency, mapVisible, selectedRegionId, mapBounds, placeMatchesRegion, isClientPaginated, currentPage, itemsPerPage]);

  // Performance optimization: Memoize region change handler to prevent unnecessary map focus calls
  const lastRegionRef = useRef(null);
  
  // Handle region selection separately - only affects map focus, not listing filtering
  useEffect(() => {
    // Performance optimization: Skip if same region or missing dependencies
    if (!selectedRegionId || !regionService || !mapRef.current || !onMapFocus) {
      return;
    }
    
    // Performance optimization: Skip if same as last region
    if (lastRegionRef.current === selectedRegionId) {
      return;
    }
    
    lastRegionRef.current = selectedRegionId;
    
    if (selectedRegionId === 'tashkent-city') {
      // For the default region, use the exact DEFAULT_MAP_CONFIG to ensure consistent zoom
      const defaultRegion = regionService.getDefaultRegion();
      if (defaultRegion) {
        onMapFocus({
          center: defaultRegion.coordinates,
          zoom: DEFAULT_MAP_CONFIG.zoom, // Use exact default zoom
          regionId: defaultRegion.id
        });
      }
    } else {
      // For other regions, use the standard approach
      const mapConfig = regionService.getMapConfigForRegion(selectedRegionId, 'CITY');
      if (mapConfig) {
        onMapFocus(mapConfig);
      }
    }
  }, [selectedRegionId, regionService, onMapFocus]);

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
  const memoizedPlacesForMap = useMemo(() => placesForMap, [placesForMap]);

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
              selectedRegionId={selectedRegionId}
              onRegionChange={onRegionChange}
              onMapFocus={onMapFocus}
            />
          </div>
          
          {/* X button to close mobile map - bottom center */}
          <button
            onClick={() => hideMobileMap && hideMobileMap()}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[75] bg-white shadow-lg hover:shadow-xl p-4 transition-shadow rounded-full"
            title={ready ? t("places:map.close_map") : "Close map"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Mobile Map container - remaining height with padding for header and filter */}
          <div className="flex-1 w-full pt-[120px] border-0 outline-0">
            <MapView 
              ref={mapRef}
              places={memoizedPlacesForMap} 
              hoveredPlaceId={hoveredPlaceId}
              onBoundsChanged={handleMapBoundsChanged}
              onMapReady={handleMapReady}
            />
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
          className={`overflow-y-auto bg-gradient-to-b from-gray-50 to-white ${isDragging ? '' : 'transition-all duration-75 ease-linear'}`}
          style={{ 
            width: mapVisible ? `${listingsWidth}%` : '100%'
          }}
          data-listings-section
        >
          <div className="p-4 pb-20 md:pb-4 bg-white/50 backdrop-blur-sm rounded-t-3xl mx-2 mt-2 shadow-sm">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="ml-4 text-lg text-gray-600">
                  {ready ? t("places:search_results.loading") : "Loading venues..."}
                </span>
              </div>
            ) : totalItems === 0 ? (
              <div className="text-center my-12">
                <h3 className="text-xl font-bold text-gray-700">
                  {ready ? t("places:search_results.no_results") : "No results found"}
                </h3>
                <p className="text-gray-500 mt-2">
                  {ready ? t("places:search_results.no_results_description") : "Try adjusting your filters to find more options"}
                </p>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${getGridColumns()}`}
              >
                {currentPagePlaces.map((place) => (
                  <div 
                    key={place.id} 
                    className="relative group transition-transform duration-200 hover:scale-[1.02]"
                    onMouseEnter={() => setHoveredPlaceId(place.id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                  >
                    {/* Favorite Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton place={place} />
                    </div>

                    <Link to={`/place/${place.id}${location.search}`}>
                      <div className="bg-white overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 hover:border-primary group hover:-translate-y-1">
                        <ImageHoverQuadSquare 
                          photos={place.photos}
                          title={place.title}
                        />
                        <div className="p-5 bg-gradient-to-br from-white to-gray-50/50">
                          <h2 className="font-bold text-lg truncate text-gray-900 group-hover:text-primary transition-colors duration-200">{place.title}</h2>
                          <div className="flex items-center text-gray-500 text-sm mt-2">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h3 className="truncate font-medium">{place.address}</h3>
                          </div>
                          
                          {/* Rating and max guests row */}
                          <div className="flex items-center space-x-3 mt-2">
                            {/* Rating display */}
                            <div className="flex items-center text-base text-gray-600">
                              <svg className="w-5 h-5 mr-1 fill-current text-yellow-400" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-medium">
                                {place.averageRating || (ready ? t("places:card.new_rating") : "New")}
                              </span>
                              {place.totalReviews > 0 && (
                                <span className="ml-1">
                                  ({place.totalReviews})
                                </span>
                              )}
                            </div>
                            
                            {/* Max guests */}
                            {place.maxGuests && (
                              <div className="flex items-center text-base text-gray-600">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {place.maxGuests} {ready ? t("places:card.guests") : "guests"}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <PriceDisplay 
                              price={place.price} 
                              currency={place.currency} 
                              suffix={ready ? t("places:card.price_per_hour") : "/hr"}
                              className="text-primary text-lg font-semibold"
                            />
                            {place.type && (
                              <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1">{place.type}</span>
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
            {!isLoading && totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showingFrom={showingFrom}
                showingTo={showingTo}
                totalItems={totalItems}
                itemName={ready ? t("places:search_results.places") : "places"}
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
            title={ready ? t("places:map.drag_to_resize") : "Drag to resize layout"}
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
              title={ready ? t("places:map.close_map") : "Close map"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Map container - only render when visible */}
            <div className="w-full h-full overflow-hidden relative border-0 outline-0">
              <MapView 
                ref={mapRef}
                places={memoizedPlacesForMap} 
                hoveredPlaceId={hoveredPlaceId}
                onBoundsChanged={handleMapBoundsChanged}
                onMapReady={handleMapReady}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced IndexPage with route-based translation loading
export default withTranslationLoading(IndexPageBase, {
  namespaces: ["places", "common", "navigation"],
  preloadNamespaces: ["search", "filters"],
  loadingComponent: ({ children, ...props }) => (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-full overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg text-gray-600 animate-pulse">Loading venues...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  errorComponent: ({ error, retry, ...props }) => (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-full overflow-y-auto">
          <div className="p-4">
            <div className="text-center my-12">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Translation Error</h3>
              <p className="text-gray-500 mb-4">Failed to load translations</p>
              <button 
                onClick={retry}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
});
