import { useCallback, useEffect, useRef, useState, useMemo, memo, useImperativeHandle, forwardRef } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CloudinaryImage from "./CloudinaryImage";
import FavoriteButton from "./FavoriteButton";
import { useCurrency } from "../contexts/CurrencyContext";
import { useMap } from "../contexts/MapContext";
import { formatPrice, formatUZSShort, convertCurrency } from "../utils/currencyUtils";
import PriceDisplay from "./PriceDisplay";
import { 
  getMarkerSizeByZoom, 
  getMarkerSizeConfig, 
  getMarkerGoogleMapsProperties 
} from "../utils/markerSizeUtils";
import { drawMarkerShape, drawPriceText } from "../utils/canvasUtils";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { setMarkerClusterer, clearMarkerClusterer } from "../utils/markerClustererRef";
import { getClusterOptions } from "../utils/clusterRenderer";
import { useMapTouchHandler } from "../hooks/useMapTouchHandler";
import { useMapFocus } from "../hooks/useMapFocus";
import { DEFAULT_MAP_CONFIG } from "../utils/regionConstants.js";

// Custom styles to hide the InfoWindow close button and arrow
const infoWindowStyles = `
  .gm-ui-hover-effect {
    display: none !important;
  }
  .gm-style .gm-style-iw-tc::after {
    display: none !important;
  }
  .gm-style .gm-style-iw-tc {
    display: none !important;
  }
  .gm-style .gm-style-iw-t::after {
    display: none !important;
  }
  .gm-style .gm-style-iw-c {
    padding: 0 !important;
  }
  .gm-style .gm-style-iw-d {
    overflow: hidden !important;
  }
  .gm-style .gm-style-iw {
    padding-top: 0 !important;
  }
  .gm-style .gm-style-iw-ch {
    padding-top: 0 !important;
  }
`;

