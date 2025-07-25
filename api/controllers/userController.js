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

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  deleteOwnAccount,
  getStatistics,
  updateUser,
  getAdminContact,
  getHostStatistics,
  getHostReviews
};
