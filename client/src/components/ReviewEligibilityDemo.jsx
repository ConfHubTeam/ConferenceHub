/**
 * Review Eligibility Component
 * Demonstrates the new review system that shows eligibility instead of errors
 * Follows React best practices with hooks and proper error handling
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reviewAPI } from '../services/api';

const ReviewEligibilityDemo = ({ placeId }) => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState(null);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (user && placeId) {
      checkEligibility();
      fetchEligibleBookings();
    }
  }, [user, placeId]);

  const checkEligibility = async () => {
    try {
      const response = await reviewAPI.checkEligibility(placeId);
      setEligibility(response.eligibility);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const fetchEligibleBookings = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getEligibleBookings();
      setEligibleBookings(response.bookings);
    } catch (error) {
      console.error('Error fetching eligible bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    try {
      const response = await reviewAPI.createReview({
        placeId,
        bookingId: selectedBooking.id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });

      if (response.ok) {
        // Review submitted successfully
        alert('Review submitted successfully!');
        // Refresh eligibility
        checkEligibility();
        fetchEligibleBookings();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const getEligibilityMessage = () => {
    if (!eligibility) return null;

    switch (eligibility.status) {
      case 'eligible':
        return (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-medium">✅ You can leave a review!</p>
            <p className="text-sm">{eligibility.message}</p>
          </div>
        );
      
      case 'no_booking':
        return (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="font-medium">📅 Book a stay to review</p>
            <p className="text-sm">{eligibility.message}</p>
          </div>
        );
      
      case 'booking_not_approved':
        return (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <p className="font-medium">⏳ Booking pending approval</p>
            <p className="text-sm">{eligibility.message}</p>
          </div>
        );
      
      case 'booking_not_completed':
        return (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <p className="font-medium">🏠 Complete your stay first</p>
            <p className="text-sm">{eligibility.message}</p>
            {eligibility.completesAt && (
              <p className="text-sm mt-1">
                You can review after: {new Date(eligibility.completesAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      
      case 'already_reviewed':
        return (
          <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">
            <p className="font-medium">✍️ Already reviewed</p>
            <p className="text-sm">{eligibility.message}</p>
          </div>
        );
      
      case 'own_place':
        return (
          <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">
            <p className="font-medium">🏡 Can't review your own place</p>
            <p className="text-sm">{eligibility.message}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderReviewForm = () => {
    if (!eligibility?.eligible) return null;

    const relevantBookings = eligibleBookings.filter(booking => 
      booking.placeId === parseInt(placeId)
    );

    return (
      <div className="mt-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
        
        {relevantBookings.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select which stay to review:
            </label>
            <select 
              value={selectedBooking?.id || ''}
              onChange={(e) => {
                const booking = relevantBookings.find(b => b.id === parseInt(e.target.value));
                setSelectedBooking(booking);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a booking...</option>
              {relevantBookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {(relevantBookings.length === 1 || selectedBooking) && (
          <>
            {relevantBookings.length === 1 && !selectedBooking && (
              <div className="mb-4">
                <button
                  onClick={() => setSelectedBooking(relevantBookings[0])}
                  className="bg-info-500 text-white px-4 py-2 rounded hover:bg-info-600"
                >
                  Review your stay from {new Date(relevantBookings[0].checkInDate).toLocaleDateString()}
                </button>
              </div>
            )}

            {selectedBooking && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Rating:</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Comment (optional):</label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full p-2 border rounded"
                    rows="4"
                    placeholder="Share your experience..."
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  className="bg-success-500 text-white px-6 py-2 rounded hover:bg-success-600"
                >
                  Submit Review
                </button>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading review eligibility...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Review Status</h2>
      
      {getEligibilityMessage()}
      
      {renderReviewForm()}

      {/* Show all eligible bookings for user reference */}
      {eligibleBookings.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Your Completed Stays Available for Review</h3>
          <div className="space-y-2">
            {eligibleBookings.map(booking => (
              <div key={booking.id} className="p-3 border rounded bg-gray-50">
                <h4 className="font-medium">{booking.place?.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-green-600">✅ Available for review</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// API service example
export const reviewAPI = {
  checkEligibility: async (placeId) => {
    const response = await fetch(`/api/reviews/eligibility/place/${placeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  getEligibleBookings: async () => {
    const response = await fetch('/api/reviews/eligibility/bookings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  createReview: async (reviewData) => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(reviewData)
    });
    return response.json();
  }
};

export default ReviewEligibilityDemo;
