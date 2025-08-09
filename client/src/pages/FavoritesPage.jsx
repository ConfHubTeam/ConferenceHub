import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCurrency } from '../contexts/CurrencyContext';
import CloudinaryImage from '../components/CloudinaryImage';
import PriceDisplay from '../components/PriceDisplay';
import FavoriteButton from '../components/FavoriteButton';
import AccountNav from '../components/AccountNav';

export default function FavoritesPage() {
  const { t, ready } = useTranslation(['favorites', 'places', 'common']);
  const { favorites, clearAllFavorites, favoritesCount } = useFavorites();
  const { currency } = useCurrency();

  const handleClearAll = () => {
    clearAllFavorites();
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Account Navigation */}
      <AccountNav />
      
      <div className="spacing-container spacing-section max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-end items-center mb-8">
          {favoritesCount > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors"
            >
              {t('favorites:page.clearAll')}
            </button>
          )}
        </div>

      {/* Empty State */}
      {favoritesCount === 0 ? (
        <div className="text-center py-16">
          <div className="mb-6">
            <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('favorites:page.empty.title')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('favorites:page.empty.description')}
          </p>
          <Link
            to="/places"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('favorites:page.empty.browseButton')}
          </Link>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((place) => (
            <div 
              key={place.id} 
              className="relative group bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
            >
              {/* Favorite Button */}
              <div className="absolute top-3 right-3 z-10">
                <FavoriteButton place={place} />
              </div>

              <Link to={`/place/${place.id}`}>
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
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
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate mb-1">
                    {place.title}
                  </h3>
                  <p className="text-gray-500 text-sm truncate mb-3">
                    {place.address}
                  </p>

                  {/* Rating and Guests */}
                  <div className="flex items-center justify-between mb-3">
                    {/* Rating */}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 fill-current text-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>
                        {place.averageRating || t('places:card.new_rating')}
                      </span>
                      {place.totalReviews > 0 && (
                        <span className="ml-1">({place.totalReviews})</span>
                      )}
                    </div>

                    {/* Max Guests */}
                    {place.maxGuests && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {place.maxGuests} {t('places:card.guests')}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <PriceDisplay 
                      price={place.price} 
                      currency={currency}
                      className="text-lg font-semibold"
                    />
                    <span className="text-sm text-gray-500">
                      /{t('places:card.night')}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
