const { UserFavorite, Place, User } = require('../models');
const Currency = require('../models/currency');
const { Op } = require('sequelize');

const favoritesController = {
  // Get user's favorites
  getFavorites: async (req, res) => {
    try {
      const userId = req.user.id;

      const favorites = await UserFavorite.findAll({
        where: { userId },
        include: [
          {
            model: Place,
            as: 'place',
            include: [
              {
                model: Currency,
                as: 'currency',
                attributes: ['id', 'name', 'code', 'charCode']
              }
            ],
            attributes: [
              'id', 'title', 'address', 'photos', 'description', 'price', 'currencyId',
              'lat', 'lng', 'maxGuests', 'average_rating', 'total_reviews',
              'minimumHours', 'squareMeters', 'isHotel'
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Extract place data from favorites
      const favoritesData = favorites.map(favorite => ({
        ...favorite.place.dataValues,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt
      }));

      res.json({
        success: true,
        favorites: favoritesData,
        count: favoritesData.length
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch favorites'
      });
    }
  },

  // Add place to favorites
  addToFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const { placeId } = req.body;

      if (!placeId) {
        return res.status(400).json({
          success: false,
          error: 'Place ID is required'
        });
      }

      // Check if place exists
      const place = await Place.findByPk(placeId);
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      // Check if already favorited
      const existingFavorite = await UserFavorite.findOne({
        where: { userId, placeId }
      });

      if (existingFavorite) {
        return res.status(409).json({
          success: false,
          error: 'Place already in favorites'
        });
      }

      // Add to favorites
      const favorite = await UserFavorite.create({
        userId,
        placeId
      });

      res.status(201).json({
        success: true,
        message: 'Place added to favorites',
        favorite: {
          id: favorite.id,
          placeId: favorite.placeId,
          createdAt: favorite.createdAt
        }
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to favorites'
      });
    }
  },

  // Remove place from favorites
  removeFromFavorites: async (req, res) => {
    try {
      const userId = req.user.id;
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json({
          success: false,
          error: 'Place ID is required'
        });
      }

      // Find and remove favorite
      const favorite = await UserFavorite.findOne({
        where: { userId, placeId }
      });

      if (!favorite) {
        return res.status(404).json({
          success: false,
          error: 'Favorite not found'
        });
      }

      await favorite.destroy();

      res.json({
        success: true,
        message: 'Place removed from favorites'
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from favorites'
      });
    }
  },

  // Check if place is favorited
  checkFavoriteStatus: async (req, res) => {
    try {
      const userId = req.user.id;
      const { placeId } = req.params;

      const favorite = await UserFavorite.findOne({
        where: { userId, placeId }
      });

      res.json({
        success: true,
        isFavorite: !!favorite
      });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check favorite status'
      });
    }
  },

  // Get favorite statuses for multiple places
  getFavoriteStatuses: async (req, res) => {
    try {
      const userId = req.user.id;
      const { placeIds } = req.body;

      if (!Array.isArray(placeIds) || placeIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Place IDs array is required'
        });
      }

      const favorites = await UserFavorite.findAll({
        where: {
          userId,
          placeId: {
            [Op.in]: placeIds
          }
        },
        attributes: ['placeId']
      });

      // Create status object
      const statuses = {};
      placeIds.forEach(placeId => {
        statuses[placeId] = false;
      });

      favorites.forEach(favorite => {
        statuses[favorite.placeId] = true;
      });

      res.json({
        success: true,
        statuses
      });
    } catch (error) {
      console.error('Error getting favorite statuses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get favorite statuses'
      });
    }
  },

  // Clear all favorites for user
  clearAllFavorites: async (req, res) => {
    try {
      const userId = req.user.id;

      const deletedCount = await UserFavorite.destroy({
        where: { userId }
      });

      res.json({
        success: true,
        message: `Removed ${deletedCount} favorites`,
        deletedCount
      });
    } catch (error) {
      console.error('Error clearing favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear favorites'
      });
    }
  }
};

module.exports = favoritesController;
