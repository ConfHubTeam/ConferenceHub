import { useCallback, useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

// Get Google Maps API key from environment variables with fallback
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Map container style - height is twice the relative width
const containerStyle = {
  width: '100%',
  height: 'calc(100vw * 0.3)' // Height is 80% of viewport width (approximate twice of container width)
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
  
  // Initialize position state with initialCoordinates if available
  const [position, setPosition] = useState(() => {
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      return {
        lat: parseFloat(initialCoordinates.lat),
        lng: parseFloat(initialCoordinates.lng)
      };
    }
    return null;
  });
  const [addressFetchStatus, setAddressFetchStatus] = useState(null); // null, 'loading', 'success', 'failed'
  
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
    
    // Create initial marker if we have a position when map loads
    if (position && position.lat && position.lng) {
      const newMarker = new window.google.maps.Marker({
        position: { 
          lat: parseFloat(position.lat), 
          lng: parseFloat(position.lng) 
        },
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
    
    // Force map to refresh by triggering a resize event after a slight delay
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }, [position]);

  const onUnmount = useCallback(function callback() {
    // Clean up marker if it exists
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    setMap(null);
  }, [marker]);

  // Initialize position when initialCoordinates changes
  useEffect(() => {
    // Only update position if initialCoordinates changed from parent
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      const newLat = parseFloat(initialCoordinates.lat);
      const newLng = parseFloat(initialCoordinates.lng);
      
      // Log for debugging
      console.log("Initial coordinates received:", { lat: newLat, lng: newLng });
      
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
        
        // Force map refresh if map is already loaded
        if (map) {
          map.setCenter({ lat: newLat, lng: newLng });
          
          // If marker doesn't exist yet, create it immediately
          if (!marker) {
            const newMarker = new window.google.maps.Marker({
              position: { lat: newLat, lng: newLng },
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
        }
      }
    }
  }, [initialCoordinates, map]);

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
      
      // Log for debugging
      console.log("Created new marker at:", newPosition);
    }
  }, [map, position]);

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
    
    // Only notify parent component about the position change
    // without altering the address field
    if (onLocationSelect) {
      onLocationSelect(newPosition);
    }
    
    // We'll still fetch the address to show as a suggestion in the UI
    // but we won't automatically update the address field
    try {
      setAddressFetchStatus('loading');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newPosition.lat},${newPosition.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        setAddressFetchStatus('success');
        
        // Pass the suggested address to parent component, but don't force update
        if (onAddressUpdate) {
          // The parent component can decide whether to use this address or not
          onAddressUpdate(address);
        }
      } else {
        setAddressFetchStatus('failed');
        if (onAddressUpdate) {
          // Signal that address fetch failed
          onAddressUpdate('');
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddressFetchStatus('failed');
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
      <div className="bg-white p-2 text-xs flex items-center justify-between">
        <span className="text-gray-500">
          Click on the map to set coordinates, or drag the marker to adjust position. You can name the location as desired.
        </span>
        {addressFetchStatus === 'loading' && (
          <span className="text-blue-500 flex items-center">
            <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full mr-1"></div>
            Fetching suggested address...
          </span>
        )}
        {addressFetchStatus === 'failed' && (
          <span className="text-amber-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            No address suggestion found
          </span>
        )}
        {addressFetchStatus === 'success' && (
          <span className="text-green-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Address suggestion available
          </span>
        )}
      </div>
    </div>
  );
}