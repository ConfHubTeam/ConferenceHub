import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// Context for managing perks filter state
const PerksFilterContext = createContext();

// Hook to use the perks filter context
export const usePerksFilter = () => {
  const context = useContext(PerksFilterContext);
  if (!context) {
    throw new Error("usePerksFilter must be used within a PerksFilterProvider");
  }
  return context;
};

// Most relevant perks for conference rooms - prioritized by common usage
const MOST_RELEVANT_PERKS = [
  // Essential tech for conferences
  "wifi",
  "projector", 
  "speaker",
  "speakerMic",
  "hdmiCable",
  
  // Basic furniture needs
  "participantChairs",
  "participantDesks",
  "speakerTable",
  
  // Common amenities
  "airConditioner",
  "bottledWater",
  "coffee",
  "parking"
];

// All available perks grouped by category (from PerkSelections.jsx)
const ALL_PERKS_BY_CATEGORY = {
  "Audio Equipment": [
    { name: "speakerMic", label: "Speaker microphone" },
    { name: "backupMic", label: "Backup microphone" },
    { name: "speaker", label: "Speaker" },
    { name: "mixer", label: "Mixer" },
    { name: "soundControl", label: "Sound control panel" },
    { name: "amplifier", label: "Amplifier" },
    { name: "acoustic", label: "Room acoustic treatment" }
  ],
  "Visual Equipment": [
    { name: "projector", label: "Projector" },
    { name: "ledScreen", label: "LED screen" },
    { name: "projectorScreen", label: "Projector screen" },
    { name: "hdmiCable", label: "HDMI cable" },
    { name: "vgaCable", label: "VGA cable" },
    { name: "adapters", label: "Adapters and converters" },
    { name: "clicker", label: "Presentation clicker" },
    { name: "laserPointer", label: "Laser pointer" },
    { name: "stageLighting", label: "Stage lighting" }
  ],
  "Technical Equipment": [
    { name: "laptop", label: "Laptop" },
    { name: "desktop", label: "Desktop computer" },
    { name: "extensionCords", label: "Extension cords" },
    { name: "chargers", label: "Chargers" },
    { name: "wiredInternet", label: "Wired internet" },
    { name: "wifi", label: "Wi-Fi" },
    { name: "router", label: "Router" },
    { name: "wifiAccessPoint", label: "Wi-Fi access point" }
  ],
  "Furniture": [
    { name: "speakerPodium", label: "Speaker podium" },
    { name: "speakerTable", label: "Table for speakers" },
    { name: "speakerChair", label: "Chair for speakers" },
    { name: "participantChairs", label: "Chairs for participants" },
    { name: "participantDesks", label: "Desk for participants" },
    { name: "bottledWater", label: "Water 0.5L" },
    { name: "waterCooler", label: "Water from cooler" },
    { name: "cups", label: "Cups" }
  ],
  "Miscellaneous": [
    { name: "nameTags", label: "Name tags" },
    { name: "flipChart", label: "Flip chart" },
    { name: "markers", label: "Markers" },
    { name: "paper", label: "Paper" },
    { name: "airConditioner", label: "Air conditioner" },
    { name: "ventilation", label: "Ventilation system" },
    { name: "signage", label: "Directional signage" },
    { name: "registrationDesk", label: "Registration desk" }
  ],
  "Safety": [
    { name: "fireExtinguisher", label: "Fire extinguisher" },
    { name: "firstAidKit", label: "First aid kit" },
    { name: "evacuationSigns", label: "Evacuation signs" }
  ],
  "Services": [
    { name: "catering", label: "Catering Available" },
    { name: "coffee", label: "Coffee Service" },
    { name: "parking", label: "On-site Parking" }
  ]
};

/**
 * PerksFilterProvider - Manages perks filter state following SOLID principles
 * 
 * Single Responsibility: Only handles perks filtering logic
 * Open/Closed: Extensible for new perk types without modification
 * DRY: Centralized perks data and filtering logic
 */
export const PerksFilterProvider = ({ children }) => {
  // State for selected perks filter
  const [selectedPerks, setSelectedPerks] = useState([]);
  
  // State for controlling expanded view of all perks
  const [showAllPerks, setShowAllPerks] = useState(false);

  // Single responsibility: Add a perk to filter
  const addPerk = useCallback((perkName) => {
    setSelectedPerks(prev => {
      if (!prev.includes(perkName)) {
        return [...prev, perkName];
      }
      return prev;
    });
  }, []);

  // Single responsibility: Remove a perk from filter
  const removePerk = useCallback((perkName) => {
    setSelectedPerks(prev => prev.filter(perk => perk !== perkName));
  }, []);

  // Single responsibility: Toggle perk selection
  const togglePerk = useCallback((perkName) => {
    setSelectedPerks(prev => {
      if (prev.includes(perkName)) {
        return prev.filter(perk => perk !== perkName);
      }
      return [...prev, perkName];
    });
  }, []);

  // Single responsibility: Clear all selected perks
  const clearAllPerks = useCallback(() => {
    setSelectedPerks([]);
  }, []);

  // Single responsibility: Check if a perk is selected
  const isPerkSelected = useCallback((perkName) => {
    return selectedPerks.includes(perkName);
  }, [selectedPerks]);

  // Memoized relevant perks with labels for performance
  const relevantPerksWithLabels = useMemo(() => {
    const allPerks = Object.values(ALL_PERKS_BY_CATEGORY).flat();
    return MOST_RELEVANT_PERKS.map(perkName => {
      const perk = allPerks.find(p => p.name === perkName);
      return perk || { name: perkName, label: perkName };
    });
  }, []);

  // Memoized filter function for places based on selected perks
  const filterPlacesByPerks = useCallback((places) => {
    if (selectedPerks.length === 0) {
      return places;
    }

    return places.filter(place => {
      // Check if place has all selected perks
      return selectedPerks.every(selectedPerk => {
        return place.perks && place.perks.includes(selectedPerk);
      });
    });
  }, [selectedPerks]);

  // Context value following interface segregation principle
  const contextValue = useMemo(() => ({
    // State
    selectedPerks,
    showAllPerks,
    
    // Actions
    addPerk,
    removePerk,
    togglePerk,
    clearAllPerks,
    setShowAllPerks,
    
    // Utilities
    isPerkSelected,
    filterPlacesByPerks,
    
    // Data
    relevantPerksWithLabels,
    allPerksByCategory: ALL_PERKS_BY_CATEGORY,
    mostRelevantPerks: MOST_RELEVANT_PERKS,
    
    // Computed values
    hasSelectedPerks: selectedPerks.length > 0,
    selectedPerksCount: selectedPerks.length
  }), [
    selectedPerks,
    showAllPerks,
    addPerk,
    removePerk,
    togglePerk,
    clearAllPerks,
    isPerkSelected,
    filterPlacesByPerks,
    relevantPerksWithLabels
  ]);

  return (
    <PerksFilterContext.Provider value={contextValue}>
      {children}
    </PerksFilterContext.Provider>
  );
};

export default PerksFilterContext;
