/**
 * Unit tests for PlaceAvailabilityService
 * 
 * Tests the core availability filtering logic following SOLID principles
 */

const PlaceAvailabilityService = require('../../services/placeAvailabilityService');

// Mock the models and utilities
jest.mock('../../models', () => ({
  Booking: {
    findAll: jest.fn()
  }
}));

jest.mock('../../utils/uzbekistanTimezoneUtils', () => ({
  isDateInPastUzbekistan: jest.fn(),
  validateBookingDateTimeUzbekistan: jest.fn()
}));

const { Booking } = require('../../models');
const { isDateInPastUzbekistan } = require('../../utils/uzbekistanTimezoneUtils');

describe('PlaceAvailabilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAvailabilityFilters', () => {
    beforeEach(() => {
      // Mock isDateInPastUzbekistan to return false for all dates in tests
      isDateInPastUzbekistan.mockReturnValue(false);
    });

    test('should parse single date correctly', () => {
      const query = {
        dates: '2025-07-01',
        startTime: '09:00',
        endTime: '17:00'
      };

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result).toEqual({
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: true,
        hasTimeFilter: true
      });
    });

    test('should parse multiple dates correctly', () => {
      const query = {
        dates: '2025-07-01,2025-07-02,2025-07-03',
        startTime: '10:00',
        endTime: '16:00'
      };

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result.selectedDates).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
      expect(result.hasDateFilter).toBe(true);
      expect(result.hasTimeFilter).toBe(true);
    });

    test('should handle invalid date format', () => {
      const query = {
        dates: '2025/07/01,invalid-date,2025-07-02',
        startTime: '09:00',
        endTime: '17:00'
      };

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result.selectedDates).toEqual(['2025-07-02']);
    });

    test('should handle invalid time range (end before start)', () => {
      const query = {
        dates: '2025-07-01',
        startTime: '17:00',
        endTime: '09:00'
      };

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.hasTimeFilter).toBe(false);
    });

    test('should filter out past dates', () => {
      isDateInPastUzbekistan.mockImplementation((date) => {
        return date === '2025-06-29'; // Mock past date
      });

      const query = {
        dates: '2025-06-29,2025-07-01,2025-07-02',
        startTime: '09:00',
        endTime: '17:00'
      };

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result.selectedDates).toEqual(['2025-07-01', '2025-07-02']);
    });

    test('should handle empty filters', () => {
      const query = {};

      const result = PlaceAvailabilityService.parseAvailabilityFilters(query);

      expect(result).toEqual({
        selectedDates: [],
        startTime: null,
        endTime: null,
        hasDateFilter: false,
        hasTimeFilter: false
      });
    });
  });

  describe('filterAvailablePlaces', () => {
    test('should return all place IDs when no filters applied', async () => {
      const places = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const filters = {
        selectedDates: [],
        startTime: null,
        endTime: null,
        hasDateFilter: false,
        hasTimeFilter: false
      };

      const result = await PlaceAvailabilityService.filterAvailablePlaces(places, filters);

      expect(result).toEqual([1, 2, 3]);
    });

    test('should return all place IDs when only time filter without dates', async () => {
      const places = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const filters = {
        selectedDates: [],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: false,
        hasTimeFilter: true
      };

      const result = await PlaceAvailabilityService.filterAvailablePlaces(places, filters);

      expect(result).toEqual([1, 2, 3]);
    });

    test('should filter places based on availability', async () => {
      const places = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const filters = {
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: true,
        hasTimeFilter: true
      };

      // Mock booking conflicts
      Booking.findAll.mockImplementation((query) => {
        const placeId = query.where.placeId;
        if (placeId === 2) {
          // Place 2 has conflicting booking
          return Promise.resolve([{
            id: 1,
            timeSlots: [{
              date: '2025-07-01',
              startTime: '10:00',
              endTime: '14:00'
            }],
            checkInDate: null,
            checkOutDate: null
          }]);
        }
        return Promise.resolve([]);
      });

      const result = await PlaceAvailabilityService.filterAvailablePlaces(places, filters);

      expect(result).toEqual([1, 3]); // Place 2 should be filtered out
    });
  });

  describe('private methods behavior verification', () => {
    test('should correctly detect time overlaps', () => {
      // Test the internal time overlap logic through public interface
      const places = [{ id: 1 }];
      const filters = {
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '12:00',
        hasDateFilter: true,
        hasTimeFilter: true
      };

      // Mock booking with overlapping time
      Booking.findAll.mockResolvedValue([{
        id: 1,
        timeSlots: [{
          date: '2025-07-01',
          startTime: '10:00',
          endTime: '14:00'
        }],
        checkInDate: null,
        checkOutDate: null
      }]);

      return PlaceAvailabilityService.filterAvailablePlaces(places, filters)
        .then(result => {
          expect(result).toEqual([]); // Should filter out due to overlap
        });
    });

    test('should handle full-day bookings', () => {
      const places = [{ id: 1 }];
      const filters = {
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '12:00',
        hasDateFilter: true,
        hasTimeFilter: true
      };

      // Mock full-day booking
      Booking.findAll.mockResolvedValue([{
        id: 1,
        timeSlots: [],
        checkInDate: new Date('2025-07-01'),
        checkOutDate: new Date('2025-07-01')
      }]);

      return PlaceAvailabilityService.filterAvailablePlaces(places, filters)
        .then(result => {
          expect(result).toEqual([]); // Should filter out due to full-day booking
        });
    });
  });
});
