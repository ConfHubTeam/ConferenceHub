/**
 * Integration tests for Place Controller date/time filtering
 * 
 * Tests the complete flow from HTTP request to filtered response
 */

const request = require('supertest');
const express = require('express');
const placeController = require('../../controllers/placeController');

// Mock the models and services
jest.mock('../../models', () => ({
  Place: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn()
  },
  Currency: {},
  User: {},
  Booking: {
    findAll: jest.fn()
  }
}));

jest.mock('../../services/placeAvailabilityService');
jest.mock('../../middleware/auth', () => ({
  getUserDataFromToken: jest.fn()
}));

const { Place } = require('../../models');
const PlaceAvailabilityService = require('../../services/placeAvailabilityService');
const { getUserDataFromToken } = require('../../middleware/auth');

// Create Express app for testing
const app = express();
app.use(express.json());
app.get('/places', placeController.getHomePlaces);
app.get('/agent/places', placeController.getAllPlaces);

describe('Place Controller Date/Time Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /places (getHomePlaces)', () => {
    const mockPlaces = [
      { id: 1, title: 'Place 1', currency: { code: 'USD' } },
      { id: 2, title: 'Place 2', currency: { code: 'USD' } },
      { id: 3, title: 'Place 3', currency: { code: 'USD' } }
    ];

    beforeEach(() => {
      Place.findAll.mockResolvedValue(mockPlaces);
    });

    test('should return all places when no filters applied', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: [],
        startTime: null,
        endTime: null,
        hasDateFilter: false,
        hasTimeFilter: false
      });

      const response = await request(app).get('/places');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlaces);
      expect(PlaceAvailabilityService.filterAvailablePlaces).not.toHaveBeenCalled();
    });

    test('should filter places when date/time filters are applied', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: true,
        hasTimeFilter: true
      });

      PlaceAvailabilityService.filterAvailablePlaces.mockResolvedValue([1, 3]);

      const response = await request(app)
        .get('/places')
        .query({
          dates: '2025-07-01',
          startTime: '09:00',
          endTime: '17:00'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map(p => p.id)).toEqual([1, 3]);
      
      expect(PlaceAvailabilityService.parseAvailabilityFilters).toHaveBeenCalledWith({
        dates: '2025-07-01',
        startTime: '09:00',
        endTime: '17:00'
      });
      
      expect(PlaceAvailabilityService.filterAvailablePlaces).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
          expect.objectContaining({ id: 3 })
        ]),
        {
          selectedDates: ['2025-07-01'],
          startTime: '09:00',
          endTime: '17:00',
          hasDateFilter: true,
          hasTimeFilter: true
        }
      );
    });

    test('should handle multiple dates in filter', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: ['2025-07-01', '2025-07-02'],
        startTime: '10:00',
        endTime: '16:00',
        hasDateFilter: true,
        hasTimeFilter: true
      });

      PlaceAvailabilityService.filterAvailablePlaces.mockResolvedValue([2]);

      const response = await request(app)
        .get('/places')
        .query({
          dates: '2025-07-01,2025-07-02',
          startTime: '10:00',
          endTime: '16:00'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(2);
    });

    test('should handle errors gracefully', async () => {
      Place.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/places');

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /agent/places (getAllPlaces)', () => {
    const mockPlaces = [
      { id: 1, title: 'Place 1', ownerId: 1 },
      { id: 2, title: 'Place 2', ownerId: 1 },
      { id: 3, title: 'Place 3', ownerId: 2 }
    ];

    beforeEach(() => {
      getUserDataFromToken.mockResolvedValue({ userType: 'agent', id: 999 });
      Place.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: mockPlaces
      });
    });

    test('should require agent authentication', async () => {
      getUserDataFromToken.mockResolvedValue({ userType: 'host', id: 1 });

      const response = await request(app).get('/agent/places');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Only agents can access all places');
    });

    test('should return paginated results without filters', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: [],
        startTime: null,
        endTime: null,
        hasDateFilter: false,
        hasTimeFilter: false
      });

      const response = await request(app)
        .get('/agent/places')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.places).toEqual(mockPlaces);
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 3,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    test('should apply availability filtering and adjust pagination', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: true,
        hasTimeFilter: true
      });

      PlaceAvailabilityService.filterAvailablePlaces.mockResolvedValue([1, 3]);

      const response = await request(app)
        .get('/agent/places')
        .query({
          dates: '2025-07-01',
          startTime: '09:00',
          endTime: '17:00',
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(2);
      expect(response.body.places.map(p => p.id)).toEqual([1, 3]);
      expect(response.body.pagination.totalItems).toBe(2);
    });

    test('should combine userId filter with availability filtering', async () => {
      PlaceAvailabilityService.parseAvailabilityFilters.mockReturnValue({
        selectedDates: ['2025-07-01'],
        startTime: '09:00',
        endTime: '17:00',
        hasDateFilter: true,
        hasTimeFilter: true
      });

      // Mock filtered by userId first
      Place.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockPlaces.filter(p => p.ownerId === 1) // Places 1 and 2
      });

      PlaceAvailabilityService.filterAvailablePlaces.mockResolvedValue([1]);

      const response = await request(app)
        .get('/agent/places')
        .query({
          userId: 1,
          dates: '2025-07-01',
          startTime: '09:00',
          endTime: '17:00'
        });

      expect(response.status).toBe(200);
      expect(response.body.places).toHaveLength(1);
      expect(response.body.places[0].id).toBe(1);
      
      // Verify that Place.findAndCountAll was called with userId filter
      const lastCall = Place.findAndCountAll.mock.calls[Place.findAndCountAll.mock.calls.length - 1];
      expect(lastCall[0].where).toEqual({ ownerId: 1 });
    });
  });
});
