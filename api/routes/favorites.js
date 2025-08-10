const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authenticateToken } = require('../middleware/auth');

// All favorites routes require authentication
router.use(authenticateToken);

// GET /api/favorites - Get user's favorites
router.get('/', favoritesController.getFavorites);

// POST /api/favorites - Add place to favorites
router.post('/', favoritesController.addToFavorites);

// DELETE /api/favorites/:placeId - Remove place from favorites
router.delete('/:placeId', favoritesController.removeFromFavorites);

// GET /api/favorites/status/:placeId - Check if place is favorited
router.get('/status/:placeId', favoritesController.checkFavoriteStatus);

// POST /api/favorites/statuses - Get favorite status for multiple places
router.post('/statuses', favoritesController.getFavoriteStatuses);

module.exports = router;
