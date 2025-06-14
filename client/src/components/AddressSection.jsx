import React, { useState, useEffect } from "react";
import MapPicker from "./MapPicker";

/**
 * AddressSection Component
 * 
 * Handles address input with geocoding validation and map integration.
 * Now supports manual address editing while preserving map coordinates.
 */
export default function AddressSection({
  // Address state
  address,
  setAddress,
  
  // Coordinate state
  lat,
  setLat,
  lng,
  setLng,
  
  // Geocoding state
  isGeocodingAddress,
  geocodingSuccess,
  
  // Map state
  showMap,
  setShowMap,
  
  // Handler functions
  handleLocationSelect,
  handleAddressUpdate,
  
  // UI helper functions
  preInput
}) {
  // Track whether the address was manually edited after pin placement
  const [addressManuallyEdited, setAddressManuallyEdited] = useState(false);
  // Track full screen state for the map - start with false (embedded view)
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Track window width for responsive behavior
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Check if we're on a mobile device based on window width
  const isMobile = windowWidth <= 768; // 768px is a common mobile breakpoint
  
  // Update window width when resized
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // If lat and lng exist, this is an existing place - maintain independence between address and coordinates
  const isExistingPlace = Boolean(lat && lng);
  
  // Custom address update handler to maintain manual edits
  const handleAddressInputChange = (event) => {
    setAddress(event.target.value);
    setAddressManuallyEdited(true);
  };
  
  // Handle address suggestions from the map
  const handleMapAddressUpdate = (suggestedAddress) => {
    // We received an address suggestion from the map
    // But we won't automatically update the address field anymore
    // This keeps the address completely independent from the coordinates
    
    // You could display this suggested address somewhere if desired
    console.log("Map suggested address:", suggestedAddress);
    
    // If the user wants to update the address field programmatically,
    // they can uncomment this:
    /*
    if (!addressManuallyEdited || !address.trim()) {
      handleAddressUpdate(suggestedAddress);
      setAddressManuallyEdited(false);
    }
    */
  };
  
  // Handle toggling full screen mode
  const toggleFullScreen = () => {
    // Only allow full screen on mobile devices
    if (!isMobile) {
      setIsFullScreen(false);
      return;
    }
    
    setIsFullScreen(!isFullScreen);
    
    // Force a reflow/repaint by waiting a tiny bit before toggling
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };
  
  // Reset full screen mode when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobile && isFullScreen) {
      setIsFullScreen(false);
      
      // Force a reflow/repaint
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [isMobile, isFullScreen]);

  return (
    <>
      {preInput("Address", "name or description of this location. You can enter any name you want, independently of the map coordinates.")}
      <div className="relative">
        <input
          type="text"
          placeholder="address"
          value={address}
          onChange={handleAddressInputChange}
          className={`w-full border my-2 py-2 px-3 rounded-2xl ${
            geocodingSuccess === false ? 'border-red-500' : 
            geocodingSuccess === true ? 'border-green-500' : ''
          }`}
        />
        {isGeocodingAddress && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        {geocodingSuccess === true && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {geocodingSuccess === false && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 items-center mt-1 mb-4">
        <button 
          type="button" 
          onClick={() => {
            setShowMap(!showMap);
            // Force a reflow/repaint by waiting a tiny bit before toggling
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
            }, 100);
          }}
          className="flex items-center justify-center bg-white border border-gray-300 hover:border-gray-400 p-2 rounded-full transition-all hover:shadow-md"
          aria-label={showMap ? "Hide Map" : "Show Map"}
          title={showMap ? "Hide Map" : "Show Map"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke={showMap ? "currentColor" : "#9CA3AF"} 
            className={`w-5 h-5 ${showMap ? "text-primary" : "text-gray-400"}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </button>
        
        {showMap && isMobile && (
          <button 
            type="button"
            onClick={toggleFullScreen}
            className="flex items-center justify-center bg-white border border-gray-300 hover:border-gray-400 p-2 rounded-full transition-all hover:shadow-md"
            aria-label={isFullScreen ? "Exit Full Screen" : "View Full Screen"}
            title={isFullScreen ? "Exit Full Screen" : "View Full Screen"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isFullScreen ? "text-primary" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
            <span className="sr-only">{isFullScreen ? "Exit Full Screen" : "View Full Screen"}</span>
          </button>
        )}
        {geocodingSuccess === false && (
          <p className="text-amber-500 text-sm ml-2">
            Address lookup failed. You can still set coordinates by pinning on map.
          </p>
        )}
        {geocodingSuccess === true && (
          <p className="text-green-500 text-sm ml-2">
            Coordinates set successfully! You can still edit the name/address.
          </p>
        )}
      </div>
      
      {showMap && (
        <div className="mb-4">
          <MapPicker 
            initialCoordinates={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
            onLocationSelect={handleLocationSelect}
            onAddressUpdate={handleMapAddressUpdate}
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
          />
          <div className="bg-blue-50 p-3 mt-2 rounded-md text-sm text-gray-700 border border-blue-200">
            <div className="font-semibold mb-1 flex items-center text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Map and Address Usage:
            </div>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Pin the location on the map for setting precise coordinates</li>
              <li>You can freely name the location regardless of its map position</li>
              <li>Map will suggest an address based on the pin, which you can choose to use or ignore</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
