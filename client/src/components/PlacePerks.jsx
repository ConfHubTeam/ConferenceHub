import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getPerkIcon } from "./perkIcons";

/**
 * PlacePerks Component
 * 
 * Displays the perks/amenities of a conference room in Airbnb-style layout
 * with priority amenities shown first and a modal for viewing all amenities.
 */
function PlacePerks({ perks }) {
  const { t } = useTranslation(['places', 'search', 'common']);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  if (!perks || perks.length === 0) {
    return null;
  }

  // Conference room priority amenities with react-icons
  const priorityAmenities = {
    wifi: {
      label: t('search:filters.modals.perks.items.wifi'),
      icon: getPerkIcon('wifi')
    },
    projector: {
      label: t('search:filters.modals.perks.items.projector'),
      icon: getPerkIcon('projector')
    },
    ledScreen: {
      label: t('search:filters.modals.perks.items.ledScreen'),
      icon: getPerkIcon('ledScreen')
    },
    speakerMic: {
      label: t('search:filters.modals.perks.items.speakerMic'),
      icon: getPerkIcon('speakerMic')
    },
    airConditioner: {
      label: t('search:filters.modals.perks.items.airConditioner'),
      icon: getPerkIcon('airConditioner')
    },
    parking: {
      label: t('search:filters.modals.perks.items.parking'),
      icon: getPerkIcon('parking')
    },
    coffee: {
      label: t('search:filters.modals.perks.items.coffee'),
      icon: getPerkIcon('coffee')
    },
    catering: {
      label: t('search:filters.modals.perks.items.catering'),
      icon: getPerkIcon('catering')
    }
  };

  // All amenities mapping with icons and categories for the modal
  const allAmenitiesMapping = {
    // Audio Equipment
    speakerMic: { label: t('search:filters.modals.perks.items.speakerMic'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    backupMic: { label: t('search:filters.modals.perks.items.backupMic'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    speaker: { label: t('search:filters.modals.perks.items.speaker'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    mixer: { label: t('search:filters.modals.perks.items.mixer'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    soundControl: { label: t('search:filters.modals.perks.items.soundControl'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    amplifier: { label: t('search:filters.modals.perks.items.amplifier'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    acoustic: { label: t('search:filters.modals.perks.items.acoustic'), category: t('search:filters.modals.perks.categories.Audio_Equipment') },
    
    // Visual Equipment
    projector: { label: t('search:filters.modals.perks.items.projector'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    ledScreen: { label: t('search:filters.modals.perks.items.ledScreen'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    projectorScreen: { label: t('search:filters.modals.perks.items.projectorScreen'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    hdmiCable: { label: t('search:filters.modals.perks.items.hdmiCable'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    vgaCable: { label: t('search:filters.modals.perks.items.vgaCable'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    adapters: { label: t('search:filters.modals.perks.items.adapters'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    clicker: { label: t('search:filters.modals.perks.items.clicker'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    laserPointer: { label: t('search:filters.modals.perks.items.laserPointer'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    stageLighting: { label: t('search:filters.modals.perks.items.stageLighting'), category: t('search:filters.modals.perks.categories.Visual_Equipment') },
    
    // Technical Equipment
    laptop: { label: t('search:filters.modals.perks.items.laptop'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    desktop: { label: t('search:filters.modals.perks.items.desktop'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    extensionCords: { label: t('search:filters.modals.perks.items.extensionCords'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    chargers: { label: t('search:filters.modals.perks.items.chargers'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    wiredInternet: { label: t('search:filters.modals.perks.items.wiredInternet'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    wifi: { label: t('search:filters.modals.perks.items.wifi'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    router: { label: t('search:filters.modals.perks.items.router'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    wifiAccessPoint: { label: t('search:filters.modals.perks.items.wifiAccessPoint'), category: t('search:filters.modals.perks.categories.Technical_Equipment') },
    
    // Furniture & Comfort
    speakerPodium: { label: t('search:filters.modals.perks.items.speakerPodium'), category: t('search:filters.modals.perks.categories.Furniture') },
    speakerTable: { label: t('search:filters.modals.perks.items.speakerTable'), category: t('search:filters.modals.perks.categories.Furniture') },
    speakerChair: { label: t('search:filters.modals.perks.items.speakerChair'), category: t('search:filters.modals.perks.categories.Furniture') },
    participantChairs: { label: t('search:filters.modals.perks.items.participantChairs'), category: t('search:filters.modals.perks.categories.Furniture') },
    participantDesks: { label: t('search:filters.modals.perks.items.participantDesks'), category: t('search:filters.modals.perks.categories.Furniture') },
    bottledWater: { label: t('search:filters.modals.perks.items.bottledWater'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    waterCooler: { label: t('search:filters.modals.perks.items.waterCooler'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    cups: { label: t('search:filters.modals.perks.items.cups'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    airConditioner: { label: t('search:filters.modals.perks.items.airConditioner'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    ventilation: { label: t('search:filters.modals.perks.items.ventilation'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    
    // Services & Amenities  
    catering: { label: t('search:filters.modals.perks.items.catering'), category: t('search:filters.modals.perks.categories.Services') },
    coffee: { label: t('search:filters.modals.perks.items.coffee'), category: t('search:filters.modals.perks.categories.Services') },
    parking: { label: t('search:filters.modals.perks.items.parking'), category: t('search:filters.modals.perks.categories.Services') },
    
    // Office Supplies
    nameTags: { label: t('search:filters.modals.perks.items.nameTags'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    flipChart: { label: t('search:filters.modals.perks.items.flipChart'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    markers: { label: t('search:filters.modals.perks.items.markers'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    paper: { label: t('search:filters.modals.perks.items.paper'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    signage: { label: t('search:filters.modals.perks.items.signage'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    registrationDesk: { label: t('search:filters.modals.perks.items.registrationDesk'), category: t('search:filters.modals.perks.categories.Miscellaneous') },
    
    // Safety & Security
    fireExtinguisher: { label: t('search:filters.modals.perks.items.fireExtinguisher'), category: t('search:filters.modals.perks.categories.Safety') },
    firstAidKit: { label: t('search:filters.modals.perks.items.firstAidKit'), category: t('search:filters.modals.perks.categories.Safety') },
    evacuationSigns: { label: t('search:filters.modals.perks.items.evacuationSigns'), category: t('search:filters.modals.perks.categories.Safety') }
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
      category: t('search:filters.modals.perks.categories.Miscellaneous'),
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
    <div>
      <h2 className="text-heading-2 mb-6 text-text-primary flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-accent-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('placePerks.whatThisPlaceOffers')}
      </h2>
      
      {/* Main Amenities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {mainDisplayItems.map((amenity, index) => (
          <div key={index} className="flex items-center py-4 border-b border-border-light last:border-b-0 hover:bg-bg-secondary/50 transition-colors rounded-md px-2">
            <div className="mr-4 text-accent-primary">
              {amenity.icon || getPerkIcon(amenity.key) || (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <span className="text-text-primary font-medium text-body">{amenity.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Show All Amenities Button */}
      {hasMoreAmenities && (
        <button
          onClick={() => setShowAllAmenities(true)}
          className="btn-outline btn-size-md"
        >
          <span>{t('places:listing.showAllAmenities', { count: availableAmenities.length })}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {/* Full Amenities Modal */}
      {showAllAmenities && (
        <div className="modal-overlay">
          <div className="modal-container max-w-4xl">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="text-heading-3 text-text-primary">{t('placePerks.whatThisPlaceOffers')}</h3>
              <button
                onClick={() => setShowAllAmenities(false)}
                className="p-2 hover:bg-bg-secondary rounded-full transition-colors text-text-secondary hover:text-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-body">
              {Object.entries(categorizedAmenities).map(([category, amenities]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h4 className="text-heading-3 text-text-primary mb-4 flex items-center">
                    <div className="w-2 h-2 bg-accent-primary rounded-full mr-3"></div>
                    {category}
                    <span className="ml-2 text-caption text-text-muted font-normal">({amenities.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center py-3 px-4 bg-bg-secondary rounded-lg border border-border-light hover:border-accent-primary/30 transition-colors">
                        <div className="mr-3 text-accent-primary">
                          {amenity.icon || getPerkIcon(amenity.key) || (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <span className="text-text-primary font-medium text-body">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setShowAllAmenities(false)}
                className="btn-primary btn-size-md w-full"
              >
                {t('common:buttons.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlacePerks;
