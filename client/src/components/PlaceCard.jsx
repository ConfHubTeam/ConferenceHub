import { Link } from "react-router-dom";
import CloudinaryImage from "./CloudinaryImage";
import PriceDisplay from "./PriceDisplay";

export default function PlaceCard({ place, showActions = true }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <Link to={`/place/${place.id}`} className="block h-full">
          {place.photos?.[0] && (
            <CloudinaryImage
              photo={place.photos[0]}
              alt={place.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          )}
          {!place.photos?.[0] && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/place/${place.id}`} className="block">
          <h3 className="text-lg font-semibold mb-1 truncate hover:text-primary transition-colors">
            {place.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mb-3 truncate">{place.address}</p>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          {place.maxGuests && (
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Up to {place.maxGuests} guests
            </div>
          )}
          {place.squareMeters && (
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {place.squareMeters} m²
            </div>
          )}
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {place.checkIn} - {place.checkOut}
          </div>
        </div>
        
        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-lg font-semibold text-primary">
            <PriceDisplay 
              price={place.price} 
              currency={place.currency}
              suffix="/hour"
              priceClassName="text-lg font-semibold"
            />
          </span>
          
          {showActions && (
            <div className="flex gap-2">
              <Link 
                to={`/account/places/${place.id}`}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Edit
              </Link>
              <Link 
                to={`/place/${place.id}`}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
