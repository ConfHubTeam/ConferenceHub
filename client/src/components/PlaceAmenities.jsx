import React from "react";
import { useTranslation } from "react-i18next";
import { getPerkIcon } from "./perkIcons";

/**
 * PlaceAmenities Component
 * 
 * Displays the perks/amenities of a conference room in an organized grid format.
 */
export default function PlaceAmenities({ perks }) {
  const { t } = useTranslation(['search', 'places']);
  if (!perks || perks.length === 0) {
    return null;
  }

  // Define perk icons mapping - labels come from translations
  const perkMapping = {
    wifi: {
      labelKey: "search:filters.modals.perks.items.wifi",
      icon: getPerkIcon("wifi")
    },
    parking: {
      labelKey: "search:filters.modals.perks.items.parking",
      icon: getPerkIcon("parking")
    },
    tv: {
      labelKey: "search:filters.modals.perks.items.ledScreen",
      icon: getPerkIcon("ledScreen")
    },
    radio: {
      labelKey: "search:filters.modals.perks.items.speaker",
      icon: getPerkIcon("speakerMic")
    },
    pets: {
      labelKey: "search:filters.modals.perks.items.pets",
      icon: getPerkIcon("pets")
    },
    entrance: {
      labelKey: "search:filters.modals.perks.items.entrance",
      icon: getPerkIcon("entrance")
    },
    projector: {
      labelKey: "search:filters.modals.perks.items.projector",
      icon: getPerkIcon("projector")
    },
    whiteboard: {
      labelKey: "search:filters.modals.perks.items.flipChart",
      icon: getPerkIcon("flipChart")
    },
    coffee: {
      labelKey: "search:filters.modals.perks.items.coffee",
      icon: getPerkIcon("coffee")
    },
    kitchen: {
      labelKey: "search:filters.modals.perks.items.kitchen",
      icon: getPerkIcon("kitchen")
    }
  };

  // Get perk details with fallback for unknown perks
  const getPerkDetails = (perk) => {
    const perkKey = typeof perk === 'string' ? perk.toLowerCase() : perk;
    const perkData = perkMapping[perkKey];
    if (perkData) {
      return {
        label: t(perkData.labelKey),
        icon: perkData.icon
      };
    }
    // Fallback for unknown perks
    return {
      label: typeof perk === 'string' ? perk.charAt(0).toUpperCase() + perk.slice(1) : String(perk),
      icon: getPerkIcon(perkKey)
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-purple-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        {t('places:placePerks.whatThisPlaceOffers')}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {perks.map((perk, index) => {
          const perkDetails = getPerkDetails(perk);
          
          return (
            <div 
              key={index}
              className="flex flex-col items-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
            >
              <div className="text-purple-600 mb-2">
                {perkDetails.icon}
              </div>
              <span className="text-sm font-medium text-gray-800 text-center leading-tight">
                {perkDetails.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Additional info if many amenities */}
      {perks.length > 8 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-purple-800 text-sm text-center">
            <strong>{t('places:placePerks.showAllAmenities', { count: perks.length })}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
