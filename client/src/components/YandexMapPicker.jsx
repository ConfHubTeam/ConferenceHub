import { useCallback, useEffect, useRef, useState } from "react";
import { loadYandexMapsApi, reverseGeocodeYandex } from "../utils/yandexMapsUtils";

// Default center position (Tashkent, Uzbekistan)
const defaultCenter = [41.2995, 69.2401];

export default function YandexMapPicker({ 
  initialCoordinates, 
  onLocationSelect,
  onAddressUpdate,
  isFullScreen = false,
  onToggleFullScreen
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [position, setPosition] = useState(() => {
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      const parsedLat = parseFloat(initialCoordinates.lat);
      const parsedLng = parseFloat(initialCoordinates.lng);
      
      return [parsedLat, parsedLng];
    }
    return null;
  });
  const [addressFetchStatus, setAddressFetchStatus] = useState(null);
  
  // Use ref to track position update source
  const positionUpdateSource = useRef("internal");
  const lastPosition = useRef(null);

  // Detect if device is mobile
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  // Get map container style
  const getMapContainerStyle = () => {
    if (isFullScreen) {
      return {
        width: "100%",
        height: "100vh",
        position: "relative",
        zIndex: 1,
      };
    }
    
    if (isMobile()) {
      return {
        width: "100%",
        height: "60vh",
        position: "relative",
        zIndex: 1,
      };
    }
    
    return {
      width: "100%",
      height: "calc(100vw * 0.3)",
      position: "relative",
      zIndex: 1,
    };
  };

  // Create or update placemark
  const createPlacemark = useCallback((coords) => {
    if (!mapInstanceRef.current) return;

    // Remove existing placemark
    if (placemarkRef.current) {
      mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
    }

    // Create new placemark
    const placemark = new window.ymaps.Placemark(coords, {
      hintContent: "Drag to adjust location",
      balloonContent: "Selected location"
    }, {
      draggable: true,
      preset: "islands#redDotIcon"
    });

    // Add drag end event
    placemark.events.add("dragend", (e) => {
      const newCoords = e.get("target").geometry.getCoordinates();
      handlePositionChange(newCoords);
    });

    mapInstanceRef.current.geoObjects.add(placemark);
    placemarkRef.current = placemark;
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (e) => {
    try {
      const coords = e.get("coords");
      console.log("Yandex Map clicked at:", coords);
      
      // Update position
      positionUpdateSource.current = "internal";
      setPosition(coords);
      lastPosition.current = coords;
      
      // Create/update placemark
      createPlacemark(coords);
      
      // Center map on clicked position
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(coords, 14);
      }
      
      // Handle position change
      handlePositionChange(coords);
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  }, [createPlacemark]);

  // Initialize Yandex Map
  const initializeMap = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (isLoaded || mapInstanceRef.current) {
      return;
    }

    try {
      setLoadError(null);
      await loadYandexMapsApi();
      
      if (!mapRef.current) return;

      const center = position || defaultCenter;
      
      // Create map instance only if one doesn't exist
      if (!mapInstanceRef.current) {
        const map = new window.ymaps.Map(mapRef.current, {
          center: center,
          zoom: 14,
          controls: ["zoomControl", "typeSelector", "fullscreenControl"]
        });

        mapInstanceRef.current = map;

        // Create initial placemark if position exists
        if (position) {
          createPlacemark(position);
        }

        // Add click listener
        map.events.add("click", handleMapClick);

        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Error initializing Yandex Map:", error);
      setLoadError(error);
    }
  }, [position, isLoaded, createPlacemark, handleMapClick]);

  // Handle position change and reverse geocode
  const handlePositionChange = async (newCoords) => {
    if (!newCoords || newCoords.length !== 2) {
      console.error("Invalid coordinates:", newCoords);
      return;
    }

    const [lat, lng] = newCoords;
    
    // Check if position actually changed
    if (lastPosition.current && 
        lastPosition.current[0] === lat && 
        lastPosition.current[1] === lng) {
      return;
    }
    
    // Update position state
    positionUpdateSource.current = "internal";
    lastPosition.current = newCoords;
    setPosition(newCoords);
    
    // Notify parent component
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
    
    // Reverse geocode to get address
    try {
      setAddressFetchStatus("loading");
      
      const address = await reverseGeocodeYandex(lat, lng);
      
      if (address) {
        setAddressFetchStatus("success");
        if (onAddressUpdate) {
          onAddressUpdate(address);
        }
      } else {
        setAddressFetchStatus("failed");
        if (onAddressUpdate) {
          onAddressUpdate("");
        }
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setAddressFetchStatus("failed");
    }
  };

  // Initialize position when initialCoordinates changes
  useEffect(() => {
    if (initialCoordinates && initialCoordinates.lat && initialCoordinates.lng) {
      const newLat = parseFloat(initialCoordinates.lat);
      const newLng = parseFloat(initialCoordinates.lng);
      
      console.log("Initial coordinates received:", { lat: newLat, lng: newLng });
      
      const currentLat = lastPosition.current?.[0];
      const currentLng = lastPosition.current?.[1];
      
      if (currentLat !== newLat || currentLng !== newLng) {
        positionUpdateSource.current = "external";
        const newCoords = [newLat, newLng];
        setPosition(newCoords);
        lastPosition.current = newCoords;
        
        // Update map and placemark if map is loaded
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(newCoords, 14);
          createPlacemark(newCoords);
        }
      }
    }
  }, [initialCoordinates, createPlacemark]);

  // Update placemark when position changes
  useEffect(() => {
    if (!mapInstanceRef.current || !position) return;
    
    // Create/update placemark
    createPlacemark(position);
    
    // Center map on position
    mapInstanceRef.current.setCenter(position, 14);
  }, [position, createPlacemark]);

  // Effect to handle body overflow when in full-screen mode
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    // Trigger map resize when fullscreen state changes
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.container.fitToViewport();
      }, 100);
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  // Initialize map on component mount
  useEffect(() => {
    // Only initialize if not already loaded
    if (!isLoaded && !mapInstanceRef.current) {
      initializeMap();
    }
    
    // Cleanup on unmount
    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }
        if (placemarkRef.current) {
          placemarkRef.current = null;
        }
      } catch (error) {
        console.warn("Error cleaning up Yandex Map:", error);
      }
    };
  }, []); // Empty dependency array to run only once

  // Confirm and close map
  const handleConfirmLocation = () => {
    if (placemarkRef.current && position) {
      const coords = placemarkRef.current.geometry.getCoordinates();
      const [lat, lng] = coords;
      
      if (lat !== position[0] || lng !== position[1]) {
        handlePositionChange(coords);
      }
    }
    
    if (isFullScreen && onToggleFullScreen) {
      onToggleFullScreen();
    }
  };

  // Handle mobile full-screen toggling
  const toggleFullScreen = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
      
      // Trigger map resize after state update
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.container.fitToViewport();
        }
      }, 100);
    }
  };

  // Error state handling
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <p className="text-red-500">Error loading Yandex Maps</p>
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
      
      <div
        ref={mapRef}
        style={getMapContainerStyle()}
        className={isFullScreen ? "mt-16" : ""}
      />

      {!isFullScreen && isMobile() && (
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={toggleFullScreen}
            className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label="Fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      )}

      {isFullScreen && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm text-center">
            {position ? (
              <span>
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
                {addressFetchStatus === "success" && " • Location found"}
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
