import React, { useState } from "react";
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
  
  // Custom address update handler to maintain manual edits
  const handleAddressInputChange = (event) => {
    setAddress(event.target.value);
    setAddressManuallyEdited(true);
  };
  
  // Reset the manually edited flag when a new address is set from the map
  const handleMapAddressUpdate = (newAddress) => {
    // Only update the address if it hasn't been manually edited
    // or if the address field is empty
    if (!addressManuallyEdited || !address.trim()) {
      handleAddressUpdate(newAddress);
      setAddressManuallyEdited(false);
    }
  };

  return (
    <>
      {preInput("Address", "address of this conference room. You can enter it manually or pin on the map.")}
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
      
      {addressManuallyEdited && lat && lng && (
        <div className="text-sm text-blue-600 mt-1 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Address manually edited (pin location preserved)
        </div>
      )}
      
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
            onAddressUpdate={handleMapAddressUpdate}
          />
          <div className="bg-blue-50 p-3 mt-2 rounded-md text-sm text-gray-700 border border-blue-200">
            <div className="font-semibold mb-1 flex items-center text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Address Editing Tips:
            </div>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Pin the location on the map for accurate coordinates</li>
              <li>Manually edit the address field if the automatic address is incorrect</li>
              <li>Your pin position (coordinates) will be preserved when you edit the address</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
