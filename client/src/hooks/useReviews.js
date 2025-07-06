import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

/**
 * Custom hook for handling place reviews
 * @param {string} placeId - ID of the place to get reviews for
 * @returns {Object} - Reviews data and methods
 */
export default function useReviews(placeId) {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const reviewsPerPage = 8;

  // Fetch reviews with pagination and sorting
  const fetchReviews = useCallback(async (reset = false) => {
    if (!placeId) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const response = await api.get(`/reviews/place/${placeId}`, {
        params: {
          page: currentPage,
          sortBy
        }
      });

      const { reviews: newReviews, totalReviews, averageRating, ratingBreakdown, pagination } = response.data;

      if (reset) {
        setReviews(newReviews);
        setPage(1);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setReviewStats({
        totalReviews,
        averageRating: averageRating || 0,
        ratingBreakdown: ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });

      // Use pagination info from backend for more accurate hasMore
      setHasMore(pagination?.hasNextPage || false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError(error.response?.data?.error || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [placeId, page, sortBy]);

  // Load more reviews
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  // Change sort order
  const changeSortOrder = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    setPage(1);
    setHasMore(true);
  }, []);

  // Mark review as helpful
  const markHelpful = useCallback(async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      const { isHelpful } = response.data;
      
      // Update the specific review in the list
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { 
                ...review, 
                helpfulCount: isHelpful 
                  ? review.helpfulCount + 1 
                  : review.helpfulCount - 1,
                isHelpful 
              }
            : review
        )
      );
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      throw error;
    }
  }, []);

  // Report review
  const reportReview = useCallback(async (reviewId, reason) => {
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason });
      // Mark review as reported in the UI
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, isReported: true }
            : review
        )
      );
    } catch (error) {
      console.error("Error reporting review:", error);
      throw error;
    }
  }, []);

  // Add new review to the list and update stats
  const addReview = useCallback((newReview) => {
    setReviews(prev => [newReview, ...prev]);
    
    // Refresh stats from server to ensure accurate calculations
    fetchReviews(true);
  }, [fetchReviews]);

  // Update existing review in the list and update stats
  const updateReview = useCallback((updatedReview) => {
    setReviews(prev =>
      prev.map(review =>
        review.id === updatedReview.id ? updatedReview : review
      )
    );
    
    // For simplicity, refresh stats from server after update
    fetchReviews(true);
  }, [fetchReviews]);

  // Initial fetch when placeId or sortBy changes
  useEffect(() => {
    if (placeId) {
      fetchReviews(true);
    }
  }, [placeId, sortBy]);

  // Fetch more when page changes (but not on initial load)
  useEffect(() => {
    if (page > 1) {
      fetchReviews(false);
    }
  }, [page]);

  return {
    reviews,
    reviewStats,
    loading,
    error,
    hasMore,
    sortBy,
    loadMore,
    changeSortOrder,
    markHelpful,
    reportReview,
    addReview,
    updateReview,
    refresh: () => fetchReviews(true)
  };
}
