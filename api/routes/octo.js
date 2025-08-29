const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const octoController = require('../controllers/octoController');

// Prepare payment (authenticated)
router.post('/prepare', authenticateToken, octoController.prepare);

// Notification callback from Octo (no auth)
router.post('/notify', octoController.notify);

module.exports = router;
