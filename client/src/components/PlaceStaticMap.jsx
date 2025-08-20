import React, { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useTranslation } from "react-i18next";

// Get Google Maps API key from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  border: '1px solid #E2E4E9',
  overflow: 'hidden'
};

// Default map options for place details
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
  gestureHandling: 'cooperative',
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

/**
 * PlaceStaticMap Component
 * 
 * A static map component specifically for place details pages that centers
 * on the place's coordinates and shows a single marker for that location.
 * 
 * @param {Object} place - The place object with lat/lng coordinates
 * @param {string} place.lat - Latitude of the place
 * @param {string} place.lng - Longitude of the place
 * @param {string} place.title - Title of the place for accessibility
 * @param {string} place.address - Address of the place
 */
export default function PlaceStaticMap({ place }) {
  const { t } = useTranslation();
  const [map, setMap] = useState(null);

  // Handle marker click - open in map provider
  const handleMarkerClick = useCallback(() => {
    const { lat, lng } = {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lng)
    };
    
    // Try to open in Apple Maps first (iOS/macOS), then Google Maps
    const appleMapsUrl = `maps://maps.apple.com/?q=${lat},${lng}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    // Check if we're on iOS/macOS
    const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
    
    if (isAppleDevice) {
      // Try Apple Maps first
      const link = document.createElement('a');
      link.href = appleMapsUrl;
      link.click();
      
      // Fallback to Google Maps after a short delay if Apple Maps doesn't open
      setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 1000);
    } else {
      // Open Google Maps directly
      window.open(googleMapsUrl, '_blank');
    }
  }, [place]);

  // Map load callback
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    
    // Add marker using native Google Maps API
    const position = {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lng)
    };
    
    // Create custom icon SVG
    const customIcon = {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 24 16 40 16 40S32 24 32 16C32 7.16 24.84 0 16 0Z" fill="#1D2A50"/>
          <path d="M16 0C7.16 0 0 7.16 0 16C0 24 16 40 16 40S32 24 32 16C32 7.16 24.84 0 16 0Z" stroke="#ffffff" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#1D2A50"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(32, 40),
      anchor: new window.google.maps.Point(16, 40),
      origin: new window.google.maps.Point(0, 0)
    };

    // Create marker directly with Google Maps API
    const marker = new window.google.maps.Marker({
      position: position,
      map: mapInstance,
      title: place.title || place.address,
      clickable: true,
      icon: customIcon
    });
    
    // Add click event listener
    marker.addListener('click', () => {
      handleMarkerClick();
    });
    
  }, [place, handleMarkerClick]);

  // Map unmount callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"]
  });

  // Error handling
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-secondary rounded-lg">
        <div className="text-center">
          <svg className="w-12 h-12 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
          <p className="text-text-muted text-sm">{t('common:error.mapLoadFailed', 'Failed to load map')}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-secondary rounded-lg animate-pulse">
        <div className="text-center">
          <div className="w-12 h-12 bg-bg-card rounded-full mx-auto mb-2"></div>
          <div className="h-4 bg-bg-card rounded w-24 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Check if place has coordinates
  if (!place || !place.lat || !place.lng) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-secondary rounded-lg">
        <div className="text-center">
          <svg className="w-12 h-12 text-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-text-muted text-sm">{t('common:error.locationNotAvailable', 'Location not available')}</p>
        </div>
      </div>
    );
  }

  // Convert coordinates to numbers
  const center = {
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lng)
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Marker is created directly in onLoad using native Google Maps API */}
    </GoogleMap>
  );
}
