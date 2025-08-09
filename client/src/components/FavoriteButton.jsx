import { useFavorites } from '../contexts/FavoritesContext';

export default function FavoriteButton({ place, className = "" }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isPlaceFavorited = isFavorite(place.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(place);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200 z-10 ${className}`}
      aria-label={isPlaceFavorited ? "Remove from favorites" : "Add to favorites"}
    >
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
    </button>
  );
}
