const bcrypt = require("bcryptjs");
const { User, Place, Booking, Review, ReviewReply } = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth");
const { getUserDataFromToken } = require("../middleware/auth");
const phoneVerificationService = require("../services/phoneVerificationService");

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
 * Update user password
 */
const updatePassword = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword) {
      return res.status(400).json({ 
        error: 'New password is required',
        code: 'MISSING_PASSWORD'
      });
    }

    // Get user
    const user = await User.findByPk(userData.id, {
      attributes: ['id']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate new password against policy
    const passwordPolicy = authConfig.passwordPolicy;
    
    // Check minimum length
    if (newPassword.length < passwordPolicy.minLength) {
      return res.status(400).json({ 
        error: `Password must be at least ${passwordPolicy.minLength} characters long`,
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Check for required character types
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one uppercase letter',
        code: 'PASSWORD_MISSING_UPPERCASE'
      });
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one lowercase letter',
        code: 'PASSWORD_MISSING_LOWERCASE'
      });
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one number',
        code: 'PASSWORD_MISSING_NUMBER'
      });
    }

    if (passwordPolicy.requireSpecialChars) {
      const specialCharRegex = new RegExp(`[${passwordPolicy.allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);
      if (!specialCharRegex.test(newPassword)) {
        return res.status(400).json({ 
          error: `Password must contain at least one special character from: ${passwordPolicy.allowedSpecialChars}`,
          code: 'PASSWORD_MISSING_SPECIAL_CHAR'
        });
      }
    }

    // Check for disallowed characters
    if (passwordPolicy.allowedSpecialChars) {
      const allowedPattern = new RegExp(`^[A-Za-z0-9${passwordPolicy.allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]*$`);
      if (!allowedPattern.test(newPassword)) {
        return res.status(400).json({ 
          error: `Password contains invalid characters. Only alphanumeric and these special characters are allowed: ${passwordPolicy.allowedSpecialChars}`,
          code: 'PASSWORD_INVALID_CHARS'
        });
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.update(
      { password: hashedPassword },
      { where: { id: userData.id } }
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ 
      error: 'Failed to update password',
      code: 'SERVER_ERROR'
    });
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
    const { name, phoneNumber, newPassword } = req.body;
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

    // Validate password if provided
    if (newPassword) {
      const passwordPolicy = authConfig.passwordPolicy;
      
      // Check minimum length
      if (newPassword.length < passwordPolicy.minLength) {
        return res.status(400).json({ 
          error: `Password must be at least ${passwordPolicy.minLength} characters long`,
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      // Check for required character types
      if (passwordPolicy.requiresLowercase && !/[a-z]/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must contain at least one lowercase letter',
          code: 'PASSWORD_MISSING_LOWERCASE'
        });
      }
      
      if (passwordPolicy.requiresUppercase && !/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must contain at least one uppercase letter',
          code: 'PASSWORD_MISSING_UPPERCASE'
        });
      }
      
      if (passwordPolicy.requiresNumber && !/\d/.test(newPassword)) {
        return res.status(400).json({ 
          error: 'Password must contain at least one number',
          code: 'PASSWORD_MISSING_NUMBER'
        });
      }
      
      if (passwordPolicy.requiresSpecialChar) {
        const specialCharPattern = new RegExp(`[${passwordPolicy.allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);
        if (!specialCharPattern.test(newPassword)) {
          return res.status(400).json({ 
            error: `Password must contain at least one special character from: ${passwordPolicy.allowedSpecialChars}`,
            code: 'PASSWORD_MISSING_SPECIAL_CHAR'
          });
        }
      }

      // Check for disallowed characters
      if (passwordPolicy.allowedSpecialChars) {
        const allowedPattern = new RegExp(`^[A-Za-z0-9${passwordPolicy.allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]*$`);
        if (!allowedPattern.test(newPassword)) {
          return res.status(400).json({ 
            error: `Password contains invalid characters. Only alphanumeric and these special characters are allowed: ${passwordPolicy.allowedSpecialChars}`,
            code: 'PASSWORD_INVALID_CHARS'
          });
        }
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

    // Update password if provided
    if (newPassword) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
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

/**
 * Get host-specific statistics
 */
const getHostStatistics = async (req, res) => {
  try {
    const userData = await req.getUserDataFromToken();
    
    // Verify user is a host
    if (userData.userType !== 'host') {
      return res.status(403).json({ error: "Only hosts can access host statistics" });
    }

    // Get host's places with more details
    const hostPlaces = await Place.findAll({
      where: { ownerId: userData.id },
      attributes: ['id', 'title', 'price', 'maxGuests', 'createdAt', 'address', 'averageRating']
    });

    const placeIds = hostPlaces.map(place => place.id);

    // Count host's places by availability status
    const placesStats = {
      total: hostPlaces.length,
      active: hostPlaces.length, // Assuming all places are active for now
      averagePrice: hostPlaces.length > 0 
        ? Math.round(hostPlaces.reduce((sum, place) => sum + parseFloat(place.price || 0), 0) / hostPlaces.length)
        : 0
    };

    // Count ALL bookings for host's places by status (initialize with zeros)
    let bookingStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      selected: 0,
      total: 0
    };

    if (placeIds.length > 0) {
      // Get total bookings count - only count paid_to_host bookings
      const totalBookings = await Booking.count({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          paid_to_host: true
        }
      });

      bookingStats.total = totalBookings;

      // Get bookings by status
      const bookingCounts = await Booking.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          placeId: {
            [Op.in]: placeIds
          }
        },
        group: ['status']
      });

      // Update bookingStats with actual counts
      bookingCounts.forEach(item => {
        const status = item.status;
        const count = parseInt(item.dataValues.count);
        if (bookingStats.hasOwnProperty(status)) {
          bookingStats[status] = count;
        }
      });
    }

    // Calculate total revenue from paid_to_host bookings only
    let totalRevenue = 0;
    let monthlyRevenue = [];
    if (placeIds.length > 0) {
      const revenueResult = await Booking.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          paid_to_host: true
        }
      });

      totalRevenue = parseFloat(revenueResult?.dataValues?.totalRevenue || 0);

      // Monthly revenue for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const monthlyRevenueData = await Booking.findAll({
        attributes: [
          [sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt')), 'year'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'revenue']
        ],
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          paid_to_host: true,
          createdAt: {
            [Op.gte]: twelveMonthsAgo
          }
        },
        group: [
          sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')),
          sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt'))
        ],
        order: [
          [sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt')), 'ASC'],
          [sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')), 'ASC']
        ]
      });

      monthlyRevenue = monthlyRevenueData.map(item => ({
        month: `${item.dataValues.year}-${String(item.dataValues.month).padStart(2, '0')}`,
        revenue: parseFloat(item.dataValues.revenue || 0)
      }));
    }

    // Get recent bookings (last 10) with user and place details
    let recentBookings = [];
    if (placeIds.length > 0) {
      recentBookings = await Booking.findAll({
        where: {
          placeId: {
            [Op.in]: placeIds
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'email']
          },
          {
            model: Place,
            as: 'place',
            attributes: ['title']
          }
        ],
        attributes: ['id', 'checkInDate', 'checkOutDate', 'totalPrice', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    }

    // Get reviews for host's places with detailed information
    let reviewStats = {
      total: 0,
      averageRating: "0.0",
      ratingDistribution: {},
      reviewsThisMonth: 0,
      reviewsLastMonth: 0,
      recentReviews: []
    };

    if (placeIds.length > 0) {
      const reviewCount = await Review.count({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved'
        }
      });

      const averageRating = await Review.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ],
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved'
        }
      });

      // Rating distribution
      const ratingDistribution = await Review.findAll({
        attributes: [
          'rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved'
        },
        group: ['rating'],
        order: [['rating', 'DESC']]
      });

      // Calculate rating distribution with percentages
      const totalApprovedReviews = reviewCount;
      const ratingBreakdown = {};
      for (let i = 1; i <= 5; i++) {
        ratingBreakdown[i] = { count: 0, percentage: 0 };
      }
      
      ratingDistribution.forEach(item => {
        const rating = item.rating;
        const count = parseInt(item.dataValues.count);
        ratingBreakdown[rating] = {
          count: count,
          percentage: totalApprovedReviews > 0 ? Math.round((count / totalApprovedReviews) * 100) : 0
        };
      });

      // Reviews this month and last month
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const reviewsThisMonth = await Review.count({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved',
          created_at: {
            [Op.gte]: thisMonthStart
          }
        }
      });

      const reviewsLastMonth = await Review.count({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved',
          created_at: {
            [Op.gte]: lastMonthStart,
            [Op.lte]: lastMonthEnd
          }
        }
      });

      const recentReviews = await Review.findAll({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: 'approved'
        },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['name']
          },
          {
            model: Place,
            as: 'Place',
            attributes: ['title']
          }
        ],
        attributes: ['id', 'rating', 'comment', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 10
      });

      reviewStats = {
        total: reviewCount,
        averageRating: averageRating?.dataValues?.avgRating 
          ? parseFloat(averageRating.dataValues.avgRating).toFixed(1) 
          : "0.0",
        ratingDistribution: ratingBreakdown,
        reviewsThisMonth: reviewsThisMonth,
        reviewsLastMonth: reviewsLastMonth,
        recentReviews: recentReviews,
        placeSpecificStats: []
      };

      // Get place-specific review statistics
      const placeSpecificStats = await Promise.all(hostPlaces.map(async (place) => {
        // Get review count for this place
        const placeReviewCount = await Review.count({
          where: {
            placeId: place.id,
            status: 'approved'
          }
        });

        // Get average rating for this place
        const placeAvgRating = await Review.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
          ],
          where: {
            placeId: place.id,
            status: 'approved'
          }
        });

        // Get rating distribution for this place
        const placeRatingDistribution = await Review.findAll({
          attributes: [
            'rating',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: {
            placeId: place.id,
            status: 'approved'
          },
          group: ['rating'],
          order: [['rating', 'DESC']]
        });

        // Calculate rating breakdown for this place
        const placeRatingBreakdown = {};
        for (let i = 1; i <= 5; i++) {
          placeRatingBreakdown[i] = { count: 0, percentage: 0 };
        }
        
        placeRatingDistribution.forEach(item => {
          const rating = item.rating;
          const count = parseInt(item.dataValues.count);
          placeRatingBreakdown[rating] = {
            count: count,
            percentage: placeReviewCount > 0 ? Math.round((count / placeReviewCount) * 100) : 0
          };
        });

        // Get reviews this month for this place
        const placeReviewsThisMonth = await Review.count({
          where: {
            placeId: place.id,
            status: 'approved',
            created_at: {
              [Op.gte]: thisMonthStart
            }
          }
        });

        // Get reviews last month for this place
        const placeReviewsLastMonth = await Review.count({
          where: {
            placeId: place.id,
            status: 'approved',
            created_at: {
              [Op.gte]: lastMonthStart,
              [Op.lte]: lastMonthEnd
            }
          }
        });

        // Calculate review quality metrics
        const positiveReviews = (placeRatingBreakdown[5]?.count || 0) + (placeRatingBreakdown[4]?.count || 0);
        const criticalReviews = (placeRatingBreakdown[1]?.count || 0) + (placeRatingBreakdown[2]?.count || 0);
        const positivePercentage = placeReviewCount > 0 ? Math.round((positiveReviews / placeReviewCount) * 100) : 0;
        const criticalPercentage = placeReviewCount > 0 ? Math.round((criticalReviews / placeReviewCount) * 100) : 0;

        // Calculate review velocity (reviews per month average over last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const reviewsLast6Months = await Review.count({
          where: {
            placeId: place.id,
            status: 'approved',
            created_at: {
              [Op.gte]: sixMonthsAgo
            }
          }
        });
        
        const averageReviewsPerMonth = Math.round(reviewsLast6Months / 6);

        // Determine performance category
        let performanceCategory = 'No Data';
        const avgRating = parseFloat(placeAvgRating?.dataValues?.avgRating || 0);
        if (avgRating >= 4.5 && placeReviewCount >= 5) {
          performanceCategory = 'Excellent';
        } else if (avgRating >= 4.0 && placeReviewCount >= 3) {
          performanceCategory = 'Great';
        } else if (avgRating >= 3.5) {
          performanceCategory = 'Good';
        } else if (avgRating >= 3.0) {
          performanceCategory = 'Fair';
        } else if (avgRating > 0) {
          performanceCategory = 'Poor';
        }

        return {
          placeId: place.id,
          placeTitle: place.title,
          totalReviews: placeReviewCount,
          averageRating: placeAvgRating?.dataValues?.avgRating 
            ? parseFloat(placeAvgRating.dataValues.avgRating).toFixed(1) 
            : "0.0",
          ratingDistribution: placeRatingBreakdown,
          reviewsThisMonth: placeReviewsThisMonth,
          reviewsLastMonth: placeReviewsLastMonth,
          trend: placeReviewsThisMonth - placeReviewsLastMonth,
          positivePercentage: positivePercentage,
          criticalPercentage: criticalPercentage,
          averageReviewsPerMonth: averageReviewsPerMonth,
          performanceCategory: performanceCategory,
          // Remove individual reviews to improve performance and scalability
          hasRecentActivity: placeReviewsThisMonth > 0
        };
      }));

      reviewStats.placeSpecificStats = placeSpecificStats;
    }

    // Calculate occupancy rate for the last 30 days
    let occupancyRate = 0;
    let totalBookingDays = 0;

    if (placeIds.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all approved bookings in the last 30 days
      const bookingsInPeriod = await Booking.findAll({
        where: {
          placeId: {
            [Op.in]: placeIds
          },
          status: {
            [Op.in]: ['approved', 'selected']
          },
          checkInDate: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        attributes: ['checkInDate', 'checkOutDate']
      });

      // Calculate total booked days
      totalBookingDays = bookingsInPeriod.reduce((total, booking) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        return total + Math.max(0, days);
      }, 0);

      const totalPossibleDays = hostPlaces.length * 30; // Last 30 days
      occupancyRate = totalPossibleDays > 0 
        ? Math.round((totalBookingDays / totalPossibleDays) * 100) 
        : 0;
    }

    // Calculate space performance metrics
    const spacePerformance = await Promise.all(hostPlaces.map(async (place) => {
      // Get total bookings for this specific place - only paid_to_host bookings
      const totalBookings = await Booking.count({
        where: {
          placeId: place.id,
          paid_to_host: true
        }
      });

      // Get total reviews for this specific place
      const totalReviews = await Review.count({
        where: {
          placeId: place.id,
          status: 'approved'
        }
      });

      // Get average rating for this specific place
      const avgRatingResult = await Review.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ],
        where: {
          placeId: place.id,
          status: 'approved'
        }
      });

      const averageRating = avgRatingResult?.dataValues?.avgRating 
        ? parseFloat(avgRatingResult.dataValues.avgRating).toFixed(1) 
        : "0.0";

      // Get total revenue for this specific place - only paid_to_host bookings
      const revenueResult = await Booking.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        where: {
          placeId: place.id,
          paid_to_host: true
        }
      });

      const revenue = parseFloat(revenueResult?.dataValues?.totalRevenue || 0);
      
      return {
        id: place.id,
        title: place.title,
        totalBookings: totalBookings,
        totalReviews: totalReviews,
        averageRating: averageRating,
        revenue: revenue
      };
    }));

    res.json({
      places: placesStats,
      bookings: bookingStats,
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue
      },
      reviews: reviewStats,
      occupancyRate: occupancyRate,
      totalBookingDays: totalBookingDays,
      recentBookings: recentBookings,
      hostPlaces: hostPlaces,
      spacePerformance: spacePerformance
    });

  } catch (error) {
    console.error("Error fetching host statistics:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get all reviews for places owned by the host
 */
const getHostReviews = async (req, res) => {
  try {
    const userData = await req.getUserDataFromToken();

    // Get all places owned by this user
    const hostPlaces = await Place.findAll({
      where: { ownerId: userData.id },
      attributes: ['id', 'title']
    });

    if (hostPlaces.length === 0) {
      return res.json({
        reviews: [],
        totalReviews: 0,
        averageRating: "0.0",
        places: []
      });
    }

    const placeIds = hostPlaces.map(place => place.id);

    // Get all reviews for these places with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter options
    const rating = req.query.rating;
    const placeId = req.query.placeId;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    const whereClause = {
      place_id: {
        [Op.in]: placeIds
      }
    };

    if (rating && rating !== 'all') {
      whereClause.rating = parseInt(rating);
    }

    if (placeId && placeId !== 'all') {
      whereClause.place_id = parseInt(placeId);
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['name']
        },
        {
          model: Place,
          as: 'Place',
          attributes: ['title']
        },
        {
          model: Booking,
          as: 'Booking',
          attributes: ['id', 'checkInDate', 'checkOutDate'],
          required: false
        }
      ],
      attributes: ['id', 'rating', 'comment', 'created_at', 'place_id', 'user_id', 'booking_id'],
      order: [[sortBy, sortOrder]],
      limit: limit,
      offset: offset
    });

    // Calculate average rating
    const averageRatingResult = await Review.findOne({
      where: {
        place_id: {
          [Op.in]: placeIds
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ]
    });

    const averageRating = averageRatingResult?.dataValues?.avgRating 
      ? parseFloat(averageRatingResult.dataValues.avgRating).toFixed(1) 
      : "0.0";

    // Rating breakdown
    const ratingBreakdown = await Review.findAll({
      where: {
        place_id: {
          [Op.in]: placeIds
        }
      },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']]
    });

    const breakdown = {};
    for (let i = 1; i <= 5; i++) {
      breakdown[i] = 0;
    }
    ratingBreakdown.forEach(item => {
      breakdown[item.rating] = parseInt(item.dataValues.count);
    });

    res.json({
      reviews: reviews,
      totalReviews: count,
      averageRating: averageRating,
      ratingBreakdown: breakdown,
      places: hostPlaces,
      pagination: {
        page: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching host reviews:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Update user's preferred language for SMS notifications
 */
const updateLanguagePreference = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { preferredLanguage } = req.body;

    // Validate language
    const supportedLanguages = ["en", "ru", "uz"];
    if (!preferredLanguage || !supportedLanguages.includes(preferredLanguage)) {
      return res.status(400).json({ 
        error: 'Invalid language. Supported languages: en, ru, uz' 
      });
    }

    // Update user's preferred language
    await User.update(
      { preferredLanguage: preferredLanguage },
      { where: { id: userData.id } }
    );

    // Fetch updated user data
    const updatedUser = await User.findByPk(userData.id, {
      attributes: [
        'id', 'name', 'email', 'phoneNumber', 'userType', 'preferredLanguage',
        'telegramId', 'telegramUsername', 'telegramFirstName',
        'telegramPhotoUrl', 'telegramPhone', 'telegramLinked'
      ]
    });

    res.json({
      message: 'Language preference updated successfully',
      user: updatedUser,
      preferredLanguage: preferredLanguage
    });
  } catch (error) {
    console.error("Error updating language preference:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send phone verification code
 */
const sendPhoneVerification = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({ 
        error: 'Phone number is required',
        code: 'PHONE_REQUIRED'
      });
    }

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
        id: { [Op.ne]: userData.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'A user with this phone number already exists',
        code: 'PHONE_NUMBER_EXISTS'
      });
    }

    // Get user's preferred language (default to 'ru')
    const user = await User.findByPk(userData.id, {
      attributes: ['preferredLanguage']
    });
    const language = user?.preferredLanguage || 'ru';

    // Send verification code
    const result = await phoneVerificationService.sendVerificationCode(cleanPhone, language);

    if (result.success) {
      res.json({
        success: true,
        message: 'Verification code sent successfully',
        sessionId: result.sessionId,
        expiresIn: result.expiresIn,
        phoneNumber: cleanPhone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        code: 'SMS_SEND_FAILED'
      });
    }
  } catch (error) {
    console.error("Error sending phone verification:", error);
    res.status(500).json({ 
      error: 'Failed to send verification code',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Verify phone verification code and update user's phone number
 */
const verifyPhoneAndUpdate = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);
    const { sessionId, verificationCode, phoneNumber } = req.body;

    // Validate input
    if (!sessionId || !verificationCode || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Session ID, verification code, and phone number are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Verify the code
    const verificationResult = phoneVerificationService.verifyCode(sessionId, verificationCode);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error,
        code: verificationResult.code,
        remainingAttempts: verificationResult.remainingAttempts
      });
    }

    // Ensure the phone number matches what was verified
    if (verificationResult.phoneNumber !== phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number mismatch',
        code: 'PHONE_MISMATCH'
      });
    }

    // Double-check that phone number is still not taken by another user
    const existingUser = await User.findOne({
      where: {
        phoneNumber: phoneNumber,
        id: { [Op.ne]: userData.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'A user with this phone number already exists',
        code: 'PHONE_NUMBER_EXISTS'
      });
    }

    // Update user's phone number
    await User.update(
      { phoneNumber: phoneNumber },
      { where: { id: userData.id } }
    );

    // Fetch updated user data
    const updatedUser = await User.findByPk(userData.id, {
      attributes: [
        'id', 'name', 'email', 'phoneNumber', 'userType', 'preferredLanguage',
        'telegramId', 'telegramUsername', 'telegramFirstName',
        'telegramPhotoUrl', 'telegramPhone', 'telegramLinked'
      ]
    });

    console.log(`✅ PHONE VERIFICATION COMPLETE - User: ${userData.id}, Phone: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Phone number verified and updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error("Error verifying phone and updating:", error);
    res.status(500).json({ 
      error: 'Failed to verify phone number',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Get agent-specific statistics for the platform overview
 */
const getAgentStatistics = async (req, res) => {
  try {
    const userData = await req.getUserDataFromToken();
    
    // Verify user is an agent
    if (userData.userType !== 'agent') {
      return res.status(403).json({ error: "Only agents can access agent statistics" });
    }

    // Get platform-wide statistics
    
    // 1. Total number of places
    const totalPlaces = await Place.count();
    
    // Monthly trend for places (this month vs last month)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const placesThisMonth = await Place.count({
      where: {
        createdAt: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const placesLastMonth = await Place.count({
      where: {
        createdAt: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // 2. Total Paid (to agent, not marked as paid to host)
    const totalPaidToAgent = await Booking.count({
      where: {
        paid_to_host: false,
        paid_at: {
          [Op.not]: null
        }
      }
    });

    // Monthly trend for agent payments
    const agentPaymentsThisMonth = await Booking.count({
      where: {
        paid_to_host: false,
        paid_at: {
          [Op.not]: null,
          [Op.gte]: thisMonthStart
        }
      }
    });

    const agentPaymentsLastMonth = await Booking.count({
      where: {
        paid_to_host: false,
        paid_at: {
          [Op.not]: null,
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // 2.5. Total Paid to Host (approved bookings marked as paid to host)
    const totalPaidToHost = await Booking.count({
      where: {
        status: 'approved',
        paid_to_host: true
      }
    });

    // Monthly trend for host payments
    const hostPaymentsThisMonth = await Booking.count({
      where: {
        status: 'approved',
        paid_to_host: true,
        paid_to_host_at: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const hostPaymentsLastMonth = await Booking.count({
      where: {
        status: 'approved',
        paid_to_host: true,
        paid_to_host_at: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // 3. Overall booking status for the platform
    const bookingStats = await Booking.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Convert to object for easier access
    const bookingStatusCounts = {};
    bookingStats.forEach(item => {
      bookingStatusCounts[item.status] = parseInt(item.dataValues.count);
    });

    // Monthly trend for approved bookings
    const approvedBookingsThisMonth = await Booking.count({
      where: {
        status: 'approved',
        approved_at: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const approvedBookingsLastMonth = await Booking.count({
      where: {
        status: 'approved',
        approved_at: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // 4. Overall review analytics (no individual reviews)
    const totalReviews = await Review.count({
      where: {
        status: 'approved'
      }
    });

    const averagePlatformRating = await Review.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      where: {
        status: 'approved'
      }
    });

    const reviewsThisMonth = await Review.count({
      where: {
        status: 'approved',
        created_at: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const reviewsLastMonth = await Review.count({
      where: {
        status: 'approved',
        created_at: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // 5. User platform statistics (NET CHANGE - actual user counts)
    const totalUsers = await User.count();
    
    // Get total users that existed at the END of this month (current count)
    const usersEndOfThisMonth = totalUsers;
    
    // Get total users that existed at the END of last month
    // (users created before this month start)
    const usersEndOfLastMonth = await User.count({
      where: {
        createdAt: {
          [Op.lt]: thisMonthStart
        }
      }
    });

    // Get total users that existed at the END of two months ago
    // (users created before last month start)
    const usersEndOfTwoMonthsAgo = await User.count({
      where: {
        createdAt: {
          [Op.lt]: lastMonthStart
        }
      }
    });

    // Calculate NET change (not just new registrations)
    const netUserChangeThisMonth = usersEndOfThisMonth - usersEndOfLastMonth;
    
    // For comparison, also track new registrations
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const newUsersLastMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    // Count users by type
    const usersByType = await User.findAll({
      attributes: [
        'userType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userType']
    });

    const userTypeCounts = {};
    usersByType.forEach(item => {
      userTypeCounts[item.userType] = parseInt(item.dataValues.count);
    });

    // 6. Monthly trends for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // User registration trends
    const userRegistrationTrend = await User.findAll({
      attributes: [
        [sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt')), 'year'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [
        sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')),
        sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt'))
      ],
      order: [
        [sequelize.fn('DATE_PART', 'year', sequelize.col('createdAt')), 'ASC'],
        [sequelize.fn('DATE_PART', 'month', sequelize.col('createdAt')), 'ASC']
      ]
    });

    // Booking approval trends
    const bookingApprovalTrend = await Booking.findAll({
      attributes: [
        [sequelize.fn('DATE_PART', 'month', sequelize.col('approved_at')), 'month'],
        [sequelize.fn('DATE_PART', 'year', sequelize.col('approved_at')), 'year'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        status: 'approved',
        approved_at: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [
        sequelize.fn('DATE_PART', 'month', sequelize.col('approved_at')),
        sequelize.fn('DATE_PART', 'year', sequelize.col('approved_at'))
      ],
      order: [
        [sequelize.fn('DATE_PART', 'year', sequelize.col('approved_at')), 'ASC'],
        [sequelize.fn('DATE_PART', 'month', sequelize.col('approved_at')), 'ASC']
      ]
    });

    // Platform activity statistics
    const platformActivity = {
      activeHosts: userTypeCounts.host || 0,
      activeClients: userTypeCounts.client || 0,
      totalBookingsToday: await Booking.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        }
      }),
      pendingReviews: await Review.count({
        where: {
          status: 'pending'
        }
      })
    };

    // Calculate growth rates
    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Calculate NET growth rates for more accurate trend analysis
    const calculateNetGrowthRate = (currentNet, previousNet) => {
      if (previousNet === 0) return currentNet > 0 ? 100 : 0;
      return Math.round(((currentNet - previousNet) / Math.abs(previousNet)) * 100);
    };

    // NET USER CALCULATION (use existing variables)
    const netUserChangeLastMonth = usersEndOfLastMonth - usersEndOfTwoMonthsAgo;

    // NET BOOKING APPROVALS CALCULATION (approved - rejected)
    const rejectedBookingsThisMonth = await Booking.count({
      where: {
        status: 'rejected',
        rejected_at: {
          [Op.gte]: thisMonthStart
        }
      }
    });

    const rejectedBookingsLastMonth = await Booking.count({
      where: {
        status: 'rejected',
        rejected_at: {
          [Op.gte]: lastMonthStart,
          [Op.lte]: lastMonthEnd
        }
      }
    });

    const netApprovedBookingsThisMonth = approvedBookingsThisMonth - rejectedBookingsThisMonth;
    const netApprovedBookingsLastMonth = approvedBookingsLastMonth - rejectedBookingsLastMonth;

    // NET PLACES CALCULATION (total places at end of each month - accounts for deletions)
    // Current total places (end of this month)
    const totalPlacesEndOfThisMonth = totalPlaces;
    
    // Total places that existed at the end of last month
    const totalPlacesEndOfLastMonth = await Place.count({
      where: {
        createdAt: {
          [Op.lt]: thisMonthStart
        }
      }
    });
    
    // Total places that existed at the end of two months ago  
    const totalPlacesEndOfTwoMonthsAgo = await Place.count({
      where: {
        createdAt: {
          [Op.lt]: lastMonthStart
        }
      }
    });

    // NET change = difference in total counts (accounts for additions AND deletions)
    const netPlacesThisMonth = totalPlacesEndOfThisMonth - totalPlacesEndOfLastMonth;
    const netPlacesLastMonth = totalPlacesEndOfLastMonth - totalPlacesEndOfTwoMonthsAgo;

    const growthRates = {
      places: calculateNetGrowthRate(netPlacesThisMonth, netPlacesLastMonth),
      users: calculateNetGrowthRate(netUserChangeThisMonth, netUserChangeLastMonth),
      approvedBookings: calculateNetGrowthRate(netApprovedBookingsThisMonth, netApprovedBookingsLastMonth),
      reviews: calculateGrowthRate(reviewsThisMonth, reviewsLastMonth),
      agentPayments: calculateGrowthRate(agentPaymentsThisMonth, agentPaymentsLastMonth),
      hostPayments: calculateGrowthRate(hostPaymentsThisMonth, hostPaymentsLastMonth)
    };

    res.json({
      places: {
        total: totalPlaces,
        thisMonth: placesThisMonth,
        lastMonth: placesLastMonth,
        totalEndOfThisMonth: totalPlacesEndOfThisMonth,
        totalEndOfLastMonth: totalPlacesEndOfLastMonth,
        netThisMonth: netPlacesThisMonth,
        netLastMonth: netPlacesLastMonth,
        growth: growthRates.places
      },
      agentPayments: {
        total: totalPaidToAgent,
        thisMonth: agentPaymentsThisMonth,
        lastMonth: agentPaymentsLastMonth,
        growth: growthRates.agentPayments
      },
      hostPayments: {
        total: totalPaidToHost,
        thisMonth: hostPaymentsThisMonth,
        lastMonth: hostPaymentsLastMonth,
        growth: growthRates.hostPayments
      },
      bookings: {
        status: bookingStatusCounts,
        approvedThisMonth: approvedBookingsThisMonth,
        approvedLastMonth: approvedBookingsLastMonth,
        rejectedThisMonth: rejectedBookingsThisMonth,
        rejectedLastMonth: rejectedBookingsLastMonth,
        netApprovedThisMonth: netApprovedBookingsThisMonth,
        netApprovedLastMonth: netApprovedBookingsLastMonth,
        approvalGrowth: growthRates.approvedBookings
      },
      reviews: {
        total: totalReviews,
        averageRating: averagePlatformRating?.dataValues?.avgRating 
          ? parseFloat(averagePlatformRating.dataValues.avgRating).toFixed(1) 
          : "0.0",
        thisMonth: reviewsThisMonth,
        lastMonth: reviewsLastMonth,
        growth: growthRates.reviews
      },
      users: {
        total: totalUsers,
        byType: userTypeCounts,
        thisMonth: newUsersThisMonth,
        lastMonth: newUsersLastMonth,
        netThisMonth: netUserChangeThisMonth,
        netLastMonth: netUserChangeLastMonth,
        growth: growthRates.users
      },
      monthlyTrends: {
        userRegistrations: userRegistrationTrend.map(item => ({
          month: `${item.dataValues.year}-${String(item.dataValues.month).padStart(2, '0')}`,
          count: parseInt(item.dataValues.count)
        })),
        approvedBookings: bookingApprovalTrend.map(item => ({
          month: `${item.dataValues.year}-${String(item.dataValues.month).padStart(2, '0')}`,
          count: parseInt(item.dataValues.count)
        }))
      },
      platformActivity: platformActivity,
      growthRates: growthRates,
      netCalculations: {
        explanation: "Net calculations show true platform growth: gains minus losses",
        methodology: {
          users: "Total user count change (accounts added - accounts deleted)",
          bookings: "Approved bookings minus rejected bookings", 
          places: "Total places change (new places added minus places deleted)"
        },
        summary: {
          users: {
            thisMonth: `Net change: ${netUserChangeThisMonth} users`,
            lastMonth: `Net change: ${netUserChangeLastMonth} users`,
            growth: `${growthRates.users}%`
          },
          bookings: {
            thisMonth: `Approved: ${approvedBookingsThisMonth}, Rejected: ${rejectedBookingsThisMonth}, Net: ${netApprovedBookingsThisMonth}`,
            lastMonth: `Approved: ${approvedBookingsLastMonth}, Rejected: ${rejectedBookingsLastMonth}, Net: ${netApprovedBookingsLastMonth}`,
            growth: `${growthRates.approvedBookings}%`
          },
          places: {
            thisMonth: `Net change: ${netPlacesThisMonth} places (Total: ${totalPlacesEndOfThisMonth} vs Last Month: ${totalPlacesEndOfLastMonth})`,
            lastMonth: `Net change: ${netPlacesLastMonth} places`,
            growth: `${growthRates.places}%`
          }
        }
      }
    });

  } catch (error) {
    console.error("Error fetching agent statistics:", error);
    res.status(422).json({ error: error.message });
  }
};

/**
 * Get language preference
 */
const getLanguagePreference = async (req, res) => {
  try {
    const userData = await getUserDataFromToken(req);

    const user = await User.findByPk(userData.id, {
      attributes: ['preferredLanguage']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      preferredLanguage: user.preferredLanguage || 'ru'
    });
  } catch (error) {
    console.error("Error getting language preference:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  getAllUsers,
  deleteUser,
  deleteOwnAccount,
  getStatistics,
  updateUser,
  getAdminContact,
  getHostStatistics,
  getAgentStatistics,
  getHostReviews,
  updateLanguagePreference,
  getLanguagePreference,
  sendPhoneVerification,
  verifyPhoneAndUpdate
};
