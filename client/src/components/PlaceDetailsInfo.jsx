import React from "react";
import { useTranslation } from 'react-i18next';
import PriceDisplay from "./PriceDisplay";

/**
 * PlaceDetailsInfo Component
 * 
 * Displays comprehensive details about a conference room including pricing,
 * capacity, time constraints, and room properties in an organized layout.
 */
export default function PlaceDetailsInfo({ placeDetail }) {
  const { t } = useTranslation('places');
  const {
    price,
    currency,
    maxGuests,
    minimumHours,
    fullDayHours,
    fullDayDiscountPrice,
    cooldown,
    squareMeters,
    isHotel,
    checkIn,
    checkOut
  } = placeDetail;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        {t('placeDetailsInfo.title')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pricing Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.467-.22-2.121-.659C8.737 10.46 8.737 9.04 9.879 8.182c1.171-.879 3.07-.879 4.242 0L15 9" />
            </svg>
            {t('placeDetailsInfo.sections.pricing')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('placeDetailsInfo.pricing.hourlyRate')}:</span>
              <span className="font-bold text-blue-900">
                <PriceDisplay 
                  price={price} 
                  currency={currency} 
                  bold={true}
                  className="inline-block"
                />
              </span>
            </div>
            {fullDayDiscountPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('placeDetailsInfo.pricing.fullDay', { hours: fullDayHours })}:</span>
                <span className="font-bold text-green-700">
                  <PriceDisplay 
                    price={fullDayDiscountPrice} 
                    currency={currency} 
                    bold={true}
                    className="inline-block"
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Capacity & Requirements */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {t('placeDetailsInfo.sections.capacity')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('placeDetailsInfo.capacity.maxAttendees')}:</span>
              <span className="font-bold text-green-900">{maxGuests} {t('placeDetailsInfo.capacity.people')}</span>
            </div>
            {squareMeters && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('placeDetailsInfo.capacity.roomSize')}:</span>
                <span className="font-bold text-green-900">{squareMeters} m²</span>
              </div>
            )}
            {isHotel && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('placeDetailsInfo.capacity.type')}:</span>
                <span className="font-bold text-green-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m0-18H21l-1.5 6L21 15H3.75M6.75 6.75h.75a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75zM12.75 6.75h.75a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75z" />
                  </svg>
                  {t('placeDetailsInfo.capacity.hotel')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time Constraints */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('placeDetailsInfo.sections.timeRules')}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('placeDetailsInfo.timeRules.minBooking')}:</span>
              <span className="font-bold text-purple-900">{minimumHours}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('placeDetailsInfo.timeRules.cooldown')}:</span>
              <span className="font-bold text-purple-900">{cooldown} {t('placeDetailsInfo.timeRules.min')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
