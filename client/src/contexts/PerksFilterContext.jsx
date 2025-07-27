import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

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
    { name: "speakerMic", labelKey: "search:filters.modals.perks.items.speakerMic" },
    { name: "backupMic", labelKey: "search:filters.modals.perks.items.backupMic" },
    { name: "speaker", labelKey: "search:filters.modals.perks.items.speaker" },
    { name: "mixer", labelKey: "search:filters.modals.perks.items.mixer" },
    { name: "soundControl", labelKey: "search:filters.modals.perks.items.soundControl" },
    { name: "amplifier", labelKey: "search:filters.modals.perks.items.amplifier" },
    { name: "acoustic", labelKey: "search:filters.modals.perks.items.acoustic" }
  ],
  "Visual Equipment": [
    { name: "projector", labelKey: "search:filters.modals.perks.items.projector" },
    { name: "ledScreen", labelKey: "search:filters.modals.perks.items.ledScreen" },
    { name: "projectorScreen", labelKey: "search:filters.modals.perks.items.projectorScreen" },
    { name: "hdmiCable", labelKey: "search:filters.modals.perks.items.hdmiCable" },
    { name: "vgaCable", labelKey: "search:filters.modals.perks.items.vgaCable" },
    { name: "adapters", labelKey: "search:filters.modals.perks.items.adapters" },
    { name: "clicker", labelKey: "search:filters.modals.perks.items.clicker" },
    { name: "laserPointer", labelKey: "search:filters.modals.perks.items.laserPointer" },
    { name: "stageLighting", labelKey: "search:filters.modals.perks.items.stageLighting" }
  ],
  "Technical Equipment": [
    { name: "laptop", labelKey: "search:filters.modals.perks.items.laptop" },
    { name: "desktop", labelKey: "search:filters.modals.perks.items.desktop" },
    { name: "extensionCords", labelKey: "search:filters.modals.perks.items.extensionCords" },
    { name: "chargers", labelKey: "search:filters.modals.perks.items.chargers" },
    { name: "wiredInternet", labelKey: "search:filters.modals.perks.items.wiredInternet" },
    { name: "wifi", labelKey: "search:filters.modals.perks.items.wifi" },
    { name: "router", labelKey: "search:filters.modals.perks.items.router" },
    { name: "wifiAccessPoint", labelKey: "search:filters.modals.perks.items.wifiAccessPoint" }
  ],
  "Furniture": [
    { name: "speakerPodium", labelKey: "search:filters.modals.perks.items.speakerPodium" },
    { name: "speakerTable", labelKey: "search:filters.modals.perks.items.speakerTable" },
    { name: "speakerChair", labelKey: "search:filters.modals.perks.items.speakerChair" },
    { name: "participantChairs", labelKey: "search:filters.modals.perks.items.participantChairs" },
    { name: "participantDesks", labelKey: "search:filters.modals.perks.items.participantDesks" },
    { name: "bottledWater", labelKey: "search:filters.modals.perks.items.bottledWater" },
    { name: "waterCooler", labelKey: "search:filters.modals.perks.items.waterCooler" },
    { name: "cups", labelKey: "search:filters.modals.perks.items.cups" }
  ],
  "Miscellaneous": [
    { name: "nameTags", labelKey: "search:filters.modals.perks.items.nameTags" },
    { name: "flipChart", labelKey: "search:filters.modals.perks.items.flipChart" },
    { name: "markers", labelKey: "search:filters.modals.perks.items.markers" },
    { name: "paper", labelKey: "search:filters.modals.perks.items.paper" },
    { name: "airConditioner", labelKey: "search:filters.modals.perks.items.airConditioner" },
    { name: "ventilation", labelKey: "search:filters.modals.perks.items.ventilation" },
    { name: "signage", labelKey: "search:filters.modals.perks.items.signage" },
    { name: "registrationDesk", labelKey: "search:filters.modals.perks.items.registrationDesk" }
  ],
  "Safety": [
    { name: "fireExtinguisher", labelKey: "search:filters.modals.perks.items.fireExtinguisher" },
    { name: "firstAidKit", labelKey: "search:filters.modals.perks.items.firstAidKit" },
    { name: "evacuationSigns", labelKey: "search:filters.modals.perks.items.evacuationSigns" }
  ],
  "Services": [
    { name: "catering", labelKey: "search:filters.modals.perks.items.catering" },
    { name: "coffee", labelKey: "search:filters.modals.perks.items.coffee" },
    { name: "parking", labelKey: "search:filters.modals.perks.items.parking" }
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
  const { t } = useTranslation();
  
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
      return perk ? {
        ...perk,
        label: t(perk.labelKey) || perk.name
      } : { 
        name: perkName, 
        labelKey: `search:filters.modals.perks.items.${perkName}`,
        label: t(`search:filters.modals.perks.items.${perkName}`) || perkName
      };
    });
  }, [t]);

  // Memoized all perks by category with translated labels
  const allPerksByCategoryWithLabels = useMemo(() => {
    const translatedCategories = {};
    Object.entries(ALL_PERKS_BY_CATEGORY).forEach(([categoryName, perks]) => {
      translatedCategories[categoryName] = perks.map(perk => ({
        ...perk,
        label: t(perk.labelKey) || perk.name
      }));
    });
    return translatedCategories;
  }, [t]);

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
    allPerksByCategoryWithLabels,
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
