import React, { useState } from "react";

/**
 * PlacePerks Component
 * 
 * Displays the perks/amenities of a conference room in Airbnb-style layout
 * with priority amenities shown first and a modal for viewing all amenities.
 */
function PlacePerks({ perks }) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  if (!perks || perks.length === 0) {
    return null;
  }

  // Conference room priority amenities with modern icons
  const priorityAmenities = {
    // Essential Tech & AV
    wifi: {
      label: "Wi-Fi",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
        </svg>
      )
    },
    projector: {
      label: "Projector",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    },
    ledScreen: {
      label: "LED screen",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25z" />
        </svg>
      )
    },
    speakerMic: {
      label: "Speaker microphone",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      )
    },
    airConditioner: {
      label: "Air conditioner", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )
    },
    parking: {
      label: "On-site parking",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m4.5 4.5v-3.75A1.125 1.125 0 015.625 15h2.25a1.125 1.125 0 011.125 1.125v3.75m6-9h4.5a1.125 1.125 0 011.125 1.125v2.25a1.125 1.125 0 01-1.125 1.125h-4.5m0-6.75h4.5a1.125 1.125 0 011.125 1.125v2.25a1.125 1.125 0 01-1.125 1.125h-4.5m0-6.75v6.75" />
        </svg>
      )
    },
    coffee: {
      label: "Coffee service",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      )
    },
    catering: {
      label: "Catering available",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
        </svg>
      )
    }
  };

  // All amenities mapping with icons and categories for the modal
  const allAmenitiesMapping = {
    // Audio Equipment
    speakerMic: { label: "Speaker microphone", category: "Audio Equipment" },
    backupMic: { label: "Backup microphone", category: "Audio Equipment" },
    speaker: { label: "Speaker", category: "Audio Equipment" },
    mixer: { label: "Mixer", category: "Audio Equipment" },
    soundControl: { label: "Sound control panel", category: "Audio Equipment" },
    amplifier: { label: "Amplifier", category: "Audio Equipment" },
    acoustic: { label: "Room acoustic treatment", category: "Audio Equipment" },
    
    // Visual Equipment
    projector: { label: "Projector", category: "Visual Equipment" },
    ledScreen: { label: "LED screen", category: "Visual Equipment" },
    projectorScreen: { label: "Projector screen", category: "Visual Equipment" },
    hdmiCable: { label: "HDMI cable", category: "Visual Equipment" },
    vgaCable: { label: "VGA cable", category: "Visual Equipment" },
    adapters: { label: "Adapters and converters", category: "Visual Equipment" },
    clicker: { label: "Presentation clicker", category: "Visual Equipment" },
    laserPointer: { label: "Laser pointer", category: "Visual Equipment" },
    stageLighting: { label: "Stage lighting", category: "Visual Equipment" },
    
    // Technical Equipment
    laptop: { label: "Laptop", category: "Technical Equipment" },
    desktop: { label: "Desktop computer", category: "Technical Equipment" },
    extensionCords: { label: "Extension cords", category: "Technical Equipment" },
    chargers: { label: "Chargers", category: "Technical Equipment" },
    wiredInternet: { label: "Wired internet", category: "Technical Equipment" },
    wifi: { label: "Wi-Fi", category: "Technical Equipment" },
    router: { label: "Router", category: "Technical Equipment" },
    wifiAccessPoint: { label: "Wi-Fi access point", category: "Technical Equipment" },
    
    // Furniture & Comfort
    speakerPodium: { label: "Speaker podium", category: "Furniture & Comfort" },
    speakerTable: { label: "Table for speakers", category: "Furniture & Comfort" },
    speakerChair: { label: "Chair for speakers", category: "Furniture & Comfort" },
    participantChairs: { label: "Chairs for participants", category: "Furniture & Comfort" },
    participantDesks: { label: "Desk for participants", category: "Furniture & Comfort" },
    bottledWater: { label: "Water 0.5L", category: "Furniture & Comfort" },
    waterCooler: { label: "Water from cooler", category: "Furniture & Comfort" },
    cups: { label: "Cups", category: "Furniture & Comfort" },
    airConditioner: { label: "Air conditioner", category: "Furniture & Comfort" },
    ventilation: { label: "Ventilation system", category: "Furniture & Comfort" },
    
    // Services & Amenities  
    catering: { label: "Catering available", category: "Services & Amenities" },
    coffee: { label: "Coffee service", category: "Services & Amenities" },
    parking: { label: "On-site parking", category: "Services & Amenities" },
    
    // Office Supplies
    nameTags: { label: "Name tags", category: "Office Supplies" },
    flipChart: { label: "Flip chart", category: "Office Supplies" },
    markers: { label: "Markers", category: "Office Supplies" },
    paper: { label: "Paper", category: "Office Supplies" },
    signage: { label: "Directional signage", category: "Office Supplies" },
    registrationDesk: { label: "Registration desk", category: "Office Supplies" },
    
    // Safety & Security
    fireExtinguisher: { label: "Fire extinguisher", category: "Safety & Security" },
    firstAidKit: { label: "First aid kit", category: "Safety & Security" },
    evacuationSigns: { label: "Evacuation signs", category: "Safety & Security" }
  };

  // Get amenities that exist in the perks array
  const availableAmenities = perks.map(perk => {
    const perkKey = typeof perk === 'string' ? perk.toLowerCase() : String(perk).toLowerCase();
    
    // Check in priority amenities first
    const priorityMatch = Object.keys(priorityAmenities).find(key => 
      key.toLowerCase() === perkKey
    );
    if (priorityMatch) {
      return {
        key: priorityMatch,
        ...priorityAmenities[priorityMatch],
        isPriority: true
      };
    }
    
    // Then check in all amenities mapping
    const allMatch = Object.keys(allAmenitiesMapping).find(key => 
      key.toLowerCase() === perkKey
    );
    if (allMatch) {
      return {
        key: allMatch,
        ...allAmenitiesMapping[allMatch],
        isPriority: false
      };
    }
    
    // Fallback for unmapped amenities
    return {
      key: perkKey,
      label: typeof perk === 'string' ? perk.charAt(0).toUpperCase() + perk.slice(1) : String(perk),
      category: "Other",
      isPriority: false
    };
  }).filter(Boolean);

  // Split into priority and other amenities
  const priorityItems = availableAmenities.filter(item => item.isPriority);
  const otherItems = availableAmenities.filter(item => !item.isPriority);
  
  // Show top 10 items in main view (priority first, then others)
  const mainDisplayItems = [...priorityItems, ...otherItems].slice(0, 10);
  const hasMoreAmenities = availableAmenities.length > 10;

  // Group all amenities by category for modal
  const categorizedAmenities = availableAmenities.reduce((acc, amenity) => {
    const category = amenity.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(amenity);
    return acc;
  }, {});

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">What this place offers</h2>
      
      {/* Main Amenities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {mainDisplayItems.map((amenity, index) => (
          <div key={index} className="flex items-center py-4 border-b border-gray-100 last:border-b-0">
            <div className="mr-4 text-gray-700">
              {amenity.icon || (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className="text-gray-900 font-medium">{amenity.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Show All Amenities Button */}
      {hasMoreAmenities && (
        <button
          onClick={() => setShowAllAmenities(true)}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
        >
          <span>Show all {availableAmenities.length} amenities</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {/* Full Amenities Modal */}
      {showAllAmenities && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">What this place offers</h3>
              <button
                onClick={() => setShowAllAmenities(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {Object.entries(categorizedAmenities).map(([category, amenities]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    {category}
                    <span className="ml-2 text-sm text-gray-500 font-normal">({amenities.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <div className="mr-3 text-gray-600">
                          {amenity.icon || (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-900 font-medium">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAllAmenities(false)}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacePerks;
