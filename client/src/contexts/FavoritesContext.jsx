import { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage on initial load
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (place) => {
    setFavorites(prev => {
      // Check if place is already in favorites
      if (prev.some(fav => fav.id === place.id)) {
        return prev;
      }
      return [...prev, place];
    });
  };

  const removeFromFavorites = (placeId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== placeId));
  };

  const toggleFavorite = (place) => {
    if (isFavorite(place.id)) {
      removeFromFavorites(place.id);
    } else {
      addToFavorites(place);
    }
  };

  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.id === placeId);
  };

  const clearAllFavorites = () => {
    setFavorites([]);
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount: favorites.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
