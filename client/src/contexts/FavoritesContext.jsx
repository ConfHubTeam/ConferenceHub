import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserContext } from '../components/UserContext';
import api from '../utils/api';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useContext(UserContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load favorites from server when user changes
  useEffect(() => {
    if (user?.id) {
      loadFavorites();
    } else {
      // Clear favorites when user logs out
      setFavorites([]);
      setError(null);
    }
  }, [user?.id]);

  // Load favorites from server
    const loadFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/favorites');
      setFavorites(response.data.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError(error.response?.data?.error || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Add place to favorites
  const addToFavorites = async (place) => {
    if (!user) return;

    try {
      await api.post('/favorites', { placeId: place.id });
      setFavorites(prev => [...prev, place]);
      setError(null);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      setError(error.response?.data?.error || 'Failed to add to favorites');
      throw error;
    }
  };

  // Remove place from favorites
    const removeFromFavorites = async (placeId) => {
    if (!user) return;

    try {
      await api.delete(`/favorites/${placeId}`);
      setFavorites(prev => prev.filter(place => place.id !== placeId));
      setError(null);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      setError(error.response?.data?.error || 'Failed to remove from favorites');
      throw error;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (place) => {
    if (isFavorite(place.id)) {
      return await removeFromFavorites(place.id);
    } else {
      return await addToFavorites(place);
    }
  };

  // Check if place is in favorites
  const isFavorite = (placeId) => {
    return favorites.some(fav => fav.id === placeId);
  };

  // Clear all favorites (for logout or user preference)
  const clearAllFavorites = async () => {
    if (!user) return;

    try {
      // Remove all favorites one by one (or implement bulk delete API)
      const favoriteIds = favorites.map(place => place.id);
      await Promise.all(favoriteIds.map(id => api.delete(`/favorites/${id}`)));
      setFavorites([]);
      setError(null);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      setError(error.response?.data?.error || 'Failed to clear favorites');
      throw error;
    }
  };

    // Get favorite status for multiple places
  const getFavoriteStatuses = async (placeIds) => {
    if (!user?.id || !placeIds.length) {
      return {};
    }

    try {
      const response = await api.post('/favorites/statuses', { placeIds });
      return response.data.statuses || {};
    } catch (error) {
      console.error('Error getting favorite statuses:', error);
      return {};
    }
  };

  // Refresh favorites from server
  const refreshFavorites = () => {
    if (user?.id) {
      loadFavorites();
    }
  };

  const value = {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    getFavoriteStatuses,
    refreshFavorites,
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
