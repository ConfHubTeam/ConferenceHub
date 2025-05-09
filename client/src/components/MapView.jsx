import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import CloudinaryImage from "./CloudinaryImage";

// Custom styles to hide the InfoWindow close button
const infoWindowStyles = `
  .gm-ui-hover-effect {
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

export default function MapView({ places }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const markersRef = useRef([]);

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Create a custom price marker icon
  const createPriceMarkerIcon = (price, size = 'medium') => {
    const formattedPrice = formatPrice(price);
    
    // Create a canvas element to draw the custom marker with higher DPI
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Device pixel ratio for high DPI screens
    const dpr = window.devicePixelRatio || 1;
    
    // Size configurations based on the requested size
    let baseWidth, baseHeight, fontSize, borderRadius;
    
    switch (size) {
      case 'small':
        baseWidth = 50; // Reduced from 70
        baseHeight = 28; // Reduced from 40
        fontSize = 11; // Reduced from 13
        borderRadius = 5; // Reduced from 6
        break;
      case 'large':
        baseWidth = 70; // Reduced from 95
        baseHeight = 40; // Reduced from 52
        fontSize = 15; // Reduced from 18
        borderRadius = 8; // Reduced from 10
        break;
      case 'medium':
      default:
        baseWidth = 60; // Reduced from 80
        baseHeight = 35; // Reduced from 46
        fontSize = 13; // Reduced from 15
        borderRadius = 6; // Reduced from 8
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
    context.imageSmoothingQuality = 'high';
    
    // Draw hexagon shape
    const hexHeight = baseHeight * 0.72;
    const hexWidth = baseWidth * 0.9;
    const startX = (baseWidth - hexWidth) / 2;
    const startY = 0;
    const pointHeight = baseHeight - hexHeight;
    
    // Add shadow
    context.shadowColor = 'rgba(0, 0, 0, 0.3)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;
    
    // Create hexagon path
    context.beginPath();
    // Top left corner
    context.moveTo(startX + borderRadius, startY);
    // Top side
    context.lineTo(startX + hexWidth - borderRadius, startY);
    // Top right corner
    context.arcTo(startX + hexWidth, startY, startX + hexWidth, startY + borderRadius, borderRadius);
    // Right side
    context.lineTo(startX + hexWidth, startY + hexHeight - borderRadius);
    // Bottom right corner
    context.arcTo(startX + hexWidth, startY + hexHeight, startX + hexWidth - borderRadius, startY + hexHeight, borderRadius);
    // Bottom side to pointer start
    context.lineTo(startX + (hexWidth * 0.55), startY + hexHeight);
    // Pointer
    context.lineTo(baseWidth / 2, baseHeight);
    context.lineTo(startX + (hexWidth * 0.45), startY + hexHeight);
    // Bottom side from pointer end
    context.lineTo(startX + borderRadius, startY + hexHeight);
    // Bottom left corner
    context.arcTo(startX, startY + hexHeight, startX, startY + hexHeight - borderRadius, borderRadius);
    // Left side
    context.lineTo(startX, startY + borderRadius);
    // Top left corner
    context.arcTo(startX, startY, startX + borderRadius, startY, borderRadius);
    
    // Fill with gradient
    const gradient = context.createLinearGradient(0, 0, 0, hexHeight);
    gradient.addColorStop(0, '#ff385c');
    gradient.addColorStop(1, '#e31c5f');
    context.fillStyle = gradient;
    context.fill();
    
    // Reset shadow for text
    context.shadowColor = 'transparent';
    
    // Add price text
    context.fillStyle = 'white';
    context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(formattedPrice, baseWidth / 2, hexHeight / 2);
    
    // Convert canvas to image URL with maximum quality
    return canvas.toDataURL('image/png', 1.0);
  };

  // Update marker icons based on zoom level
  const updateMarkerSizes = (zoomLevel) => {
    if (!markersRef.current.length) return;
    
    // Determine size based on zoom level
    let size;
    if (zoomLevel <= 10) {
      size = 'small';
    } else if (zoomLevel >= 14) {
      size = 'large';
    } else {
      size = 'medium';
    }
    
    // Update each marker's icon
    markersRef.current.forEach(marker => {
      const place = marker.placeData;
      marker.setIcon({
        url: createPriceMarkerIcon(place.price, size),
        anchor: new window.google.maps.Point(
          size === 'small' ? 25 : size === 'large' ? 35 : 30, 
          size === 'small' ? 28 : size === 'large' ? 40 : 35
        ),
        scaledSize: new window.google.maps.Size(
          size === 'small' ? 50 : size === 'large' ? 70 : 60,
          size === 'small' ? 28 : size === 'large' ? 40 : 35
        )
      });
    });
  };

  const onLoad = useCallback(function callback(map) {
    // Create new bounds object to fit all markers
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add markers to the map
    markersRef.current = places.map(place => {
      // Skip places without proper coordinates
      if (!place.lat || !place.lng) return null;
      
      const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
      
      // Extend bounds to include this marker
      bounds.extend(position);
      
      // Create custom marker with price label
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: place.title,
        placeData: place,
        // Create a custom icon with price, sized based on initial zoom
        icon: {
          url: createPriceMarkerIcon(place.price, map.getZoom() <= 10 ? 'small' : map.getZoom() >= 14 ? 'large' : 'medium'),
          // Position the anchor at the bottom tip of the pointer
          anchor: new window.google.maps.Point(
            map.getZoom() <= 10 ? 25 : map.getZoom() >= 14 ? 35 : 30, 
            map.getZoom() <= 10 ? 28 : map.getZoom() >= 14 ? 40 : 35
          ),
          // Set size to match the canvas dimensions
          scaledSize: new window.google.maps.Size(
            map.getZoom() <= 10 ? 50 : map.getZoom() >= 14 ? 70 : 60,
            map.getZoom() <= 10 ? 28 : map.getZoom() >= 14 ? 40 : 35
          )
        },
        animation: window.google.maps.Animation.DROP
      });
      
      // Add click event to marker
      marker.addListener("click", () => {
        setSelectedPlace(marker.placeData);
      });
      
      return marker;
    }).filter(Boolean); // Filter out any null values
    
    // Only adjust bounds if we have markers
    if (markersRef.current.length > 0) {
      map.fitBounds(bounds);
      
      // Add a zoom changed listener to ensure we don't zoom in too close
      const zoomChangedListener = map.addListener('bounds_changed', () => {
        // Get current zoom level
        const zoom = map.getZoom();
        
        // If zoom is too close (higher than 13), set it back to city level
        if (zoom > 13) {
          map.setZoom(13);
        }
        
        // Update marker sizes based on zoom level
        updateMarkerSizes(zoom);
        
        // Only need to run this once after initial bounds fitting
        window.google.maps.event.removeListener(zoomChangedListener);
      });
    }
    
    setMap(map);
  }, [places]);

  const onUnmount = useCallback(function callback() {
    // Cleanup markers
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = [];
    }
    setMap(null);
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (map) {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      
      // Create new bounds object
      const bounds = new window.google.maps.LatLngBounds();
      
      // Create new markers
      markersRef.current = places.map(place => {
        if (!place.lat || !place.lng) return null;
        
        const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
        
        // Extend bounds to include this marker
        bounds.extend(position);
        
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: place.title,
          placeData: place,
          // Create a custom icon with price, sized based on initial zoom
          icon: {
            url: createPriceMarkerIcon(place.price, map.getZoom() <= 10 ? 'small' : map.getZoom() >= 14 ? 'large' : 'medium'),
            // Position the anchor at the bottom tip of the pointer
            anchor: new window.google.maps.Point(
              map.getZoom() <= 10 ? 25 : map.getZoom() >= 14 ? 35 : 30, 
              map.getZoom() <= 10 ? 28 : map.getZoom() >= 14 ? 40 : 35
            ),
            // Set size to match the canvas dimensions
            scaledSize: new window.google.maps.Size(
              map.getZoom() <= 10 ? 50 : map.getZoom() >= 14 ? 70 : 60,
              map.getZoom() <= 10 ? 28 : map.getZoom() >= 14 ? 40 : 35
            )
          },
          animation: window.google.maps.Animation.DROP
        });
        
        marker.addListener("click", () => {
          setSelectedPlace(marker.placeData);
        });
        
        return marker;
      }).filter(Boolean);
      
      // Fit map to bounds if we have markers
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
      }
    }
  }, [places, map]);

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
  }, [map]);

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
        onClick={() => setSelectedPlace(null)}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP
          }
        }}
      >
        {/* Info Window for selected place */}
        {selectedPlace && (
          <InfoWindow
            position={{ lat: parseFloat(selectedPlace.lat), lng: parseFloat(selectedPlace.lng) }}
            onCloseClick={() => setSelectedPlace(null)}
            options={{
              maxWidth: 250,
              pixelOffset: new window.google.maps.Size(0, -30),
              disableAutoPan: false
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
                  <p className="text-xs font-bold mt-1">
                    {formatPrice(selectedPlace.price)}
                    <span className="text-gray-500 font-normal"> / hour</span>
                  </p>
                </div>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}