# PostgreSQL Lock Optimization Epic
## Working Within 64 Lock Limit on Managed Services

### 🎯 Executive Summary
Since managed PostgreSQL services (Render, Railway, AWS RDS) don't allow superuser access to increase `max_locks_per_transaction`, we must optimize our application to work efficiently within the default 64 lock limit by breaking large transactions into smaller batches and reducing lock contention.

### 🚨 Root Cause Analysis

**Why We're Hitting Lock Limits:**
- **Auto-Migration on Startup**: When `npm run dev` runs, Sequelize automatically syncs models creating multiple foreign keys in single transaction
- **Complex Availability Query Operations**: 
  - `PlaceAvailabilityService.filterAvailablePlaces()` runs multiple nested queries per place
  - Each availability check requires locks on Bookings, Places, and related tables
  - Availability filtering with date/time parameters causes sequential database queries
- **Booking Conflict Detection Logic**: 
  - `validateBookingTimeSlots()` checks conflicts across multiple approved bookings
  - `findConflictingBookings()` performs complex time slot overlap calculations
  - Each booking creation triggers extensive validation queries
- **Deep Join Operations in Controllers**:
  - `getBookingWithAssociations()` joins Booking → Place → User → Currency (4-level deep)
  - `checkTimezoneAwareAvailability()` loads place data with complex timezone calculations
  - Multiple simultaneous `findAll()` calls with deep `include` statements
- **Concurrent User Operations**: Multiple users accessing same resources causing lock contention
- **Inefficient Transaction Management**: Long-running transactions holding locks unnecessarily

### 📋 User Stories

#### Epic Goal: Reduce Lock Usage to Stay Within 64 Lock Limit

---

#### US-LOCK-001: Optimize Startup Auto-Migration Process
**As a** developer  
**I want** `npm run dev` to start successfully without lock exhaustion  
**So that** the application can run on managed PostgreSQL services  

**Acceptance Criteria:**
- [ ] Application startup completes within 64 lock limit
- [ ] Foreign key constraints are created sequentially, not simultaneously  
- [ ] Auto-sync process doesn't timeout or fail
- [ ] Development environment starts consistently
- [ ] No "out of shared memory" errors during startup

**Priority:** CRITICAL (Blocking development)

---

#### US-LOCK-002: Optimize Place Details Page Performance
**As a** user viewing place details  
**I want** the page to load quickly without database errors  
**So that** I can see all place information smoothly  

**Root Issue:** `getPlaceById()` uses deep joins (Place → Currency + User + rating data) and `checkTimezoneAwareAvailability()` performs complex availability calculations with multiple sequential queries.

**Acceptance Criteria:**
- [ ] Place details page loads in under 2 seconds
- [ ] No database lock timeout errors occur
- [ ] All place information displays correctly (photos, reviews, availability)
- [ ] Page works reliably under concurrent user access
- [ ] Related data (owner, currency, reviews) loads efficiently
- [ ] Availability calculations are optimized to use fewer locks
- [ ] Deep join queries are broken into smaller, cached operations

**Priority:** HIGH (User-facing feature)

---

#### US-LOCK-003: Optimize Booking Creation Process
**As a** user creating a booking  
**I want** my booking to be processed quickly and reliably  
**So that** I can secure my preferred time slots  

**Root Issue:** `BookingService.createBooking()` performs extensive validation through `validateBookingTimeSlots()` which checks conflicts against all approved bookings, and `PlaceAvailabilityService` runs complex availability calculations for each time slot.

**Acceptance Criteria:**
- [ ] Booking creation completes within 5 seconds
- [ ] No lock timeout errors during booking process
- [ ] Availability checks are fast and accurate
- [ ] Concurrent booking attempts are handled properly
- [ ] Booking confirmations are sent successfully
- [ ] Time slot conflict detection is optimized
- [ ] Replace sequential availability queries with batch operations
- [ ] Implement booking queue system for high-conflict time slots

**Priority:** HIGH (Core business function)

---

#### US-LOCK-004: Optimize Booking Management Pages
**As a** user viewing my bookings (client/host/agent)  
**I want** to see all booking information without delays  
**So that** I can manage my bookings effectively  

**Root Issue:** `getBookings()` methods use `getBookingWithAssociations()` which performs 4-level deep joins (Booking → Place → User/Currency), and each call to `getUserBookings()`, `_getAgentBookings()`, `_getHostBookings()` triggers multiple complex queries.

