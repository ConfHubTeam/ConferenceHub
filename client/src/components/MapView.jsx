import { useCallback, useEffect, useRef, useState, useMemo, memo } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import CloudinaryImage from "./CloudinaryImage";
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
`;

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

// Default center position (Tashkent, Uzbekistan)
const defaultCenter = {
  lat: 41.2995,
  lng: 69.2401
};

// Define libraries as a constant outside the component to prevent recreation on each render
const libraries = ['places'];

const MapView = memo(function MapView({ places, disableInfoWindow = false, hoveredPlaceId = null, onBoundsChanged = null }) {
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
  
  // Use MapContext if available, otherwise use defaults
  let saveMapState, getMapState;
  try {
    const mapContext = useMap();
    saveMapState = mapContext.saveMapState;
    getMapState = mapContext.getMapState;
  } catch (error) {
    // If MapProvider is not available, use no-op functions
    saveMapState = () => {};
    getMapState = () => ({ zoom: 12, center: { lat: 41.2995, lng: 69.2401 }, bounds: null });
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
  const createPriceMarkerIcon = useCallback(async (price, currency, size = "medium", isHighlighted = false) => {
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
          formattedPrice = formatUZSShort(convertedPrice);
        } else {
          formattedPrice = await formatPrice(convertedPrice, currentCurrency, currentCurrency);
        }
      } else {
        // Use original currency
        const currencyCode = currency?.charCode || currency;
        
        // Use shorter format for UZS currency on map markers
        if (currencyCode === 'UZS') {
          formattedPrice = formatUZSShort(price);
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
    drawMarkerShape(context, baseWidth, baseHeight, borderRadius, isHighlighted);
    
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
            },
            animation: window.google.maps.Animation.DROP
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
    
    console.log('MapView onLoad - Setting zoom to:', zoomToSet, { savedZoom, refZoom });
    
    map.setZoom(zoomToSet);
    setCurrentZoom(zoomToSet);
    previousZoomRef.current = zoomToSet; // Sync ref with set zoom
    
    // If we have a saved center, use it, otherwise use default
    if (mapState.center && (mapState.center.lat !== 41.2995 || mapState.center.lng !== 69.2401)) {
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
          console.log('MapView onLoad - Triggering initial bounds change');
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

  // Helper function to check if markers are in current view
  const areMarkersInCurrentView = useCallback((markers, map) => {
    if (!markers.length || !map) return false;
    
    const bounds = map.getBounds();
    if (!bounds) return false;
    
    // Check if at least 80% of markers are within the current view
    const visibleMarkers = markers.filter(marker => {
      const position = marker.getPosition();
      return bounds.contains(position);
    });
    
    const visibilityRatio = visibleMarkers.length / markers.length;
    return visibilityRatio >= 0.8; // At least 80% of markers should be visible
  }, []);

  // Track previous places to detect filter changes
  const previousPlacesRef = useRef([]);
  
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

    // Detect if this is a filter change (different places than before)
    const isFilterChange = previousPlacesRef.current.length !== memoizedPlaces.length ||
      !previousPlacesRef.current.every(prevPlace => 
        memoizedPlaces.some(place => place.id === prevPlace.id)
      );

    // Update the previous places reference
    previousPlacesRef.current = [...memoizedPlaces];

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

      // Auto-fit bounds for better UX in these scenarios:
      // 1. Filter change detected (always fit when filters are applied)
      // 2. Initial load with truly default state (no saved zoom and ref is default)
      // 3. When markers are outside current view (but only for filter changes)
      if (markers.length > 0) {
        const mapState = getMapState();
        const hasCustomZoom = mapState.zoom !== 12 || previousZoomRef.current !== 12;
        
        const shouldFitBounds = isFilterChange || 
                                (!hasCustomZoom && map.getZoom() === 12) || 
                                (isFilterChange && !areMarkersInCurrentView(markers, map));

        console.log('Auto-fit decision:', { 
          isFilterChange, 
          hasCustomZoom, 
          currentZoom: map.getZoom(), 
          shouldFitBounds 
        });

        if (shouldFitBounds) {
          // Fit bounds to show all filtered markers
          map.fitBounds(bounds);
          
          // Add a one-time listener to adjust zoom after bounds are set
          const boundsChangedListener = map.addListener('bounds_changed', () => {
            const zoom = map.getZoom();
            // If zoom is too close (higher than 15), set it back to reasonable level
            if (zoom > 15) {
              map.setZoom(15);
              previousZoomRef.current = 15; // Update ref
            } else {
              previousZoomRef.current = zoom; // Update ref with final zoom
            }
            // Remove this listener after first use
            window.google.maps.event.removeListener(boundsChangedListener);
          });
        }
      }
    });
  }, [map, memoizedPlaces, createMarkersAsync, areMarkersInCurrentView]);

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
              maxWidth: 250,
              pixelOffset: new window.google.maps.Size(0, -15),
              disableAutoPan: false,
              ariaLabel: selectedPlace.title
            }}
          >
            <div className="w-full" style={{ maxWidth: "230px" }}>
              <Link to={`/place/${selectedPlace.id}`} className="hover:opacity-90 block">
                {selectedPlace.photos?.length > 0 && (
                  <div className="h-24 w-full overflow-hidden rounded-t-lg">
                    <CloudinaryImage 
                      photo={selectedPlace.photos[0]} 
                      alt={selectedPlace.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="p-2">
                  <h3 className="font-semibold text-xs mb-1 truncate">{selectedPlace.title}</h3>
                  <p className="text-xs text-gray-500 break-words line-clamp-2">{selectedPlace.address}</p>
                  <div className="text-xs font-bold mt-1">
                    <PriceDisplay 
                      price={selectedPlace.price} 
                      currency={selectedPlace.currency} 
                      suffix=" / hour"
                      priceClassName="text-xs font-bold" 
                      suffixClassName="text-gray-500 font-normal"
                      showOriginalPrice={true}
                      showConvertedPrice={true}
                    />
                  </div>
                </div>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.disableInfoWindow === nextProps.disableInfoWindow &&
    prevProps.hoveredPlaceId === nextProps.hoveredPlaceId &&
    prevProps.onBoundsChanged === nextProps.onBoundsChanged &&
    prevProps.places.length === nextProps.places.length &&
    prevProps.places.every((place, index) => 
      place.id === nextProps.places[index]?.id &&
      place.price === nextProps.places[index]?.price &&
      place.currency?.charCode === nextProps.places[index]?.currency?.charCode
    )
  );
});

export default MapView;