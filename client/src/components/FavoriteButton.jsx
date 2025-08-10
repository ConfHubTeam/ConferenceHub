import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { UserContext } from './UserContext';

export default function FavoriteButton({ place, className = "" }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isToggling, setIsToggling] = useState(false);
  const isPlaceFavorited = isFavorite(place.id);

  // Don't show favorites for hosts or agents
  if (user?.userType === 'host' || user?.userType === 'agent') {
    return null;
  }

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }
    
    if (isToggling) return; // Prevent multiple clicks
    
    try {
      setIsToggling(true);
      await toggleFavorite(place);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={`p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200 z-10 ${
        isToggling ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      aria-label={isPlaceFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isToggling ? (
        <div className="w-5 h-5 animate-spin">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <svg 
          className={`w-5 h-5 transition-colors duration-200 ${
            isPlaceFavorited 
              ? 'text-red-500 fill-current' 
              : 'text-gray-600 hover:text-red-500'
          }`} 
          fill={isPlaceFavorited ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
    </button>
  );
}