**Acceptance Criteria:**
- [ ] Booking list loads in under 3 seconds
- [ ] Individual booking details load quickly
- [ ] Booking status updates work reliably
- [ ] Payment status checks don't cause timeouts
- [ ] Filtering and sorting work smoothly
- [ ] Replace deep joins with shallow queries + caching
- [ ] Implement pagination for large booking lists
- [ ] Optimize booking association queries

**Priority:** HIGH (Daily user operations)

---

#### US-LOCK-005: Optimize Places Listing Page
**As a** user browsing available places  
**I want** to see places quickly with accurate availability  
**So that** I can find suitable spaces efficiently  

**Root Issue:** `getAllPlaces()` and public place listing use `PlaceAvailabilityService.filterAvailablePlaces()` which runs sequential availability checks for each place, causing multiple database queries per place when date/time filters are applied.

**Acceptance Criteria:**
- [ ] Places listing loads in under 3 seconds
- [ ] Availability filtering works without timeouts
- [ ] Date and time filters respond quickly
- [ ] Pagination works smoothly
- [ ] Search results are accurate and up-to-date
- [ ] Replace sequential place availability checks with batch queries
- [ ] Implement place availability caching
- [ ] Optimize complex SQL queries in `PlaceAvailabilityService`
- [ ] Add database indexes for availability filtering

**Priority:** HIGH (User discovery experience)

---

#### US-LOCK-006: Optimize User Management Operations
**As an** agent managing users and properties  
**I want** user operations to complete quickly  
**So that** I can efficiently manage the platform  

**Acceptance Criteria:**
- [ ] User creation/updates complete within 3 seconds
- [ ] User listing with associated data loads quickly
- [ ] Bulk user operations work within lock limits
- [ ] User role changes are processed reliably
- [ ] User statistics and reports generate efficiently

**Priority:** MEDIUM (Admin functions)

---

#### US-LOCK-007: Optimize Payment Processing Operations
**As a** user making payments  
**I want** payment operations to complete without errors  
**So that** my transactions are processed reliably  

**Acceptance Criteria:**
- [ ] Payment status checks complete quickly
- [ ] Payment confirmation updates booking status reliably
- [ ] Multiple concurrent payments don't cause lock conflicts
- [ ] Payment history loads efficiently
- [ ] Refund operations work smoothly

**Priority:** HIGH (Financial operations)

---

#### US-LOCK-008: Optimize Notification System
**As a** user receiving notifications  
**I want** notifications to be sent promptly  
**So that** I stay informed about booking updates  

**Acceptance Criteria:**
- [ ] Notification creation doesn't block other operations
- [ ] Bulk notification sending works within lock limits
- [ ] Notification history loads quickly
- [ ] SMS/email sending doesn't cause database timeouts
- [ ] Notification preferences update reliably

**Priority:** MEDIUM (Communication features)

---

#### US-LOCK-009: Optimize Review and Rating System
**As a** user viewing/creating reviews  
**I want** review operations to work smoothly  
**So that** I can share and read feedback effectively  

**Acceptance Criteria:**
- [ ] Review creation completes quickly
- [ ] Review listing with user data loads efficiently
- [ ] Rating calculations update without lock conflicts
- [ ] Review moderation tools work reliably
- [ ] Review statistics generate quickly

**Priority:** MEDIUM (Community features)

---

#### US-LOCK-010: Optimize Reporting and Analytics
**As an** administrator viewing reports  
**I want** analytics to generate quickly  
**So that** I can make informed business decisions  

**Acceptance Criteria:**
- [ ] Dashboard reports load in under 10 seconds
- [ ] Complex analytics queries don't cause timeouts
- [ ] Data export operations complete successfully
- [ ] Real-time metrics update efficiently
- [ ] Historical data analysis works reliably

**Priority:** MEDIUM (Business intelligence)

---

#### US-LOCK-011: Add Database Performance Monitoring
**As a** developer maintaining the system  
**I want** to monitor lock usage and query performance  
**So that** I can identify and prevent lock issues proactively  

**Acceptance Criteria:**
- [ ] Lock usage is tracked and logged
- [ ] Slow queries are identified and reported
- [ ] Lock timeout incidents are alerted
- [ ] Performance trends are monitored
- [ ] Optimization opportunities are identified

**Priority:** MEDIUM (System maintenance)

---

