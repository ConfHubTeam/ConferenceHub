import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CloudinaryImage from "../components/CloudinaryImage";
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
  
  // Map bounds state for additional filtering
  const [mapBounds, setMapBounds] = useState(null);
  
  // Map ref for focus operations
  const mapRef = useRef(null);
  
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
      setPlacesForMap(response.data);
      setTotalItems(response.data.length);
      setIsLoading(false);
    });
  }, [location.search, setFromSerializedValues, setAttendeesFromSerializedValues, setSizeFromSerializedValues]);

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

  // Apply all filters whenever any filter or places change
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = [...places];
      
      // Apply region filter when map is closed (list view only)
      if (!mapVisible && selectedRegionId) {
        const beforeCount = filtered.length;
        filtered = filtered.filter(place => 
          placeMatchesRegion(place, selectedRegionId)
        );
      }
      
      // Check if any filters are active (excluding region filter for listing purposes)
      const hasRegionFilter = selectedRegionId !== null;
      
      // If no other filters are active, show all places (with optional region filtering)
      if (!hasActiveAttendeesFilter && !hasActivePriceFilter && !hasActiveSizeFilter && !hasSelectedPerks && !hasSelectedPolicies) {
        // Set places for map (all places, no bounds filtering)
        setPlacesForMap(places);
        
        // For list view, use the filtered places (which may include region filtering)
        let listFiltered = filtered;
        
        // Apply map bounds filter only for the listing display (only if bounds are available)
        if (mapBounds && mapVisible && window.google && window.google.maps) {
          listFiltered = places.filter(place => {
            if (!place.lat || !place.lng) return false;
            const position = new window.google.maps.LatLng(
              parseFloat(place.lat), 
              parseFloat(place.lng)
            );
            return mapBounds.contains(position);
          });
        } else if (!mapVisible) {
          // If map is not visible, use the region-filtered places
          listFiltered = filtered;
        } else {
          // If map is visible but bounds are not available yet, show all places
          listFiltered = places;
        }
        setFilteredPlaces(listFiltered);
        setTotalItems(listFiltered.length);
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
      
      // Set places for map (all filtered places without bounds filtering)
      setPlacesForMap(filtered);
      
      // Apply map bounds filter as the final step for the listing display only (only if bounds are available)
      let displayFiltered = filtered;
      if (mapBounds && mapVisible && window.google && window.google.maps) {
        displayFiltered = filtered.filter(place => {
          // Skip places without coordinates
          if (!place.lat || !place.lng) return false;
          
          const position = new window.google.maps.LatLng(
            parseFloat(place.lat), 
            parseFloat(place.lng)
          );
          return mapBounds.contains(position);
        });
      } else if (mapVisible) {
        // If map is visible but bounds are not available yet, show all filtered places
        displayFiltered = filtered;
      }
      
      setFilteredPlaces(displayFiltered);
      setTotalItems(displayFiltered.length);
      setCurrentPage(1); // Reset to first page when filter changes
    };

    applyFilters();
  }, [places, minPrice, maxPrice, hasActivePriceFilter, priceFilterCurrency, selectedCurrency, hasActiveAttendeesFilter, filterPlacesByAttendees, hasActiveSizeFilter, filterPlacesBySize, hasSelectedPerks, filterPlacesByPerks, hasSelectedPolicies, filterPlacesByPolicies, mapBounds, mapVisible, selectedRegionId, placeMatchesRegion]);

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
    
    // Reset to first page when region changes
    setCurrentPage(1);
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
          className={`overflow-y-auto ${isDragging ? '' : 'transition-all duration-75 ease-linear'}`}
          style={{ 
            width: mapVisible ? `${listingsWidth}%` : '100%'
          }}
          data-listings-section
        >
          <div className="p-4 pb-20 md:pb-4">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="ml-4 text-lg text-gray-600">
                  {ready ? t("places:search_results.loading") : "Loading venues..."}
                </span>
              </div>
            ) : filteredPlaces.length === 0 ? (
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
                      <div className="bg-white overflow-hidden shadow hover:shadow-lg transition-all duration-200 rounded-2xl border border-gray-200 hover:border-gray-400">
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
                          <h2 className="font-semibold text-lg truncate">{place.title}</h2>
                          <div className="flex items-center text-gray-500 text-base mt-1">
                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h3 className="truncate">{place.address}</h3>
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
            {!isLoading && filteredPlaces.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showingFrom={showingFrom}
                showingTo={showingTo}
                totalItems={filteredPlaces.length}
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
