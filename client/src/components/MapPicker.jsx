import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

// Get Google Maps API key from environment variables with fallback
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Define libraries as a constant outside the component to prevent recreation on each render
const libraries = ['places'];

// Default center position (same as in MapView)
const defaultCenter = {
  lat: 41.2995,
  lng: 69.2401
};

export default function MapPicker({ 
  initialCoordinates, 
  onLocationSelect,
  onAddressUpdate,
  isFullScreen = false,
  onToggleFullScreen
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  // Track current map type - 'roadmap' (normal view) or 'satellite' (satellite view)
  // This works with Google Maps' native map type control for toggling satellite view
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  // Initialize position state with initialCoordinates if available
  const [position, setPosition] = useState(() => {
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      // Make sure we parse the values as floats (GPS coordinates)
      const parsedLat = parseFloat(initialCoordinates.lat);
      const parsedLng = parseFloat(initialCoordinates.lng);
      
      console.log("MapPicker initializing with coordinates:", { lat: parsedLat, lng: parsedLng });
      return {
        lat: parsedLat,
        lng: parsedLng
      };
    }
    return null;
  });
  const [addressFetchStatus, setAddressFetchStatus] = useState(null); // null, 'loading', 'success', 'failed'
  
  // Use ref to track position update source
  const positionUpdateSource = useRef('internal');
  // Use ref to track last updated position to avoid unnecessary updates
  const lastPosition = useRef(null);

  // Handle mobile full-screen toggling
  const toggleFullScreen = () => {
    if (onToggleFullScreen) {
      // Store current map type before toggling
      const currentMapType = map ? map.getMapTypeId() : mapTypeId;
      
      onToggleFullScreen();
      
      // Trigger map resize after state update to ensure proper rendering
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Re-apply map type after resize
        if (map) {
          map.setMapTypeId(currentMapType);
          setMapTypeId(currentMapType); // Update state to match
        }
      }, 100);
    }
  };

  // Detect if device is mobile
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  // Listen to map type changes from the native Google Maps controls
  const handleMapTypeChange = useCallback(() => {
    if (map) {
      const currentMapType = map.getMapTypeId();
      
      // Only update if the type has actually changed
      if (currentMapType !== mapTypeId) {
        console.log("Map type changed to:", currentMapType);
        setMapTypeId(currentMapType);
      }
    }
  }, [map, mapTypeId]);

  // Effect to handle resize events, but not auto-enter full screen on mobile
  useEffect(() => {
    // Listen for resize events to adjust full screen state
    const handleResize = () => {
      // Only auto-exit full-screen when resizing to desktop from mobile
      if (!isMobile() && isFullScreen && onToggleFullScreen) {
        onToggleFullScreen();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullScreen, onToggleFullScreen]);

  // Update map container style based on screen size
  const getMapContainerStyle = () => {
    if (isFullScreen) {
      return {
        width: '100%',
        height: '100vh', // Full viewport height
        position: 'relative', // Ensure controls render correctly on fullscreen
        zIndex: 1, // Ensure controls appear above map but below header
      };
    }
    
    // For non-fullscreen mode (desktop), use a reasonable height
    return {
      width: '100%',
      height: 'calc(100vw * 0.3)', // Regular height for desktop
      position: 'relative', // Ensure controls render correctly
      zIndex: 1, // Ensure controls appear above map
    };
  };

  // Load map and set initial marker
  const onLoad = useCallback(function callback(map) {
    const center = position ? 
      { lat: parseFloat(position.lat), lng: parseFloat(position.lng) } : 
      defaultCenter;
    
    map.setCenter(center);
    map.setMapTypeId(mapTypeId); // Ensure the map type is set correctly on load
    
    // Set map type control options right away
    if (window.google?.maps) {
      const mapTypeControlOptions = {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: isFullScreen && isMobile()
          ? window.google.maps.ControlPosition.TOP_RIGHT
          : isFullScreen
            ? window.google.maps.ControlPosition.LEFT_TOP
            : window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite']
      };
      
      map.setOptions({ mapTypeControlOptions });
    }
    
    setMap(map);
    
    // Create initial marker if we have a position when map loads
    if (position && position.lat && position.lng) {
      const parsedPosition = { 
        lat: parseFloat(position.lat), 
        lng: parseFloat(position.lng) 
      };
      
      console.log("Creating initial marker on map load at:", parsedPosition);
      
      const newMarker = new window.google.maps.Marker({
        position: parsedPosition,
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
      
      // Make sure the map is centered on the marker position
      map.setCenter(parsedPosition);
      
      // Zoom in a bit for better visibility
      map.setZoom(14);
    }
    
    // Force map to refresh by triggering a resize event after a slight delay
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      
      // One more check to ensure marker exists
      if (position && !marker) {
        console.log("Ensuring marker exists after resize");
        const parsedPosition = { 
          lat: parseFloat(position.lat), 
          lng: parseFloat(position.lng) 
        };
        
        const newMarker = new window.google.maps.Marker({
          position: parsedPosition,
          map,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        });
        
        newMarker.addListener('dragend', async () => {
          const newPos = newMarker.getPosition();
          const lat = newPos.lat();
          const lng = newPos.lng();
          handlePositionChange({ lat, lng });
        });
        
        setMarker(newMarker);
      }
    }, 200);
  }, [position, marker, mapTypeId]);

  // Effect to handle body overflow when in full-screen mode
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Update map type control when fullscreen state changes
    if (map && window.google?.maps) {
      const mapTypeControlOptions = {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: isFullScreen && isMobile()
          ? window.google.maps.ControlPosition.TOP_RIGHT
          : isFullScreen
            ? window.google.maps.ControlPosition.LEFT_TOP
            : window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite']
      };
      
      map.setOptions({ mapTypeControlOptions });
      
      // Ensure map is refreshed to render controls correctly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen, map]);
  
  // Add click listener to map when loaded to ensure marker updates
  useEffect(() => {
    if (map) {
      // Make sure we have proper click handling on the map itself
      const clickListener = map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        console.log("Direct map click detected at:", { lat, lng });
        
        // Update marker position directly for immediate feedback
        if (marker) {
          marker.setPosition({ lat, lng });
        }
      });
      
      // Add listener for map type changes
      const mapTypeListener = map.addListener('maptypeid_changed', handleMapTypeChange);
      
      // Clean up listeners
      return () => {
        if (clickListener) {
          window.google.maps.event.removeListener(clickListener);
        }
        if (mapTypeListener) {
          window.google.maps.event.removeListener(mapTypeListener);
        }
      };
    }
  }, [map, marker, handleMapTypeChange]);

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
      console.log("Updated existing marker at:", newPosition);
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
    
    // Ensure the map is centered on the marker
    map.setCenter(newPosition);
    
    // Zoom in a bit for better visibility if we're setting a marker
    if (map.getZoom() < 13) {
      map.setZoom(13);
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
  const handleMapClick = (e) => {
    try {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newPosition = { lat, lng };
      
      console.log("Map clicked at:", newPosition);
      
      // Force immediate marker update for responsive UI
      if (marker) {
        console.log("Updating existing marker position");
        marker.setPosition(newPosition);
      } else if (map) {
        console.log("Creating new marker");
        // Create new marker if it doesn't exist
        const newMarker = new window.google.maps.Marker({
          position: newPosition,
          map,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        });
        
        // Add drag end listener to update coordinates
        newMarker.addListener('dragend', () => {
          const newPos = newMarker.getPosition();
          const dragLat = newPos.lat();
          const dragLng = newPos.lng();
          handlePositionChange({ lat: dragLat, lng: dragLng });
        });
        
        setMarker(newMarker);
      }
      
      // Center map on the new position for better UX
      if (map) {
        map.panTo(newPosition);
      }
      
      // Call position change handler AFTER updating the marker
      // This ensures the UI and state are in sync
      handlePositionChange(newPosition);
      
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  };

  // Handle position change and reverse geocode
  const handlePositionChange = async (newPosition) => {
    // Ensure we have valid coordinates
    if (!newPosition || typeof newPosition.lat !== 'number' || typeof newPosition.lng !== 'number') {
      console.error("Invalid position data:", newPosition);
      return;
    }
    
    // Check if position actually changed to avoid unnecessary updates
    if (lastPosition.current?.lat === newPosition.lat && 
        lastPosition.current?.lng === newPosition.lng) {
      console.log("Position unchanged, skipping update");
      return;
    }
    
    console.log("Updating position to:", newPosition);
    
    // Mark this position update as internal (from map interaction)
    positionUpdateSource.current = 'internal';
    lastPosition.current = { ...newPosition };
    
    // Update component state
    setPosition({
      lat: newPosition.lat,
      lng: newPosition.lng
    });
    
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

  // Confirm and close map
  const handleConfirmLocation = () => {
    // Ensure we have the latest position when closing
    if (marker && position) {
      const currentPosition = marker.getPosition();
      const lat = currentPosition.lat();
      const lng = currentPosition.lng();
      
      // Update position if it has changed
      if (lat !== position.lat || lng !== position.lng) {
        handlePositionChange({ lat, lng });
      }
    }
    
    if (isFullScreen && onToggleFullScreen) {
      onToggleFullScreen();
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
    <div 
      className={`${
        isFullScreen 
          ? "fixed inset-0 z-50 bg-white" 
          : "rounded-lg overflow-hidden border border-gray-300"
      }`}
    >
      {isFullScreen && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white flex justify-between items-center p-4 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Select Location</h3>
          <button 
            onClick={handleConfirmLocation}
            className="bg-primary text-white px-5 py-2 rounded-full text-sm font-medium shadow-md hover:bg-opacity-90 transition-colors flex items-center"
          >
            <span>Done</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={getMapContainerStyle()}
        center={position ? { lat: parseFloat(position.lat), lng: parseFloat(position.lng) } : defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        mapTypeId={mapTypeId}
        options={{
          fullscreenControl: false,
          mapTypeControl: true, // Enable Google's native map type control
          mapTypeControlOptions: {
            // Use horizontal bar style for both mobile and desktop views
            style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR,
            // In mobile fullscreen, position control at top-right for easy access
            // This is crucial for satellite view toggle visibility in mobile fullscreen mode
            position: isFullScreen
              ? window.google?.maps?.ControlPosition?.TOP_RIGHT
              : window.google?.maps?.ControlPosition?.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'satellite']
          },
          streetViewControl: false, // Removed street view control (human icon)
          zoomControl: false // Removed zoom control
        }}
      />

      {isFullScreen && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm text-center">
            {position ? (
              <span>
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                {addressFetchStatus === 'success' && " • Location found"}
              </span>
            ) : (
              "Tap on the map to select a location"
            )}
          </div>
        </div>
      )}
    </div>
  );
}