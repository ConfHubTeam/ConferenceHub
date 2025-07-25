const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { getUserDataFromToken } = require("../middleware/auth");

// Add middleware to attach getUserDataFromToken to req
router.use((req, res, next) => {
  req.getUserDataFromToken = () => getUserDataFromToken(req);
  next();
});

// Get user profile
router.get("/profile", userController.getProfile);

// Update user profile
router.put("/profile", userController.updateProfile);

// Get all users (agent only)
router.get("/", userController.getAllUsers);
router.get("/all", userController.getAllUsers); // Alias for /users endpoint

// Get system statistics (agent only)
router.get("/stats", userController.getStatistics);

// Get host statistics (host only)
router.get("/host-stats", userController.getHostStatistics);

// Get host reviews (host only)
router.get("/host-reviews", userController.getHostReviews);

// Delete own account (must come before /:id route to ensure proper matching)
router.delete("/account/delete", userController.deleteOwnAccount);

// Update a user (agent only)
router.put("/:id", userController.updateUser);

// Get admin contact information (public endpoint)
router.get("/admin/contact", userController.getAdminContact);

// Delete a user (agent only)
router.delete("/:id", userController.deleteUser);

module.exports = router;