#### US-LOCK-013: Optimize Availability and Conflict Detection Logic
**As a** developer maintaining the booking system  
**I want** availability checks and conflict detection to use minimal database locks  
**So that** the system can handle concurrent bookings efficiently within the 64 lock limit  

**Root Issue:** The core availability and booking logic contains several lock-intensive operations:

1. **PlaceAvailabilityService Complex Logic:**
   - `_checkPlaceAvailability()` runs multiple sequential queries per place
   - `_hasBookingConflict()` uses complex JSONB queries with EXISTS clauses
   - Availability filtering loops through places individually instead of batch processing

2. **Booking Validation Lock Issues:**
   - `validateBookingTimeSlots()` checks all approved bookings for conflicts
   - `findConflictingBookings()` and `findCompetingBookings()` perform nested time slot comparisons
   - `cleanupExpiredBookings()` runs before every booking operation

3. **Deep Association Queries:**
   - `getBookingWithAssociations()` performs 4-level joins (Booking → Place → User → Currency)
   - `checkTimezoneAwareAvailability()` loads full place data with timezone calculations

**Acceptance Criteria:**
- [ ] Availability checks complete with maximum 10 database locks per operation
- [ ] Booking conflict detection uses batch queries instead of sequential checks
- [ ] Replace complex JSONB EXISTS queries with optimized indexed queries
- [ ] Implement availability result caching to reduce database hits
- [ ] Break deep associations into smaller, cacheable queries
- [ ] Add specific database indexes for time slot queries
- [ ] Optimize timezone-aware availability calculations
- [ ] Implement booking conflict detection using database-level constraints
- [ ] Create materialized views for complex availability queries
- [ ] Add query performance monitoring for availability operations

**Technical Implementation:**
- [ ] Replace `EXISTS (SELECT 1 FROM JSONB_ARRAY_ELEMENTS...)` with indexed columns
- [ ] Create separate `booking_time_slots` table to avoid JSONB queries
- [ ] Implement Redis caching for availability results
- [ ] Add composite indexes on (placeId, date, startTime, endTime)
- [ ] Use database views for common booking conflict queries
- [ ] Implement batch availability checking for multiple places
- [ ] Add query result caching for timezone calculations

**Priority:** CRITICAL (Core system performance)

---

#### US-LOCK-012: Implement Emergency Lock Release
**As a** system administrator  
**I want** tools to handle lock emergencies  
**So that** the system can recover from lock issues quickly  

**Acceptance Criteria:**
- [ ] Stuck transactions can be identified
- [ ] Long-running queries can be terminated safely
- [ ] Lock usage can be reset without data loss
- [ ] System recovery procedures are documented
- [ ] Emergency contacts and escalation paths are clear

**Priority:** LOW (Emergency procedures)

---

### 🎯 Success Metrics

**Technical Goals:**
- [ ] All operations complete within 64 lock limit
- [ ] Zero lock timeout errors for 30 days
- [ ] Page load times under 3 seconds
- [ ] Application startup success rate 100%
- [ ] Database query performance improved by 70%

**User Experience Goals:**
- [ ] User satisfaction scores maintained or improved
- [ ] Support tickets related to timeouts reduced to zero
- [ ] Booking conversion rates maintained
- [ ] User retention rates improved
- [ ] Platform reliability score above 99.5%

### 🚀 Implementation Priority

**Phase 1 (CRITICAL - Week 1):**
- US-LOCK-001: Fix startup auto-migration
- US-LOCK-013: Optimize availability and conflict detection logic (core architecture)
- US-LOCK-011: Add basic monitoring

**Phase 2 (HIGH - Week 2-3):**
- US-LOCK-002: Place details optimization
- US-LOCK-003: Booking creation optimization
- US-LOCK-004: Booking management optimization

**Phase 3 (HIGH - Week 4-5):**
- US-LOCK-005: Places listing optimization
- US-LOCK-007: Payment processing optimization

**Phase 4 (MEDIUM - Week 6-8):**
- US-LOCK-006: User management optimization
- US-LOCK-008: Notification system optimization
- US-LOCK-009: Review system optimization

**Phase 5 (ONGOING):**
- US-LOCK-010: Reporting optimization
- US-LOCK-012: Emergency procedures

---

**Note:** Since migrations are automatic via `npm run dev`, the primary focus is optimizing the Sequelize auto-sync process and application queries to work within the 64 lock limit constraint of managed PostgreSQL services.

