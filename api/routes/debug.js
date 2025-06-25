const express = require("express");
const router = express.Router();
const moment = require('moment-timezone');

/**
 * Debug routes to help troubleshoot timezone and date issues
 */

// Get comprehensive server timezone information
router.get("/timezone", (req, res) => {
  const now = new Date();
  const serverTime = now.toISOString();
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const uzbekistanTime = moment().tz('Asia/Tashkent').format();
  const uzbekistanDate = moment().tz('Asia/Tashkent').format('YYYY-MM-DD');
  
  // Get environment variables that might affect timezone
  const envTimezone = process.env.TZ;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log(`🐛 DEBUG - Server timezone check at ${serverTime}`);
  console.log(`🐛 DEBUG - Server detected timezone: ${serverTimezone}`);
  console.log(`🐛 DEBUG - Environment TZ: ${envTimezone || 'Not set'}`);
  console.log(`🐛 DEBUG - Uzbekistan time: ${uzbekistanTime}`);
  console.log(`🐛 DEBUG - Uzbekistan date: ${uzbekistanDate}`);
  
  res.json({
    serverTime,
    serverTimezone,
    uzbekistanTime,
    uzbekistanDate,
    envTimezone,
    nodeEnv,
    systemLocalTime: now.toString(),
    utcTime: now.toUTCString(),
    // Additional debugging info
    momentVersion: require('moment/package.json').version,
    nodeVersion: process.version,
    platform: process.platform,
    // Test timezone conversion
    testDates: {
      today: {
        server: moment().format('YYYY-MM-DD'),
        uzbekistan: moment().tz('Asia/Tashkent').format('YYYY-MM-DD'),
        utc: moment().utc().format('YYYY-MM-DD')
      },
      tomorrow: {
        server: moment().add(1, 'day').format('YYYY-MM-DD'),
        uzbekistan: moment().tz('Asia/Tashkent').add(1, 'day').format('YYYY-MM-DD'),
        utc: moment().utc().add(1, 'day').format('YYYY-MM-DD')
      },
      yesterday: {
        server: moment().subtract(1, 'day').format('YYYY-MM-DD'),
        uzbekistan: moment().tz('Asia/Tashkent').subtract(1, 'day').format('YYYY-MM-DD'),
        utc: moment().utc().subtract(1, 'day').format('YYYY-MM-DD')
      }
    },
    rawTimestamps: {
      serverNow: now.getTime(),
      uzbekistanNow: moment().tz('Asia/Tashkent').valueOf(),
      utcNow: moment().utc().valueOf()
    }
  });
});

