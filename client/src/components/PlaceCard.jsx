import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CloudinaryImage from "./CloudinaryImage";
import PriceDisplay from "./PriceDisplay";

export default function PlaceCard({ place, showActions = true, preserveSearchParams = false }) {
  const { t } = useTranslation("places");
  const location = useLocation();
  
  // Create place URL with optional search parameters preservation
  // This enables filtered date/time to be passed to place detail page
  const getPlaceUrl = () => {
    const baseUrl = `/place/${place.id}`;
    return preserveSearchParams ? `${baseUrl}${location.search}` : baseUrl;
  };
  return (
    <div className="card-base group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
      {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          {place.photos?.length > 0 ? (
            <CloudinaryImage
              photo={place.photos[0]}
              alt={place.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

      {/* Content */}
      <div className="card-content">
        <Link to={getPlaceUrl()} className="block">
          <h3 className="text-lg font-medium text-navy-800 mb-1 truncate group-hover:text-navy-600 transition-colors">
            {place.title}
          </h3>
        </Link>
                  <div className="flex items-center text-gray-500 text-sm mb-2">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="truncate">{place.address}</p>
          </div>

          {/* Host Info */}
          {place.owner && (
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="truncate">{t("card.hosted_by")} {place.owner.name}</p>
            </div>
          )}
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          {/* Always render guests section to maintain consistent card height */}
          <div className="flex items-center text-xs text-slate-600 h-5">
            {place.maxGuests ? (
              <>
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {place.maxGuests === 1 
                  ? t("card.up_to_guests_single", { count: place.maxGuests })
                  : t("card.up_to_guests", { count: place.maxGuests })
                }
              </>
            ) : (
              <span className="invisible">placeholder</span>
            )}
          </div>
          
          {/* Always render square meters section to maintain consistent card height */}
          <div className="flex items-center text-xs text-slate-600 h-5">
            {place.squareMeters ? (
              <>
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {t("card.square_meters", { size: place.squareMeters })}
              </>
            ) : (
              <span className="invisible">placeholder</span>
            )}
          </div>
        </div>
        
        {/* Price and Actions */}
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-lg font-semibold text-navy-700 flex-shrink-0">
              <PriceDisplay 
                price={place.price} 
                currency={place.currency}
                suffix={t("card.price_per_hour")}
                priceClassName="text-lg font-semibold"
              />
            </span>
          </div>
          
          {/* Details Button - Always visible */}
          <Link 
            to={getPlaceUrl()}
            className="btn-primary w-full text-center py-2 rounded-lg font-medium transition-colors"
          >
            {t("card.actions.details")}
          </Link>
        </div>
      </div>
    </div>
  );
}
