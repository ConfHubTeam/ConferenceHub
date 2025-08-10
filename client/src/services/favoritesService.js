import api from '../utils/api';

const favoritesService = {
  // Get user's favorites
  async getFavorites() {
    try {
      const response = await api.get('/favorites');
      return response.data;
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw error;
    }
  },

  // Add place to favorites
  async addToFavorites(placeId) {
    try {
      const response = await api.post('/favorites', { placeId });
      return response.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Remove place from favorites
  async removeFromFavorites(placeId) {
    try {
      const response = await api.delete(`/favorites/${placeId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  // Check if place is favorited
  async checkFavoriteStatus(placeId) {
    try {
      const response = await api.get(`/favorites/status/${placeId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  },

  // Get favorite statuses for multiple places
  async getFavoriteStatuses(placeIds) {
    try {
      const response = await api.post('/favorites/statuses', { placeIds });
      return response.data;
    } catch (error) {
      console.error('Error getting favorite statuses:', error);
      throw error;
    }
  }
};

export default favoritesService;
