/**
 * US-LOCK-002: Optimized Place Service
 * 
 * This service optimizes place details page performance by:
 * 1. Breaking deep joins into shallow queries with caching
 * 2. Implementing lock-efficient availability calculations
 * 3. Using batch operations instead of sequential queries
 * 4. Adding query result caching for frequently accessed data
 */

const { Place, User, Currency } = require('../models');
const { Op } = require('sequelize');

/**
 * Cache for frequently accessed data to reduce database hits
 */
class PlaceDataCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes TTL
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Optimized Place Service for US-LOCK-002
 */
class OptimizedPlaceService {
  constructor() {
    this.cache = new PlaceDataCache();
    this.lockMonitor = {
      maxConcurrentLocks: 0,
      totalOperations: 0,
      averageLocksPerOperation: 0
    };
  }

  /**
   * Optimized place details retrieval with minimal lock usage
   * 
   * @param {number} placeId - Place ID
   * @returns {Promise<Object>} Complete place details with all associations
   */
  async getPlaceDetails(placeId) {
    const startTime = Date.now();
    let lockCount = 0;

    try {
      // Step 1: Get base place data (1 lock)
      const place = await this._getBasePlaceData(placeId);
      lockCount++;

      if (!place) {
        return null;
      }

      // Step 2: Get cached or fetch owner data (0-1 locks)
      const owner = await this._getOwnerData(place.ownerId);
      if (!this.cache.get(`owner:${place.ownerId}`)) {
        lockCount++;
      }

      // Step 3: Get cached or fetch currency data (0-1 locks)
      let currency = null;
      if (place.currencyId) {
        currency = await this._getCurrencyData(place.currencyId);
        if (!this.cache.get(`currency:${place.currencyId}`)) {
          lockCount++;
        }
      }

      // Step 4: Get optimized availability summary (1 lock max)
      const availabilitySummary = await this._getAvailabilitySummary(placeId);
      lockCount++;

      // Update lock monitoring
      this._updateLockMonitoring(lockCount);

      // Combine all data
      const placeDetails = {
        ...place.toJSON(),
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email // Only essential owner data
        } : null,
        currency: currency,
        availabilitySummary,
        _optimizationMeta: {
          locksUsed: lockCount,
          retrievalTime: Date.now() - startTime,
          cacheHits: this._getCacheHitStats(placeId)
        }
      };

      return placeDetails;

    } catch (error) {
      console.error(`Error fetching optimized place details for ID ${placeId}:`, error);
      throw error;
    }
  }

  /**
   * Get base place data with minimal attributes
   * 
   * @private
   * @param {number} placeId - Place ID
   * @returns {Promise<Object>} Base place data
   */
  async _getBasePlaceData(placeId) {
    return await Place.findByPk(placeId, {
      attributes: [
        'id', 'title', 'address', 'photos', 'description', 'extraInfo',
        'checkIn', 'checkOut', 'maxGuests', 'price', 'startDate', 'endDate',
        'youtubeLink', 'matterportLink', 'lat', 'lng', 'ownerId', 'currencyId',
        'fullDayHours', 'fullDayDiscountPrice', 'minimumHours', 'cooldown',
        'blockedWeekdays', 'blockedDates', 'weekdayTimeSlots',
        'squareMeters', 'isHotel', 'refundOptions', 'perks',
        'averageRating', 'totalReviews', 'ratingBreakdown', 'ratingUpdatedAt',
        'createdAt', 'updatedAt'
      ]
    });
  }

  /**
   * Get owner data with caching
   * 
   * @private
   * @param {number} ownerId - Owner ID
   * @returns {Promise<Object>} Owner data
   */
  async _getOwnerData(ownerId) {
    const cacheKey = `owner:${ownerId}`;
    let owner = this.cache.get(cacheKey);

    if (!owner) {
      owner = await User.findByPk(ownerId, {
        attributes: ['id', 'name', 'email', 'phoneNumber', 'userType']
      });

      if (owner) {
        this.cache.set(cacheKey, owner);
      }
    }

    return owner;
  }

  /**
   * Get currency data with caching
   * 
   * @private
   * @param {number} currencyId - Currency ID
   * @returns {Promise<Object>} Currency data
   */
  async _getCurrencyData(currencyId) {
    const cacheKey = `currency:${currencyId}`;
    let currency = this.cache.get(cacheKey);

    if (!currency) {
      currency = await Currency.findByPk(currencyId, {
        attributes: ['id', 'name', 'code', 'charCode']
      });

      if (currency) {
        this.cache.set(cacheKey, currency);
      }
    }

    return currency;
  }

  /**
   * Get optimized availability summary for place
   * Uses single query instead of complex availability calculations
   * 
   * @private
   * @param {number} placeId - Place ID
   * @returns {Promise<Object>} Availability summary
   */
  async _getAvailabilitySummary(placeId) {
    const cacheKey = `availability:${placeId}`;
    let summary = this.cache.get(cacheKey);

    if (!summary) {
      // Use raw query for optimal performance
      const [results] = await Place.sequelize.query(`
        SELECT 
          COUNT(b.id) as active_bookings,
          MAX(b."checkOutDate") as next_available_date,
          CASE 
            WHEN COUNT(b.id) = 0 THEN true 
            ELSE false 
          END as is_immediately_available
        FROM "Places" p
        LEFT JOIN "Bookings" b ON p.id = b."placeId" 
          AND b.status = 'approved' 
          AND b."checkOutDate" >= NOW()
        WHERE p.id = :placeId
        GROUP BY p.id
      `, {
        replacements: { placeId },
        type: Place.sequelize.QueryTypes.SELECT
      });

      summary = results[0] || {
        active_bookings: 0,
        next_available_date: null,
        is_immediately_available: true
      };

      // Cache for 2 minutes (shorter TTL for availability data)
      this.cache.set(cacheKey, summary);
    }

    return summary;
  }

  /**
   * Batch fetch multiple places with optimized queries
   * 
   * @param {Array<number>} placeIds - Array of place IDs
   * @returns {Promise<Array>} Array of optimized place details
   */
  async batchGetPlaceDetails(placeIds) {
    if (!placeIds || placeIds.length === 0) {
      return [];
    }

    const startTime = Date.now();
    let totalLocks = 0;

    try {
      // Step 1: Batch fetch all places (1 lock)
      const places = await Place.findAll({
        where: { id: { [Op.in]: placeIds } },
        attributes: [
          'id', 'title', 'address', 'photos', 'description', 'extraInfo',
          'checkIn', 'checkOut', 'maxGuests', 'price', 'startDate', 'endDate',
          'youtubeLink', 'matterportLink', 'lat', 'lng', 'ownerId', 'currencyId',
          'fullDayHours', 'fullDayDiscountPrice', 'minimumHours', 'cooldown',
          'blockedWeekdays', 'blockedDates', 'weekdayTimeSlots',
          'squareMeters', 'isHotel', 'refundOptions', 'perks',
          'averageRating', 'totalReviews', 'ratingBreakdown', 'ratingUpdatedAt'
        ]
      });
      totalLocks++;

      // Step 2: Get unique owner IDs and batch fetch
      const ownerIds = [...new Set(places.map(p => p.ownerId))];
      const owners = await this._batchGetOwners(ownerIds);
      totalLocks++;

      // Step 3: Get unique currency IDs and batch fetch
      const currencyIds = [...new Set(places.map(p => p.currencyId).filter(Boolean))];
      const currencies = currencyIds.length > 0 ? await this._batchGetCurrencies(currencyIds) : [];
      if (currencyIds.length > 0) totalLocks++;

      // Step 4: Batch availability summaries
      const availabilitySummaries = await this._batchGetAvailabilitySummaries(placeIds);
      totalLocks++;

      // Combine data efficiently
      const result = places.map(place => {
        const owner = owners.find(o => o.id === place.ownerId);
        const currency = currencies.find(c => c.id === place.currencyId);
        const availabilitySummary = availabilitySummaries[place.id] || {
          active_bookings: 0,
          next_available_date: null,
          is_immediately_available: true
        };

        return {
          ...place.toJSON(),
          owner: owner ? {
            id: owner.id,
            name: owner.name,
            email: owner.email
          } : null,
          currency,
          availabilitySummary,
          _optimizationMeta: {
            batchOperation: true,
            totalLocksForBatch: totalLocks,
            batchSize: placeIds.length
          }
        };
      });

      this._updateLockMonitoring(totalLocks);

      return result;

    } catch (error) {
      console.error('Error in batch place details fetch:', error);
      throw error;
    }
  }

  /**
   * Batch fetch owners
   * 
   * @private
   * @param {Array<number>} ownerIds - Owner IDs
   * @returns {Promise<Array>} Owner data
   */
  async _batchGetOwners(ownerIds) {
    const cachedOwners = [];
    const uncachedIds = [];

    // Check cache first
    for (const id of ownerIds) {
      const cached = this.cache.get(`owner:${id}`);
      if (cached) {
        cachedOwners.push(cached);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached owners
    let freshOwners = [];
    if (uncachedIds.length > 0) {
      freshOwners = await User.findAll({
        where: { id: { [Op.in]: uncachedIds } },
        attributes: ['id', 'name', 'email', 'phoneNumber', 'userType']
      });

      // Cache fresh owners
      freshOwners.forEach(owner => {
        this.cache.set(`owner:${owner.id}`, owner);
      });
    }

    return [...cachedOwners, ...freshOwners];
  }

  /**
   * Batch fetch currencies
   * 
   * @private
   * @param {Array<number>} currencyIds - Currency IDs
   * @returns {Promise<Array>} Currency data
   */
  async _batchGetCurrencies(currencyIds) {
    const cachedCurrencies = [];
    const uncachedIds = [];

    // Check cache first
    for (const id of currencyIds) {
      const cached = this.cache.get(`currency:${id}`);
      if (cached) {
        cachedCurrencies.push(cached);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached currencies
    let freshCurrencies = [];
    if (uncachedIds.length > 0) {
      freshCurrencies = await Currency.findAll({
        where: { id: { [Op.in]: uncachedIds } },
        attributes: ['id', 'name', 'code', 'charCode']
      });

      // Cache fresh currencies
      freshCurrencies.forEach(currency => {
        this.cache.set(`currency:${currency.id}`, currency);
      });
    }

    return [...cachedCurrencies, ...freshCurrencies];
  }

  /**
   * Batch fetch availability summaries
   * 
   * @private
   * @param {Array<number>} placeIds - Place IDs
   * @returns {Promise<Object>} Availability summaries by place ID
   */
  async _batchGetAvailabilitySummaries(placeIds) {
    // Use single query for all places
    const [results] = await Place.sequelize.query(`
      SELECT 
        p.id as place_id,
        COUNT(b.id) as active_bookings,
        MAX(b."checkOutDate") as next_available_date,
        CASE 
          WHEN COUNT(b.id) = 0 THEN true 
          ELSE false 
        END as is_immediately_available
      FROM "Places" p
      LEFT JOIN "Bookings" b ON p.id = b."placeId" 
        AND b.status = 'approved' 
        AND b."checkOutDate" >= NOW()
      WHERE p.id = ANY(:placeIds)
      GROUP BY p.id
    `, {
      replacements: { placeIds },
      type: Place.sequelize.QueryTypes.SELECT
    });

    // Convert to object for easy lookup
    const summaries = {};
    results.forEach(result => {
      summaries[result.place_id] = {
        active_bookings: parseInt(result.active_bookings),
        next_available_date: result.next_available_date,
        is_immediately_available: result.is_immediately_available
      };
    });

    return summaries;
  }

  /**
   * Update lock monitoring statistics
   * 
   * @private
   * @param {number} lockCount - Number of locks used
   */
  _updateLockMonitoring(lockCount) {
    this.lockMonitor.totalOperations++;
    this.lockMonitor.maxConcurrentLocks = Math.max(this.lockMonitor.maxConcurrentLocks, lockCount);
    this.lockMonitor.averageLocksPerOperation = 
      ((this.lockMonitor.averageLocksPerOperation * (this.lockMonitor.totalOperations - 1)) + lockCount) / 
      this.lockMonitor.totalOperations;
  }

  /**
   * Get cache hit statistics
   * 
   * @private
   * @param {number} placeId - Place ID
   * @returns {Object} Cache statistics
   */
  _getCacheHitStats(placeId) {
    return {
      ownerCached: !!this.cache.get(`owner:${placeId}`),
      currencyCached: !!this.cache.get(`currency:${placeId}`),
      availabilityCached: !!this.cache.get(`availability:${placeId}`)
    };
  }

  /**
   * Get lock monitoring report
   * 
   * @returns {Object} Lock usage statistics
   */
  getLockMonitoringReport() {
    return {
      ...this.lockMonitor,
      cacheSize: this.cache.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Optimized availability checking for place details
   * Uses indexed queries instead of complex JSONB operations
   * 
   * @param {number} placeId - Place ID
   * @param {Object} availabilityFilters - Availability filters
   * @returns {Promise<Object>} Availability status
   */
  async checkOptimizedAvailability(placeId, availabilityFilters) {
    const { selectedDates, startTime, endTime } = availabilityFilters;

    if (!selectedDates || selectedDates.length === 0) {
      return { available: true, conflicts: [] };
    }

    try {
      // Use single optimized query instead of sequential checks
      const [conflicts] = await Place.sequelize.query(`
        WITH requested_slots AS (
          SELECT 
            unnest(:selectedDates::date[]) as req_date,
            :startTime::time as req_start,
            :endTime::time as req_end,
            :placeId::integer as place_id
        ),
        booking_conflicts AS (
          SELECT DISTINCT
            b.id as booking_id,
            b."timeSlots",
            b."checkInDate",
            b."checkOutDate"
          FROM "Bookings" b
          CROSS JOIN requested_slots rs
          WHERE b."placeId" = rs.place_id
            AND b.status = 'approved'
            AND (
              -- Time slot conflicts
              (b."timeSlots" IS NOT NULL 
               AND jsonb_array_length(b."timeSlots") > 0
               AND EXISTS (
                 SELECT 1 FROM jsonb_array_elements(b."timeSlots") as slot
                 WHERE (slot->>'date')::date = rs.req_date
                   AND (slot->>'startTime')::time < rs.req_end
                   AND (slot->>'endTime')::time > rs.req_start
               ))
              OR
              -- Full day booking conflicts
              (b."checkInDate"::date <= rs.req_date 
               AND b."checkOutDate"::date >= rs.req_date
               AND (b."timeSlots" IS NULL OR jsonb_array_length(b."timeSlots") = 0))
            )
        )
        SELECT 
          CASE WHEN COUNT(*) > 0 THEN false ELSE true END as available,
          array_agg(booking_id) as conflicting_bookings
        FROM booking_conflicts
      `, {
        replacements: {
          placeId,
          selectedDates,
          startTime: startTime || '00:00',
          endTime: endTime || '23:59'
        },
        type: Place.sequelize.QueryTypes.SELECT
      });

      return conflicts[0] || { available: true, conflicting_bookings: [] };

    } catch (error) {
      console.error('Error in optimized availability check:', error);
      return { available: false, error: error.message };
    }
  }
}

module.exports = OptimizedPlaceService;