// Test date availability logic
router.get("/test-availability/:date", (req, res) => {
  const { date } = req.params;
  
  console.log(`🐛 DEBUG - Testing availability for date: ${date}`);
  
  try {
    const { getCurrentDateInUzbekistan, isDateInPastUzbekistan } = require('../utils/uzbekistanTimezoneUtils');
    
    const currentDateUz = getCurrentDateInUzbekistan();
    const isInPast = isDateInPastUzbekistan(date);
    
    console.log(`🐛 DEBUG - Current Uzbekistan date: ${currentDateUz}`);
    console.log(`🐛 DEBUG - Is ${date} in past? ${isInPast}`);
    
    const comparison = {
      inputDate: date,
      currentDateUzbekistan: currentDateUz,
      isInPast,
      inputDateMoment: moment.tz(date, 'Asia/Tashkent').format(),
      currentMoment: moment().tz('Asia/Tashkent').format(),
      serverMoment: moment().format(),
      // Detailed comparison
      inputDateStartOfDay: moment.tz(date, 'Asia/Tashkent').startOf('day').format(),
      currentDateStartOfDay: moment().tz('Asia/Tashkent').startOf('day').format(),
      // Raw timestamps for comparison
      inputTimestamp: moment.tz(date, 'Asia/Tashkent').startOf('day').valueOf(),
      currentTimestamp: moment().tz('Asia/Tashkent').startOf('day').valueOf()
    };
    
    console.log(`🐛 DEBUG - Detailed comparison:`, comparison);
    
    res.json(comparison);
  } catch (error) {
    console.error(`🐛 DEBUG ERROR - Testing availability:`, error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Test calendar minimum date logic
router.get("/test-calendar-min-date", (req, res) => {
  console.log(`🐛 DEBUG - Testing calendar minimum date logic`);
  
  try {
    const { getCurrentDateInUzbekistan, getCurrentDateObjectInUzbekistan } = require('../utils/uzbekistanTimezoneUtils');
    
    const uzbekCurrentDate = getCurrentDateInUzbekistan();
    const uzbekCurrentDateObject = getCurrentDateObjectInUzbekistan();
    const systemDate = new Date();
    const systemDateString = systemDate.toISOString().split('T')[0];
    
    const result = {
      uzbekistanCurrentDate: uzbekCurrentDate,
      uzbekistanCurrentDateObject: uzbekCurrentDateObject.toISOString(),
      systemDate: systemDate.toISOString(),
      systemDateString: systemDateString,
      comparison: {
        uzbekVsSystem: uzbekCurrentDate === systemDateString ? 'SAME' : 'DIFFERENT',
        difference: uzbekCurrentDate !== systemDateString ? `Uzbek: ${uzbekCurrentDate}, System: ${systemDateString}` : null
      },
      momentComparison: {
        uzbekistanMoment: moment().tz('Asia/Tashkent').format('YYYY-MM-DD'),
        systemMoment: moment().format('YYYY-MM-DD'),
        utcMoment: moment().utc().format('YYYY-MM-DD')
      }
    };
    
    console.log(`🐛 DEBUG - Calendar min date result:`, result);
    
    res.json(result);
  } catch (error) {
    console.error(`🐛 DEBUG ERROR - Calendar min date:`, error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Test specific dates (25th and 26th June 2025)
router.get("/test-june-dates", (req, res) => {
  console.log(`🐛 DEBUG - Testing June 25th and 26th, 2025`);
  
  try {
    const { isDateInPastUzbekistan, getCurrentDateInUzbekistan } = require('../utils/uzbekistanTimezoneUtils');
    
    const june25 = '2025-06-25';
    const june26 = '2025-06-26';
    const currentDate = getCurrentDateInUzbekistan();
    
    const june25InPast = isDateInPastUzbekistan(june25);
    const june26InPast = isDateInPastUzbekistan(june26);
    
    const result = {
      currentDateUzbekistan: currentDate,
      tests: {
        june25: {
          date: june25,
          isInPast: june25InPast,
          shouldBeSelectable: !june25InPast,
          momentComparison: {
            inputMoment: moment.tz(june25, 'Asia/Tashkent').startOf('day').format(),
            currentMoment: moment().tz('Asia/Tashkent').startOf('day').format(),
            isBefore: moment.tz(june25, 'Asia/Tashkent').startOf('day').isBefore(moment().tz('Asia/Tashkent').startOf('day'))
          }
        },
        june26: {
          date: june26,
          isInPast: june26InPast,
          shouldBeSelectable: !june26InPast,
          momentComparison: {
            inputMoment: moment.tz(june26, 'Asia/Tashkent').startOf('day').format(),
            currentMoment: moment().tz('Asia/Tashkent').startOf('day').format(),
            isBefore: moment.tz(june26, 'Asia/Tashkent').startOf('day').isBefore(moment().tz('Asia/Tashkent').startOf('day'))
          }
        }
      },
      serverInfo: {
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        serverTime: new Date().toISOString(),
        uzbekistanTime: moment().tz('Asia/Tashkent').format(),
        envTZ: process.env.TZ
      }
    };
    
    console.log(`🐛 DEBUG - June dates test result:`, result);
    
    res.json(result);
  } catch (error) {
    console.error(`🐛 DEBUG ERROR - June dates test:`, error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Test booking availability endpoint
router.get("/booking-availability/:placeId/:date", async (req, res) => {
  try {
    const { placeId, date } = req.params;
    console.log(`🐛 DEBUG - Testing booking availability for place ${placeId} on ${date}`);
    
    const { getCurrentDateInUzbekistan } = require('../utils/uzbekistanTimezoneUtils');
    const currentDateUz = getCurrentDateInUzbekistan();
    
    console.log(`🐛 DEBUG - Current Uzbekistan date for booking: ${currentDateUz}`);
    
    res.json({
      placeId,
      requestedDate: date,
      currentDateUzbekistan: currentDateUz,
      debug: {
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        uzbekistanTime: moment().tz('Asia/Tashkent').format(),
        requestTime: new Date().toISOString(),
        envTZ: process.env.TZ
      }
    });
    
  } catch (error) {
    console.error(`🐛 DEBUG ERROR - Booking availability:`, error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
