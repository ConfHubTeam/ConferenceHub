const { User, Place, Booking, Review, ReviewReply } = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");
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
      // Enhanced phone validation - should be in E.164 format (starting with +)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      const cleanPhone = phoneNumber.trim();
      
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ 
          error: 'Please enter a valid phone number in international format (e.g., +998901234567)',
          code: 'INVALID_PHONE_FORMAT'
        });
      }

      // Check if phone number is already taken by another user
      const existingUser = await User.findOne({
        where: {
          phoneNumber: cleanPhone,
          id: { [require('sequelize').Op.ne]: userData.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'A user with this phone number already exists',
          code: 'PHONE_NUMBER_EXISTS'
        });
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
 * Enhanced with comprehensive review analytics for US-R013
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

    // ==== REVIEW ANALYTICS FOR US-R013 ====
    
    try {
      // Total reviews count
      const totalReviews = await Review.count();
      
      // Average platform rating
      const averagePlatformRating = await Review.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ],
        where: {
          status: 'approved'
        }
      });

      // Reviews per month (last 12 months) - Simplified version
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const reviewsPerMonth = await Review.findAll({
        attributes: [
          [sequelize.fn('DATE_PART', 'month', sequelize.col('created_at')), 'month'],
          [sequelize.fn('DATE_PART', 'year', sequelize.col('created_at')), 'year'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: twelveMonthsAgo
          }
        },
        group: [
          sequelize.fn('DATE_PART', 'month', sequelize.col('created_at')),
          sequelize.fn('DATE_PART', 'year', sequelize.col('created_at'))
        ],
        order: [
          [sequelize.fn('DATE_PART', 'year', sequelize.col('created_at')), 'ASC'],
          [sequelize.fn('DATE_PART', 'month', sequelize.col('created_at')), 'ASC']
        ]
      });

      // Top 5 highest-rated places - Simplified
      const topRatedPlaces = await sequelize.query(`
        SELECT 
          p.id,
          p.title,
          AVG(CAST(r.rating AS FLOAT)) as avg_rating,
          COUNT(r.id) as review_count
        FROM "Places" p
        INNER JOIN reviews r ON p.id = r.place_id
        WHERE r.status = 'approved'
        GROUP BY p.id, p.title
        HAVING COUNT(r.id) >= 1
        ORDER BY AVG(CAST(r.rating AS FLOAT)) DESC
        LIMIT 5
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Bottom 5 lowest-rated places - Simplified
      const lowestRatedPlaces = await sequelize.query(`
        SELECT 
          p.id,
          p.title,
          AVG(CAST(r.rating AS FLOAT)) as avg_rating,
          COUNT(r.id) as review_count
        FROM "Places" p
        INNER JOIN reviews r ON p.id = r.place_id
        WHERE r.status = 'approved'
        GROUP BY p.id, p.title
        HAVING COUNT(r.id) >= 1
        ORDER BY AVG(CAST(r.rating AS FLOAT)) ASC
        LIMIT 5
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Top 5 most active reviewers
      const mostActiveReviewers = await sequelize.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(r.id) as review_count
        FROM "Users" u
        INNER JOIN reviews r ON u.id = r.user_id
        GROUP BY u.id, u.name, u.email
        ORDER BY COUNT(r.id) DESC
        LIMIT 5
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Average host reply time (in hours) - Simplified
      const avgReplyTime = await sequelize.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (rr.created_at - r.created_at))/3600) as avg_hours
        FROM reviews r
        INNER JOIN review_replies rr ON r.id = rr.review_id
        WHERE r.status = 'approved'
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Rating distribution (percentages)
      const ratingDistribution = await Review.findAll({
        attributes: [
          'rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          status: 'approved'
        },
        group: ['rating'],
        order: [['rating', 'ASC']]
      });

      // Calculate percentages for rating distribution
      const totalApprovedReviews = ratingDistribution.reduce((sum, item) => sum + parseInt(item.dataValues.count), 0);
      const ratingDistributionWithPercentages = ratingDistribution.map(item => ({
        rating: item.rating,
        count: parseInt(item.dataValues.count),
        percentage: totalApprovedReviews > 0 ? Math.round((parseInt(item.dataValues.count) / totalApprovedReviews) * 100) : 0
      }));

      // Review moderation statistics
      const moderationStats = await Review.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Count reviews with replies vs without replies
      const reviewReplyStats = await sequelize.query(`
        SELECT 
          CASE WHEN rr.id IS NOT NULL THEN 'with_reply' ELSE 'without_reply' END as reply_status,
          COUNT(r.id) as count
        FROM reviews r
        LEFT JOIN review_replies rr ON r.id = rr.review_id
        WHERE r.status = 'approved'
        GROUP BY CASE WHEN rr.id IS NOT NULL THEN 'with_reply' ELSE 'without_reply' END
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Recent review activity (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const recentReviewActivity = await Review.count({
        where: {
          created_at: {
            [Op.gte]: lastWeek
          }
        }
      });

      res.json({
        users: userCounts,
        bookings: bookingCounts,
        places: { total: totalPlaces },
        reviews: {
          total: totalReviews,
          averagePlatformRating: averagePlatformRating?.dataValues?.avgRating ? parseFloat(averagePlatformRating.dataValues.avgRating).toFixed(2) : "0.0",
          reviewsPerMonth: reviewsPerMonth.map(item => ({
            month: `${item.dataValues.year}-${String(item.dataValues.month).padStart(2, '0')}`,
            count: parseInt(item.dataValues.count)
          })),
          topRatedPlaces: topRatedPlaces.map(place => ({
            ...place,
            avg_rating: parseFloat(place.avg_rating).toFixed(2)
          })),
          lowestRatedPlaces: lowestRatedPlaces.map(place => ({
            ...place,
            avg_rating: parseFloat(place.avg_rating).toFixed(2)
          })),
          mostActiveReviewers,
          averageHostReplyTime: avgReplyTime[0]?.avg_hours ? parseFloat(avgReplyTime[0].avg_hours).toFixed(1) : null,
          ratingDistribution: ratingDistributionWithPercentages,
          moderationStats: moderationStats.map(item => ({
            status: item.status,
            count: parseInt(item.dataValues.count)
          })),
          reviewReplyStats: reviewReplyStats.map(item => ({
            status: item.reply_status,
            count: parseInt(item.count)
          })),
          recentActivity: recentReviewActivity
        }
      });
    } catch (reviewError) {
      console.error("Error fetching review statistics:", reviewError);
      // If review analytics fail, return basic stats without reviews
      res.json({
        users: userCounts,
        bookings: bookingCounts,
        places: { total: totalPlaces },
        reviews: {
          total: 0,
          averagePlatformRating: "0.0",
          reviewsPerMonth: [],
          topRatedPlaces: [],
          lowestRatedPlaces: [],
          mostActiveReviewers: [],
          averageHostReplyTime: null,
          ratingDistribution: [],
          moderationStats: [],
          reviewReplyStats: [],
          recentActivity: 0
        }
      });
    }
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
      // Enhanced phone validation - should be in E.164 format (starting with +)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      const cleanPhone = phoneNumber.trim();
      
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ 
          error: 'Please enter a valid phone number in international format (e.g., +998901234567)',
          code: 'INVALID_PHONE_FORMAT'
        });
      }
    }

    // Find the user to update
    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber.trim() !== '') {
      const cleanPhone = phoneNumber.trim();
      
      const existingUser = await User.findOne({
        where: {
          phoneNumber: cleanPhone,
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'A user with this phone number already exists',
          code: 'PHONE_NUMBER_EXISTS'
        });
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

/**
 * Get admin contact information for support
 */
const getAdminContact = async (req, res) => {
  try {
    // First try to find the specific Sys admin user
    let admin = await User.findOne({
      where: { email: 'admin@conferencehub.com' },
      attributes: ['name', 'email', 'phoneNumber']
    });
    
    // If Sys admin not found, try to find any agent user
    if (!admin) {
      admin = await User.findOne({
        where: { userType: 'agent' },
        attributes: ['name', 'email', 'phoneNumber']
      });
    }
    
    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin contact:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin contact'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  deleteOwnAccount,
  getStatistics,
  updateUser,
  getAdminContact
};
