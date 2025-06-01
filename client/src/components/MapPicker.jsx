import { useCallback, useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

// Get Google Maps API key from environment variables with fallback
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Map container style
const containerStyle = {
  width: '100%',
  height: '300px'
};

// Default center position (same as in MapView)
const defaultCenter = {
  lat: 41.2995,
  lng: 69.2401
};

// Define libraries as a constant outside the component to prevent recreation on each render
const libraries = ['places'];

export default function MapPicker({ 
  initialCoordinates, 
  onLocationSelect,
  onAddressUpdate
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [position, setPosition] = useState(null);
  
  // Use ref to track position update source
  const positionUpdateSource = useRef('internal');
  // Use ref to track last updated position to avoid unnecessary updates
  const lastPosition = useRef(null);

  // Load map and set initial marker
  const onLoad = useCallback(function callback(map) {
    const center = position ? 
      { lat: parseFloat(position.lat), lng: parseFloat(position.lng) } : 
      defaultCenter;
    
    map.setCenter(center);
    setMap(map);
    
    // Force map to refresh by triggering a resize event after a slight delay
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [position]);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Initialize position when initialCoordinates changes
  useEffect(() => {
    // Only update position if initialCoordinates changed from parent
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      const newLat = parseFloat(initialCoordinates.lat);
      const newLng = parseFloat(initialCoordinates.lng);
      
      // Skip update if position is already set to these coordinates
      const currentLat = lastPosition.current?.lat;
      const currentLng = lastPosition.current?.lng;
      
      if (currentLat !== newLat || currentLng !== newLng) {
        positionUpdateSource.current = 'external';
        setPosition({
          lat: newLat,
          lng: newLng
        });
        lastPosition.current = { lat: newLat, lng: newLng };
      }
    }
  }, [initialCoordinates]);

  // Update marker when position changes
  useEffect(() => {
    if (!map || !position) return;
    
    // If we have a position and a map, create/update marker
    const newPosition = { 
      lat: parseFloat(position.lat), 
      lng: parseFloat(position.lng) 
    };
    
    if (marker) {
      // Update existing marker
      marker.setPosition(newPosition);
    } else {
      // Create new marker
      const newMarker = new window.google.maps.Marker({
        position: newPosition,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP
      });
      
      // Add drag end listener to update coordinates
      newMarker.addListener('dragend', async () => {
        const newPos = newMarker.getPosition();
        const lat = newPos.lat();
        const lng = newPos.lng();
        handlePositionChange({ lat, lng });
      });
      
      setMarker(newMarker);
    }
  }, [map, position, marker]);

  // Separate effect for notifying parent component to prevent circular updates
  useEffect(() => {
    if (position && onLocationSelect && positionUpdateSource.current === 'internal') {
      onLocationSelect(position);
    }
    
    // Reset the update source after the update is processed
    positionUpdateSource.current = 'internal';
  }, [position, onLocationSelect]);

  // Handle map click to set marker
  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handlePositionChange({ lat, lng });
  };

  // Handle position change and reverse geocode
  const handlePositionChange = async (newPosition) => {
    // Check if position actually changed to avoid unnecessary updates
    if (lastPosition.current?.lat === newPosition.lat && 
        lastPosition.current?.lng === newPosition.lng) {
      return;
    }
    
    // Mark this position update as internal (from map interaction)
    positionUpdateSource.current = 'internal';
    lastPosition.current = { ...newPosition };
    
    setPosition(newPosition);
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newPosition.lat},${newPosition.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        if (onAddressUpdate) {
          onAddressUpdate(address);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Error state handling
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <p className="text-red-500">Error loading Google Maps</p>
          <p className="text-sm text-gray-600 mt-2">{loadError.message}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position ? { lat: parseFloat(position.lat), lng: parseFloat(position.lng) } : defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP
          }
        }}
      />
      <div className="bg-white p-2 text-xs text-gray-500">
        Click on the map to set location, or drag the marker to adjust position.
      </div>
    </div>
  );
}