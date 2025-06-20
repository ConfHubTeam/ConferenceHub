const { User, Place, Booking } = require("../models");
const { sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { getUserDataFromToken } = require("../middleware/auth");

/**
 * Get the current user's profile
 */
const getProfile = async (req, res) => {
  // Try to get token from cookies first
  let token = req.cookies.token;
  
  // If not in cookies, check Authorization header
  if (!token && req.headers.authorization) {
    // Extract token from Bearer token format
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (token) {
    // reloading info of the logged in user after refreshing
    jwt.verify(token, authConfig.jwt.secret, {}, async (err, userData) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      try {
        // Update Mongoose findById to Sequelize findByPk
        const user = await User.findByPk(userData.id, {
          // Include all relevant user attributes, including phone number
          attributes: [
            'id', 'name', 'email', 'phoneNumber', 'userType', 
            'telegramId', 'telegramUsername', 'telegramFirstName',
            'telegramPhotoUrl', 'telegramPhone', 'telegramLinked'
          ]
        });
        
        if (!user) {
          // User might have been deleted but token is still valid
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User data found:', user.id, user.name, user.email);
        res.json(user);
      } catch (error) {
        console.error('Database error in /profile:', error);
        res.status(500).json({ error: 'Server error while retrieving user profile' });
      }
    });
  } else {
    console.log('No token found in either cookies or Authorization header');
    res.json(null);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { name, phoneNumber } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate phone number format if provided
    if (phoneNumber && phoneNumber.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Please enter a valid phone number' });
      }
    }

    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber.trim() !== '') {
      const existingUser = await User.findOne({
        where: {
          phoneNumber: phoneNumber.trim(),
          id: { [require('sequelize').Op.ne]: userData.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Phone number is already in use by another user' });
      }
    }

    // Update user profile
    const updateData = {
      name: name.trim()
    };

    // Only update phone number if provided
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber.trim() || null;
    }

    await User.update(updateData, {
      where: { id: userData.id }
    });

    // Fetch updated user data
    const updatedUser = await User.findByPk(userData.id, {
      attributes: [
        'id', 'name', 'email', 'phoneNumber', 'userType', 
        'telegramId', 'telegramUsername', 'telegramFirstName',
        'telegramPhotoUrl', 'telegramPhone', 'telegramLinked'
      ]
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get all users (for agents only)
 */
const getAllUsers = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access user lists" });
    }
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phoneNumber', 'userType', 'createdAt']
    });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Delete a user (for agents only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.query;
    const userData = await req.getUserDataFromToken();
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can delete users" });
    }
    
    // Prevent agents from deleting themselves
    if (id === userData.id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    
    // Additional safety check - require confirmation parameter
    if (confirmation !== 'true') {
      return res.status(400).json({ error: "Confirmation parameter required to delete user" });
    }
    
    // Find the user to delete
    const userToDelete = await User.findByPk(id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Log the deletion attempt for audit purposes
    console.log(`Agent ${userData.id} (${userData.email}) attempting to delete user ${id} (${userToDelete.email})`);
    
    // First, delete all bookings associated with this user
    await Booking.destroy({
      where: { userId: id }
    });
    
    // For hosts, delete all their places and the bookings for those places
    if (userToDelete.userType === 'host') {
      // Find all places owned by this host
      const places = await Place.findAll({
        where: { ownerId: id }
      });
      
      // Delete all bookings for each place
      for (const place of places) {
        await Booking.destroy({
          where: { placeId: place.id }
        });
      }
      
      // Delete all places owned by this host
      await Place.destroy({
        where: { ownerId: id }
      });
    }
    
    // Finally, delete the user
    await userToDelete.destroy();
    
    // Log successful deletion
    console.log(`User ${id} (${userToDelete.email}) successfully deleted by agent ${userData.id}`);
    
    res.json({ success: true, message: "User and all associated data deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Delete own account
 */
const deleteOwnAccount = async (req, res) => {
  try {
    const { confirmation } = req.query;
    const userData = await req.getUserDataFromToken();
    
    // Verify user is authenticated
    if (!userData || !userData.id) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Additional safety check - require confirmation parameter
    if (confirmation !== 'true') {
      return res.status(400).json({ error: "Confirmation parameter required to delete account" });
    }
    
    // Find the user to delete
    const userToDelete = await User.findByPk(userData.id);
    
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Log the deletion attempt for audit purposes
    console.log(`User ${userData.id} (${userData.email}) attempting to delete their own account`);
    
    // First, delete all bookings associated with this user
    await Booking.destroy({
      where: { userId: userData.id }
    });
    
    // For hosts, delete all their places and the bookings for those places
    if (userToDelete.userType === 'host') {
      // Find all places owned by this host
      const places = await Place.findAll({
        where: { ownerId: userData.id }
      });
      
      // Delete all bookings for each place
      for (const place of places) {
        await Booking.destroy({
          where: { placeId: place.id }
        });
      }
      
      // Delete all places owned by this host
      await Place.destroy({
        where: { ownerId: userData.id }
      });
    }
    
    // Clear authentication cookies before deleting the user
    // Clear all cookies
    Object.keys(req.cookies).forEach(cookieName => {
      res.clearCookie(cookieName, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
    });
    
    // Clear the main token cookie
    res.clearCookie("token", {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    // Clear the session
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          console.error('Error destroying session during account deletion:', err);
        }
      });
    }
    
    // Finally, delete the user
    await userToDelete.destroy();
    
    // Log successful deletion
    console.log(`User ${userData.id} (${userData.email}) successfully deleted their account`);
    
    res.json({ success: true, message: "Your account and all associated data have been deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get statistics for the system (for agents only)
 */
const getStatistics = async (req, res) => {
  try {
    const userData = await req.getUserDataFromToken();
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access statistics" });
    }
    
    // Count total users by type
    const userCounts = await User.findAll({
      attributes: [
        'userType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userType']
    });
    
    // Count bookings by status
    const bookingCounts = await Booking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Count total places
    const totalPlaces = await Place.count();
    
    res.json({
      users: userCounts,
      bookings: bookingCounts,
      places: { total: totalPlaces }
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Update a user's details (for agents only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber } = req.body;
    const userData = await req.getUserDataFromToken();
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can update user details" });
    }
    
    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate phone number format if provided
    if (phoneNumber && phoneNumber.trim() !== '') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Please enter a valid phone number' });
      }
    }

    // Find the user to update
    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber.trim() !== '') {
      const existingUser = await User.findOne({
        where: {
          phoneNumber: phoneNumber.trim(),
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Phone number is already in use by another user' });
      }
    }

    // Update user details
    const updateData = {
      name: name.trim()
    };

    // Only update phone number if provided
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber.trim() || null;
    }

    await User.update(updateData, {
      where: { id: id }
    });

    // Fetch updated user data
    const updatedUser = await User.findByPk(id, {
      attributes: [
        'id', 'name', 'email', 'phoneNumber', 'userType', 
        'telegramId', 'telegramUsername', 'telegramFirstName',
        'telegramPhotoUrl', 'telegramPhone', 'telegramLinked',
        'createdAt'
      ]
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(422).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  deleteOwnAccount,
  getStatistics,
  updateUser
};