## 🔧 Technical Implementation Guidelines

### High-Priority Lock Reduction Strategies

#### 1. Availability Query Optimization
```javascript
// PROBLEMATIC: Sequential availability checks (High lock usage)
for (const place of places) {
  const isAvailable = await this._checkPlaceAvailability(place, filters);
}

// SOLUTION: Batch availability checking
const availablePlaceIds = await this._batchCheckAvailability(places, filters);
```

#### 2. Replace Complex JSONB Queries
```sql
-- PROBLEMATIC: Complex EXISTS with JSONB (Multiple locks)
EXISTS (SELECT 1 FROM JSONB_ARRAY_ELEMENTS("timeSlots") AS slot 
        WHERE slot->>'date' = '2024-01-01')

-- SOLUTION: Normalized time slots table with indexes
SELECT DISTINCT booking_id FROM booking_time_slots 
WHERE place_id = ? AND slot_date = ? AND start_time < ? AND end_time > ?
```

#### 3. Break Deep Associations
```javascript
// PROBLEMATIC: 4-level deep joins (High lock usage)
const booking = await Booking.findByPk(id, {
  include: [
    { model: Place, include: [
      { model: User }, { model: Currency }
    ]}
  ]
});

// SOLUTION: Shallow queries with caching
const booking = await Booking.findByPk(id);
const place = await this.getPlaceFromCache(booking.placeId);
const user = await this.getUserFromCache(place.ownerId);
```

#### 4. Optimize Conflict Detection
```javascript
// PROBLEMATIC: Individual conflict checks per booking
const conflictingBookings = await Booking.findAll({/* complex query */});
for (const booking of pendingBookings) {
  const hasConflict = checkTimeSlotConflict(booking, approvedBooking);
}

// SOLUTION: Database-level conflict detection
const conflictingIds = await sequelize.query(`
  SELECT DISTINCT b1.id 
  FROM bookings b1, bookings b2 
  WHERE b1.place_id = b2.place_id 
  AND b1.status IN ('pending', 'selected')
  AND b2.status = 'approved'
  AND daterange(b1.start_time, b1.end_time) && daterange(b2.start_time, b2.end_time)
`);
```

#### 5. Implement Query Result Caching
```javascript
// Cache availability results for 5 minutes
const cacheKey = `availability:${placeId}:${date}:${startTime}:${endTime}`;
let availability = await redis.get(cacheKey);
if (!availability) {
  availability = await this._checkPlaceAvailability(place, filters);
  await redis.setex(cacheKey, 300, JSON.stringify(availability));
}
```

### Database Schema Optimizations

#### 1. Add Specific Indexes for Availability Queries
```sql
-- Index for booking conflict detection
CREATE INDEX idx_bookings_availability ON bookings(place_id, status, check_in_date, check_out_date);

-- Index for time slot queries
CREATE INDEX idx_bookings_time_slots_gin ON bookings USING GIN(time_slots);

-- Composite index for availability filtering
CREATE INDEX idx_places_availability ON places(start_date, end_date, blocked_dates, blocked_weekdays);
```

#### 2. Consider Normalized Time Slots Table
```sql
CREATE TABLE booking_time_slots (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  place_id INT REFERENCES places(id),
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  INDEX(place_id, slot_date, start_time, end_time)
);
```

#### 3. Materialized Views for Complex Queries
```sql
CREATE MATERIALIZED VIEW place_availability_summary AS
SELECT 
  p.id as place_id,
  p.title,
  COUNT(b.id) as total_bookings,
  MAX(b.check_out_date) as last_booking_date,
  ARRAY_AGG(DISTINCT extract(dow from b.check_in_date)) as busy_weekdays
FROM places p 
LEFT JOIN bookings b ON p.id = b.place_id AND b.status = 'approved'
GROUP BY p.id, p.title;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY place_availability_summary;
```

### Lock Monitoring Implementation
```javascript
// Add to bookingService.js
class LockMonitor {
  static async trackLockUsage(operationName, fn) {
    const startTime = Date.now();
    const locksBefore = await this.getCurrentLockCount();
    
    try {
      const result = await fn();
      const locksAfter = await this.getCurrentLockCount();
      const duration = Date.now() - startTime;
      
      console.log(`${operationName}: ${locksAfter - locksBefore} locks, ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`${operationName} failed with lock error:`, error);
      throw error;
    }
  }
}
```