// Simplified Map Image Quad Component (only for 4+ images)
const MapImageQuad = ({ photos, title }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Single main image */}
      <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <CloudinaryImage
          photo={photos[0]}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Four images in 2x2 grid */}
      <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
          {photos.slice(0, 4).map((photo, index) => (
            <div key={index} className="relative overflow-hidden">
              <CloudinaryImage
                photo={photo}
                alt={`${title} - Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Get Google Maps API key from environment variables with fallback
// This prevents runtime errors if the env variable is missing
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Check if API key is available and log warning if missing
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key is missing. Please check your .env file and ensure VITE_GOOGLE_MAPS_API_KEY is set.');
}

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center position (Tashkent, Uzbekistan) - using consistent coordinates
const defaultCenter = DEFAULT_MAP_CONFIG.center;

// Define libraries as a constant outside the component to prevent recreation on each render
const libraries = ['places'];

const MapView = memo(forwardRef(function MapView({ 
  places, 
  disableInfoWindow = false, 
  hoveredPlaceId = null, 
  onBoundsChanged = null,
  onMapReady = null
}, ref) {
  const { t } = useTranslation("places");
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const markersRef = useRef([]);
  const isUpdatingMarkersRef = useRef(false);
  const highlightedMarkerRef = useRef(null);
  const { selectedCurrency } = useCurrency();
  
  // Initialize map focus hook
  const {
    focusOnCoordinates,
    focusOnRegion,
    resetToDefault,
    getOptimalZoom,
    isAnimating,
    cancelFocus,
    isReady: isFocusReady
  } = useMapFocus(map);
  
  // Use MapContext if available, otherwise use defaults
  let saveMapState, getMapState;
  try {
    const mapContext = useMap();
    saveMapState = mapContext.saveMapState;
    getMapState = mapContext.getMapState;
  } catch (error) {
    // If MapProvider is not available, use no-op functions
    saveMapState = () => {};
    getMapState = () => ({ zoom: DEFAULT_MAP_CONFIG.zoom, center: DEFAULT_MAP_CONFIG.center, bounds: null });
  }
  
  // Store previous zoom level in ref to persist across unmounts
  const previousZoomRef = useRef(12);
  // Track zoom level to maintain consistency when map is toggled
  const [currentZoom, setCurrentZoom] = useState(12);
  
  // Use the custom touch handler hook
  const { mapContainerRef } = useMapTouchHandler();
  
  // Memoize the places data to prevent unnecessary marker recreation
  const memoizedPlaces = useMemo(() => places, [places]);
  
  // Store current currency in a ref to ensure consistency across all marker updates
  const currentCurrencyRef = useRef(selectedCurrency);
  
  // Update currency ref whenever selectedCurrency changes
  useEffect(() => {
    currentCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency]);
  
  // Create a custom price marker icon with current currency
  const createPriceMarkerIcon = useCallback(async (price, currency, size = "medium", isHighlighted = false, isHovered = false) => {
    // Format the price with the current currency from ref to ensure consistency
    let formattedPrice;
    
    try {
      // Use currency from ref to ensure we have the latest value
      const currentCurrency = currentCurrencyRef.current;
      
      // Check if we need to convert currency first
      if (currentCurrency && currency && currentCurrency.charCode !== currency.charCode) {
        // Convert to selected currency first
        const fromCode = currency?.charCode || currency;
        const toCode = currentCurrency?.charCode;
        const convertedPrice = await convertCurrency(price, fromCode, toCode);
        
        // Use shorter format for UZS currency on map markers
        if (currentCurrency.charCode === 'UZS') {
          formattedPrice = formatUZSShort(convertedPrice, t);
        } else {
          formattedPrice = await formatPrice(convertedPrice, currentCurrency, currentCurrency);
        }
      } else {
        // Use original currency
        const currencyCode = currency?.charCode || currency;
        
        // Use shorter format for UZS currency on map markers
        if (currencyCode === 'UZS') {
          formattedPrice = formatUZSShort(price, t);
        } else {
          formattedPrice = await formatPrice(price, currency, currentCurrency);
        }
      }
    } catch (error) {
      console.error("Error formatting price for marker:", error);
      // Fallback to simple format
      formattedPrice = `$${price}`;
    }
    
    // Create a canvas element to draw the custom marker with higher DPI
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    // Device pixel ratio for high DPI screens
    const dpr = window.devicePixelRatio || 1;
    
    // Get size configuration from utility, increase size for highlighted markers
    const sizeConfig = getMarkerSizeConfig(size);
    let { width: baseWidth, height: baseHeight, fontSize, borderRadius } = sizeConfig;
    
    // If highlighted, increase size by 10% for subtle emphasis
    if (isHighlighted) {
      baseWidth = Math.round(baseWidth * 1.1);
      baseHeight = Math.round(baseHeight * 1.1);
      fontSize = Math.round(fontSize * 1.05); // Slight font increase
    }
    
    // Calculate text width to dynamically adjust marker width if needed
    context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    const textMetrics = context.measureText(formattedPrice);
    const initialTextWidth = textMetrics.width;
    
    // Add some padding around the text
    const paddingHorizontal = 16;
    const minWidth = initialTextWidth + paddingHorizontal;
    
    // If the text is wider than our base width, increase the width
    // For very long text (like some currencies with many zeros), cap the width and reduce font later
    if (minWidth > baseWidth) {
      // Cap the maximum width to prevent extremely wide markers
      const maxWidth = baseWidth * 1.7; // Limit maximum width to 1.7x the base width
      baseWidth = Math.min(Math.ceil(minWidth), maxWidth);
    }
    
    // Set canvas dimensions accounting for device pixel ratio
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    
    // Scale all drawing operations by the device pixel ratio
    context.scale(dpr, dpr);
    
    // Set canvas CSS dimensions to maintain visual size
    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;
    
    // Apply anti-aliasing
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    
    // Draw the marker shape using extracted utility
    drawMarkerShape(context, baseWidth, baseHeight, borderRadius, isHighlighted, isHovered);
    
    // Draw the price text using extracted utility
    drawPriceText(context, formattedPrice, baseWidth, baseHeight, fontSize);
    
    // Convert canvas to image URL with maximum quality
    return canvas.toDataURL("image/png", 1.0);
  }, []); // Remove selectedCurrency dependency since we use currentCurrencyRef

  // Update marker icons based on zoom level (without repositioning)
  const updateMarkerSizes = useCallback(async (zoomLevel) => {
    if (!markersRef.current.length || isUpdatingMarkersRef.current) return;
    
    isUpdatingMarkersRef.current = true;
    
    try {
      // Determine size based on zoom level using utility function
      const size = getMarkerSizeByZoom(zoomLevel);
      
      // Update each marker's icon without changing positions
      for (const marker of markersRef.current) {
        try {
          const place = marker.placeData;
          const iconUrl = await createPriceMarkerIcon(place.price, place.currency, size);
          const markerProps = getMarkerGoogleMapsProperties(size);
          
          marker.setIcon({
            url: iconUrl,
            anchor: markerProps.anchor,
            scaledSize: markerProps.scaledSize
          });
        } catch (error) {
          console.error("Error updating marker icon:", error);
        }
      }
    } finally {
      isUpdatingMarkersRef.current = false;
    }
  }, [createPriceMarkerIcon]); // Remove selectedCurrency dependency  // Update the createMarkersAsync to use memoizedPlaces
  const createMarkersAsync = useCallback(async (map) => {
    // Create new bounds object to fit all markers
    const bounds = new window.google.maps.LatLngBounds();
    
    // Group places by position to detect overlapping markers
    const positionGroups = new Map(); // Group markers by position
    
    // First pass: group places by position
    for (const place of memoizedPlaces) {
      if (!place.lat || !place.lng) continue;
      
      const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
      const posKey = `${position.lat.toFixed(5)},${position.lng.toFixed(5)}`;
      
      if (!positionGroups.has(posKey)) {
        positionGroups.set(posKey, []);
      }
      positionGroups.get(posKey).push({ place, position: {...position} });
      
      // Extend bounds for all positions
      bounds.extend(position);
    }
    
    const markers = [];
    
    // Second pass: create markers with adjusted positions for overlaps
    for (const [posKey, placesAtPosition] of positionGroups.entries()) {
      // Offset markers that are at the same position
      if (placesAtPosition.length > 1) {
        const offsetStep = 0.00015; // Small lat/lng offset
        
        placesAtPosition.forEach((item, index) => {
          if (index > 0) { // First marker stays at original position
            const offsetAngle = (Math.PI * 2 / placesAtPosition.length) * index;
            
            // Create a small offset in a circular pattern
            item.position.lat += Math.sin(offsetAngle) * offsetStep;
            item.position.lng += Math.cos(offsetAngle) * offsetStep;
          }
        });
      }

      // Create markers with potentially adjusted positions
      for (const { place, position } of placesAtPosition) {
        try {
          // Generate marker icon with price in current currency
          const size = getMarkerSizeByZoom(map.getZoom());
          const iconUrl = await createPriceMarkerIcon(place.price, place.currency, size);
          const markerProps = getMarkerGoogleMapsProperties(size);
          
          // Create custom marker with price label
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: place.title,
            placeData: place,
            icon: {
              url: iconUrl,
              // Position the anchor at the bottom tip of the pointer
              anchor: markerProps.anchor,
              // Set size to match the canvas dimensions
              scaledSize: markerProps.scaledSize
            }
            // No animation for smooth appearance in place
          });
          
          // Add click event to marker
          marker.addListener("click", (event) => {
            // Stop event propagation to prevent map click
            event.stop();
            
            // Only set selected place if info windows are not disabled
            if (!disableInfoWindow) {
              setSelectedPlace(marker.placeData);
              // Removed auto-zoom and auto-center for smooth user experience
              // Users can control the map zoom and position naturally
            }
          });

          // Add hover events to marker for immediate visual feedback
          marker.addListener("mouseover", () => {
            const place = marker.placeData;
            const currentZoom = map?.getZoom() || 12;
            const size = getMarkerSizeByZoom(currentZoom);
            
            // Create hovered icon with isHovered = true
            createPriceMarkerIcon(place.price, place.currency, size, false, true)
              .then(iconUrl => {
                const markerProps = getMarkerGoogleMapsProperties(size);
                marker.setIcon({
                  url: iconUrl,
                  anchor: markerProps.anchor,
                  scaledSize: markerProps.scaledSize
                });
                marker.setZIndex(999); // Bring to front on hover
              })
              .catch(error => console.error("Error setting hover marker icon:", error));
          });

          marker.addListener("mouseout", () => {
            const place = marker.placeData;
            const currentZoom = map?.getZoom() || 12;
            const size = getMarkerSizeByZoom(currentZoom);
            
            // Restore normal icon with isHovered = false
            createPriceMarkerIcon(place.price, place.currency, size, false, false)
              .then(iconUrl => {
                const markerProps = getMarkerGoogleMapsProperties(size);
                marker.setIcon({
                  url: iconUrl,
                  anchor: markerProps.anchor,
                  scaledSize: markerProps.scaledSize
                });
                marker.setZIndex(1); // Reset z-index
              })
              .catch(error => console.error("Error resetting marker icon:", error));
          });
          
          markers.push(marker);
        } catch (error) {
          console.error("Error creating marker:", error);
        }
      }
    }
    
    return { markers: markers.filter(Boolean), bounds };
  }, [memoizedPlaces, disableInfoWindow, createPriceMarkerIcon]);

  const onLoad = useCallback(function callback(map) {
    // Prioritize saved zoom level from context, then from ref, then default
    const mapState = getMapState();
    const savedZoom = mapState.zoom;
    const refZoom = previousZoomRef.current;
    const zoomToSet = savedZoom !== 12 ? savedZoom : (refZoom !== 12 ? refZoom : 12);
    
    map.setZoom(zoomToSet);
    setCurrentZoom(zoomToSet);
    previousZoomRef.current = zoomToSet; // Sync ref with set zoom
    
    // If we have a saved center, use it, otherwise use default
    if (mapState.center && (mapState.center.lat !== DEFAULT_MAP_CONFIG.center.lat || mapState.center.lng !== DEFAULT_MAP_CONFIG.center.lng)) {
      map.setCenter(mapState.center);
    } else {
      map.setCenter(defaultCenter);
    }
    
    // Add single listener for zoom changes to handle both state and marker updates
    const zoomListener = map.addListener('zoom_changed', () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      previousZoomRef.current = newZoom; // Store zoom level in ref
      updateMarkerSizes(newZoom);
      
      // Save map state for persistence
      if (saveMapState) {
        saveMapState(map);
      }
    });
    
    // Add bounds change listener to notify parent when map viewport changes
    const boundsListener = map.addListener('bounds_changed', () => {
      // Save map state more frequently to ensure state persistence
      if (saveMapState) {
        saveMapState(map);
      }
      
      if (onBoundsChanged) {
        const bounds = map.getBounds();
        if (bounds) {
          onBoundsChanged(bounds);
        }
      }
    });
    
    // Store the listeners for cleanup
    map._zoomListener = zoomListener;
    map._boundsListener = boundsListener;
    
    // Immediately trigger bounds change callback after map loads
    if (onBoundsChanged) {
      // Use a small timeout to ensure map is fully initialized
      setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds) {
          onBoundsChanged(bounds);
        }
      }, 100);
    }
    
    setMap(map);
  }, [updateMarkerSizes, getMapState, saveMapState, onBoundsChanged]);

  const onUnmount = useCallback(function callback(map) {
    // Cleanup zoom listener if it exists
    if (map && map._zoomListener) {
      window.google.maps.event.removeListener(map._zoomListener);
    }
    
    // Cleanup bounds listener if it exists
    if (map && map._boundsListener) {
      window.google.maps.event.removeListener(map._boundsListener);
    }
    
    // Cleanup markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }
    
    // Clear clusterer
    clearMarkerClusterer();
    
    // Reset updating flag and highlighted marker ref
    isUpdatingMarkersRef.current = false;
    highlightedMarkerRef.current = null;
    
    setMap(null);
  }, []);
  
  // Update markers when places change (but not currency)
  useEffect(() => {
    if (!map) return;

    // Always clear existing markers first
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    isUpdatingMarkersRef.current = false; // Reset flag when clearing markers
    highlightedMarkerRef.current = null; // Reset highlighted marker ref

    // Clear previous clusterer
    clearMarkerClusterer();

    // If no places, just return after clearing markers (this handles empty filtered results)
    if (!memoizedPlaces.length) return;

    // Create new markers
    createMarkersAsync(map).then(({ markers, bounds }) => {
      markersRef.current = markers;

      // Add marker clustering with custom reddish theme
      if (markers.length > 0) {
        const clusterOptions = getClusterOptions();
        const clusterer = new MarkerClusterer({ 
          markers, 
          map,
          ...clusterOptions
        });
        setMarkerClusterer(clusterer);
      }

      // Note: Automatic bounds fitting removed to maintain user's selected region focus
      // The map will maintain its current focus and not try to fit all markers automatically
    });
  }, [map, memoizedPlaces, createMarkersAsync]);

  // Handle marker highlighting when hoveredPlaceId changes
  useEffect(() => {
    if (!markersRef.current.length) return;
    
    // If hovering over the same place, don't do anything
    if (highlightedMarkerRef.current && hoveredPlaceId === highlightedMarkerRef.current.placeData.id) {
      return;
    }
    
    // Reset previous highlighted marker if any
    if (highlightedMarkerRef.current) {
      const prevMarker = highlightedMarkerRef.current;
      const place = prevMarker.placeData;
      const currentZoom = map?.getZoom() || 12;
      const size = getMarkerSizeByZoom(currentZoom);
      
      // Restore normal icon
      createPriceMarkerIcon(place.price, place.currency, size, false)
        .then(iconUrl => {
          const markerProps = getMarkerGoogleMapsProperties(size);
          prevMarker.setIcon({
            url: iconUrl,
            anchor: markerProps.anchor,
            scaledSize: markerProps.scaledSize
          });
          prevMarker.setZIndex(1); // Reset z-index
        })
        .catch(error => console.error("Error resetting marker icon:", error));
    }
    
    // Find and highlight new marker if hoveredPlaceId is provided
    if (hoveredPlaceId) {
      const markerToHighlight = markersRef.current.find(
        marker => marker.placeData.id === hoveredPlaceId
      );
      
      if (markerToHighlight) {
        const place = markerToHighlight.placeData;
        const currentZoom = map?.getZoom() || 12;
        const size = getMarkerSizeByZoom(currentZoom);
        
        // Create highlighted icon
        createPriceMarkerIcon(place.price, place.currency, size, true)
          .then(iconUrl => {
            const markerProps = getMarkerGoogleMapsProperties(size);
            // For highlighted markers, scale up the size slightly for subtle emphasis
            const highlightedSize = new window.google.maps.Size(
              markerProps.scaledSize.width * 1.1,
              markerProps.scaledSize.height * 1.1
            );
            
            markerToHighlight.setIcon({
              url: iconUrl,
              anchor: markerProps.anchor,
              scaledSize: highlightedSize
            });
            markerToHighlight.setZIndex(1000); // Bring to front
          })
          .catch(error => console.error("Error highlighting marker icon:", error));
        
        highlightedMarkerRef.current = markerToHighlight;
      }
    } else {
      highlightedMarkerRef.current = null;
    }
  }, [hoveredPlaceId, createPriceMarkerIcon, map]);

  // Update marker icons when currency changes (without recreating markers)
  useEffect(() => {
    if (!markersRef.current.length || !currentCurrencyRef.current || isUpdatingMarkersRef.current) return;

    const updateMarkerIcons = async () => {
      isUpdatingMarkersRef.current = true;
      
      try {
        const currentZoom = map?.getZoom() || 12;
        const size = getMarkerSizeByZoom(currentZoom);

        for (const marker of markersRef.current) {
          try {
            const place = marker.placeData;
            const iconUrl = await createPriceMarkerIcon(place.price, place.currency, size);
            const markerProps = getMarkerGoogleMapsProperties(size);
            
            marker.setIcon({
              url: iconUrl,
              anchor: markerProps.anchor,
              scaledSize: markerProps.scaledSize
            });
          } catch (error) {
            console.error("Error updating marker icon:", error);
          }
        }
      } finally {
        isUpdatingMarkersRef.current = false;
      }
    };

    updateMarkerIcons();
  }, [selectedCurrency, createPriceMarkerIcon, map]);

  // Expose map focus methods through ref
  useImperativeHandle(ref, () => ({
    focusOnCoordinates,
    focusOnRegion,
    resetToDefault,
    getOptimalZoom,
    isAnimating,
    cancelFocus,
    isFocusReady,
    mapInstance: map
  }), [focusOnCoordinates, focusOnRegion, resetToDefault, getOptimalZoom, isAnimating, cancelFocus, isFocusReady, map]);

  // Notify parent when map is ready
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Error state handling
  if (loadError) {
    // Check for specific error types to provide better guidance
    let errorTitle = "Map Error";
    let errorMessage = "There was a problem loading Google Maps. Please check your API key or try again later.";

    if (loadError.message.includes("InvalidKeyMapError") || loadError.message.includes("MissingKeyMapError")) {
      errorTitle = "API Key Error";
      errorMessage = "The Google Maps API key is invalid or missing. Please check your environment variables and ensure the key is correct.";
    } else if (loadError.message.includes("ApiNotActivatedMapError")) {
      errorTitle = "API Not Activated";
      errorMessage = "The Maps JavaScript API is not activated on your API project. Please enable it in the Google Cloud Console.";
    } else if (loadError.message.includes("RefererDeniedMapError")) {
      errorTitle = "Referer Restriction Error";
      errorMessage = "Your API key has referer restrictions that are preventing access. Add this site to the allowed referers in the Google Cloud Console.";
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{errorTitle}</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {loadError.message}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Google Maps API errors: <a href="https://developers.google.com/maps/documentation/javascript/error-messages" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">Error Documentation</a></p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full map-container" ref={mapContainerRef}>
      <style>{infoWindowStyles}</style>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={currentZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(event) => {
          // Close InfoWindow when clicking on empty map area
          setSelectedPlace(null);
        }}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false, // Removed zoom control
          gestureHandling: 'greedy', // Allow one-finger panning and two-finger zooming
          clickableIcons: false, // Prevent clicks on default POI icons
          keyboardShortcuts: false, // Disable keyboard shortcuts
          disableDoubleClickZoom: false, // Keep double-click zoom for desktop
          scrollwheel: true, // Enable scroll wheel zoom on desktop
          draggable: true, // Enable map dragging
          panControl: false, // Disable pan control
          rotateControl: false, // Disable rotate control
          scaleControl: false, // Disable scale control
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }] // Hide POI labels to reduce clutter
            }
          ]
        }}
      >
        {/* Info Window for selected place - only show if not disabled */}
        {selectedPlace && !disableInfoWindow && (
          <InfoWindow
            position={{ lat: parseFloat(selectedPlace.lat), lng: parseFloat(selectedPlace.lng) }}
            onCloseClick={() => setSelectedPlace(null)}
            options={{
              maxWidth: 280,
              pixelOffset: new window.google.maps.Size(0, -15),
              disableAutoPan: false,
              ariaLabel: selectedPlace.title
            }}
          >
            <Link to={`/place/${selectedPlace.id}`} className="block group" style={{ maxWidth: "260px" }}>
              {/* Image Section with Simplified Hover Logic */}
              {selectedPlace.photos?.length > 0 && (
                <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                  {selectedPlace.photos.length >= 4 ? (
                    /* Quad Chart for 4+ images */
                    <MapImageQuad photos={selectedPlace.photos} title={selectedPlace.title} />
                  ) : (
                    /* Single image for 1-3 images */
                    <CloudinaryImage 
                      photo={selectedPlace.photos[0]} 
                      alt={selectedPlace.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  )}
                  {/* Favorite Button Overlay - Only for clients */}
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteButton 
                      place={selectedPlace}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              )}
              
              {/* Content Section - Minimal styling, no card */}
              <div className="bg-white rounded-b-lg p-2">
                  {/* Rating and Guest Count Row */}
                  <div className="flex items-center justify-between mb-1">
                    {/* Rating display */}
                    {(selectedPlace.averageRating || selectedPlace.totalReviews > 0) ? (
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs font-medium text-gray-800">
                          {selectedPlace.averageRating ? 
                            `${selectedPlace.averageRating}${selectedPlace.totalReviews > 0 ? ` (${selectedPlace.totalReviews})` : ''}` :
                            t("places:card.new_rating")
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs font-medium text-gray-500">
                          {t("places:card.new_rating")}
                        </span>
                      </div>
                    )}
                    
                    {selectedPlace.maxGuests && (
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs text-gray-500">
                          {selectedPlace.maxGuests === 1 
                            ? t("places:card.up_to_guests_single", { count: selectedPlace.maxGuests })
                            : t("places:card.up_to_guests", { count: selectedPlace.maxGuests })
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-sm mb-1 truncate text-gray-800 line-clamp-1">
                    {selectedPlace.title}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-start text-xs text-gray-500 mb-1">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="line-clamp-1 leading-tight">{selectedPlace.address}</p>
                  </div>
                  
                  {/* Price */}
                  <div className="text-sm font-bold text-gray-900">
                    <PriceDisplay 
                      price={selectedPlace.price} 
                      currency={selectedPlace.currency} 
                      suffix={t("mapInfoWindow.perHour")}
                      priceClassName="text-sm font-bold text-gray-900" 
                      suffixClassName="text-gray-500 font-normal text-xs"
                      showOriginalPrice={true}
                      showConvertedPrice={true}
                    />
                  </div>
                </div>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}));

// Add memo with comparison function
const MemoizedMapView = memo(MapView, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.disableInfoWindow === nextProps.disableInfoWindow &&
    prevProps.hoveredPlaceId === nextProps.hoveredPlaceId &&
    prevProps.onBoundsChanged === nextProps.onBoundsChanged &&
    prevProps.onMapReady === nextProps.onMapReady &&
    prevProps.places.length === nextProps.places.length &&
    prevProps.places.every((place, index) => 
      place.id === nextProps.places[index]?.id &&
      place.price === nextProps.places[index]?.price &&
      place.currency?.charCode === nextProps.places[index]?.currency?.charCode
    )
  );
});

export default MemoizedMapView;