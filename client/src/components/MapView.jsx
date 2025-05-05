import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
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
  const [markerClusterer, setMarkerClusterer] = useState(null);
  const markersRef = useRef([]);

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Function to update marker visibility based on clusters
  const updateMarkerVisibility = () => {
    if (!map || !markerClusterer || !markersRef.current.length) return;

    // Get current clusters
    const clusters = markerClusterer.clusters;
    
    // Create a Set to keep track of markers that should be hidden (part of multi-marker clusters)
    const markersInClusters = new Set();
    
    // Identify markers that are in clusters with multiple markers
    clusters.forEach(cluster => {
      if (cluster.markers.length > 1) {
        // If cluster has multiple markers, add them to the hidden set
        cluster.markers.forEach(marker => {
          markersInClusters.add(marker);
        });
      }
    });
    
    // Update visibility for all markers - only hide those in multi-marker clusters
    markersRef.current.forEach(marker => {
      marker.setVisible(!markersInClusters.has(marker));
    });
  };

  const onLoad = useCallback(function callback(map) {
    // Create new bounds object to fit all markers
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add markers to the map but set them invisible initially
    markersRef.current = places.map(place => {
      // Skip places without proper coordinates
      if (!place.lat || !place.lng) return null;
      
      const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
      
      // Extend bounds to include this marker
      bounds.extend(position);
      
      return new window.google.maps.Marker({
        position,
        map,
        title: place.title,
        placeData: place,
        // Initially set all markers to invisible
        visible: false,
        animation: window.google.maps.Animation.DROP
      });
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
        
        // Only need to run this once after initial bounds fitting
        window.google.maps.event.removeListener(zoomChangedListener);
      });
    }
    
    // Create a marker clusterer using SuperClusterAlgorithm
    const clusterer = new MarkerClusterer({ 
      map,
      markers: markersRef.current,
      algorithm: new SuperClusterAlgorithm({
        radius: 100, // Clustering radius in pixels
        maxZoom: 13  // Maximum zoom level for clustering - reduced to keep city context
      }),
      onClusterChanged: () => {
        // Update marker visibility when clusters change
        updateMarkerVisibility();
      }
    });
    
    setMarkerClusterer(clusterer);
    setMap(map);
    
    // Set up marker click events
    markersRef.current.forEach(marker => {
      marker.addListener("click", () => {
        setSelectedPlace(marker.placeData);
      });
    });
    
    // Listen for zoom changes to update marker visibility
    map.addListener('zoom_changed', () => {
      updateMarkerVisibility();
    });
    
    // Initial update of marker visibility
    updateMarkerVisibility();
  }, [places]);

  const onUnmount = useCallback(function callback() {
    // Cleanup
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }
    setMap(null);
  }, [markerClusterer]);

  // Update markers when places change
  useEffect(() => {
    if (map && markerClusterer) {
      // Clear existing markers
      markerClusterer.clearMarkers();
      
      // Create new markers with initial visibility set to false
      markersRef.current = places.map(place => {
        if (!place.lat || !place.lng) return null;
        
        const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
        
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: place.title,
          placeData: place,
          visible: false, // Initialize as invisible
          animation: window.google.maps.Animation.DROP
        });
        
        marker.addListener("click", () => {
          setSelectedPlace(marker.placeData);
        });
        
        return marker;
      }).filter(Boolean);
      
      // Update the clusterer with new markers
      markerClusterer.addMarkers(markersRef.current);
      
      // Update marker visibility
      updateMarkerVisibility();
    }
  }, [places, map, markerClusterer]);

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
              maxWidth: 200,
              pixelOffset: new window.google.maps.Size(0, -30),
              disableAutoPan: false
            }}
          >
            <div className="w-full" style={{ overflow: 'hidden' }}>
              <Link to={`/place/${selectedPlace.id}`} className="hover:opacity-90 block">
                {selectedPlace.photos?.length > 0 && (
                  <div className="h-28 w-full overflow-hidden rounded-t-lg">
                    <CloudinaryImage 
                      photo={selectedPlace.photos[0]} 
                      alt={selectedPlace.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="p-2">
                  <h3 className="font-semibold text-xs mb-1">{selectedPlace.title}</h3>
                  <p className="text-xs text-gray-500 break-words">{selectedPlace.address}</p>
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