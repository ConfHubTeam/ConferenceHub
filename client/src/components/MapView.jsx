import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import CloudinaryImage from "./CloudinaryImage";
import { useCurrency } from "../contexts/CurrencyContext";
import { formatPrice } from "../utils/currencyUtils";
import PriceDisplay from "./PriceDisplay";
import { 
  getMarkerSizeByZoom, 
  getMarkerSizeConfig, 
  getMarkerGoogleMapsProperties 
} from "../utils/markerSizeUtils";
import { drawMarkerShape, drawPriceText } from "../utils/canvasUtils";

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

export default function MapView({ places, disableInfoWindow = false }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const markersRef = useRef([]);
  const isUpdatingMarkersRef = useRef(false);
  const { selectedCurrency } = useCurrency();
  
  // Create a custom price marker icon with current currency
  const createPriceMarkerIcon = useCallback(async (price, currency, size = "medium") => {
    // Format the price with the current currency
    let formattedPrice;
    
    try {
      formattedPrice = await formatPrice(price, currency, selectedCurrency);
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
    
    // Get size configuration from utility
    const sizeConfig = getMarkerSizeConfig(size);
    let { width: baseWidth, height: baseHeight, fontSize, borderRadius } = sizeConfig;
    
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
    drawMarkerShape(context, baseWidth, baseHeight, borderRadius);
    
    // Draw the price text using extracted utility
    drawPriceText(context, formattedPrice, baseWidth, baseHeight, fontSize);
    
    // Convert canvas to image URL with maximum quality
    return canvas.toDataURL("image/png", 1.0);
  }, [selectedCurrency]);

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
  }, [selectedCurrency]);  // Create markers function that can be reused
  const createMarkersAsync = useCallback(async (map) => {
    // Create new bounds object to fit all markers
    const bounds = new window.google.maps.LatLngBounds();
    
    // Group places by position to detect overlapping markers
    const positionGroups = new Map(); // Group markers by position
    
    // First pass: group places by position
    for (const place of places) {
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
              
              // Zoom in closer when marker is clicked for better user experience
              const currentZoom = map.getZoom();
              const targetZoom = Math.min(16, currentZoom + 2); // Zoom in by 2 levels, up to max of 16
              map.setZoom(targetZoom);
              map.panTo(marker.getPosition()); // Center map on the clicked marker
            }
          });
          
          markers.push(marker);
        } catch (error) {
          console.error("Error creating marker:", error);
        }
      }
    }
    
    return { markers: markers.filter(Boolean), bounds };
  }, [places, disableInfoWindow, createPriceMarkerIcon]);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    // Cleanup markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }
    // Reset updating flag
    isUpdatingMarkersRef.current = false;
    setMap(null);
  }, []);

  // Update markers when places change (but not currency)
  useEffect(() => {
    if (!map || !places.length) return;

    // Clear existing markers first
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    isUpdatingMarkersRef.current = false; // Reset flag when clearing markers

    // Create new markers
    createMarkersAsync(map).then(({ markers, bounds }) => {
      markersRef.current = markers;
      
      // Fit map to bounds if we have markers
      if (markers.length > 0) {
        map.fitBounds(bounds);
        
        // Add a one-time listener to adjust zoom after bounds are set
        const boundsChangedListener = map.addListener('bounds_changed', () => {
          const zoom = map.getZoom();
          
          // If zoom is too close (higher than 13), set it back to city level
          if (zoom > 13) {
            map.setZoom(13);
          }
          
          // Remove this listener after first use
          window.google.maps.event.removeListener(boundsChangedListener);
        });
      }
    });
  }, [map, places, createMarkersAsync]);

  // Update marker icons when currency changes (without recreating markers)
  useEffect(() => {
    if (!markersRef.current.length || !selectedCurrency || isUpdatingMarkersRef.current) return;

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

  // Listen for zoom changes to update marker sizes
  useEffect(() => {
    if (!map) return;
    
    // Add listener for zoom changes
    const zoomListener = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      updateMarkerSizes(zoom);
    });
    
    // Cleanup listener on unmount
    return () => {
      if (zoomListener) {
        window.google.maps.event.removeListener(zoomListener);
      }
    };
  }, [map, updateMarkerSizes]);

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
    <div className="h-full">
      <style>{infoWindowStyles}</style>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
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
          zoomControl: false // Removed zoom control
        }}
      >
        {/* Info Window for selected place - only show if not disabled */}
        {selectedPlace && !disableInfoWindow && (
          <InfoWindow
            position={{ lat: parseFloat(selectedPlace.lat), lng: parseFloat(selectedPlace.lng) }}
            onCloseClick={() => setSelectedPlace(null)}
            options={{
              maxWidth: 250,
              pixelOffset: new window.google.maps.Size(0, -45),
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
}