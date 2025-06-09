import React from "react";
import MapPicker from "./MapPicker";

/**
 * AddressSection Component - Step 1 Refactoring
 * 
 * Extracted from PlacesFormPage without changing any existing logic.
 * This component handles address input with geocoding validation and map integration.
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
  return (
    <>
      {preInput("Address", "address of this conference room. You can enter it manually or pin on the map.")}
      <div className="relative">
        <input
          type="text"
          placeholder="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
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
          className="bg-primary text-white px-3 py-1 rounded-md text-sm"
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
        {geocodingSuccess === false && (
          <p className="text-red-500 text-sm">
            Could not get coordinates for this address. Try pinning the location on the map.
          </p>
        )}
        {geocodingSuccess === true && (
          <p className="text-green-500 text-sm">
            Map coordinates found! Your location will appear on the map.
          </p>
        )}
      </div>
      
      {showMap && (
        <div className="mb-4">
          <MapPicker 
            initialCoordinates={lat && lng ? { lat, lng } : null}
            onLocationSelect={handleLocationSelect}
            onAddressUpdate={handleAddressUpdate}
          />
        </div>
      )}
    </>
  );
}
