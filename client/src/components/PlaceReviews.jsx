import { useState, useContext } from "react";
import useReviews from "../hooks/useReviews";
import StarRating from "./StarRating";
import ReviewCard from "./ReviewCard";
import ReviewRatingBreakdown from "./ReviewRatingBreakdown";
import ReviewSortFilter from "./ReviewSortFilter";
import ReviewForm from "./ReviewForm";
import { UserContext } from "./UserContext";
import { createReviewReply, updateReviewReply } from "../utils/api";

export default function PlaceReviews({ placeId, placeOwnerId }) {
  const { user } = useContext(UserContext);
  const {
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
    updateReview
  } = useReviews(placeId);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  // Check if current user has already reviewed this place
  const userReview = user ? reviews.find(review => review.User && review.User.id === user.id) : null;
  
  // Check if current user is the place owner (host cannot review their own place)
  const isPlaceOwner = user && placeOwnerId && user.id === placeOwnerId;

  // Handle helpful click
  const handleHelpfulClick = async (reviewId) => {
    try {
      await markHelpful(reviewId);
    } catch (error) {
      console.error("Failed to mark review as helpful:", error);
    }
  };

  // Handle report click
  const handleReportClick = (reviewId) => {
    setReportingReviewId(reviewId);
    setReportModalOpen(true);
  };

  // Handle report submission
  const handleReportSubmit = async (reason) => {
    if (!reportingReviewId) return;

    try {
      await reportReview(reportingReviewId, reason);
      setReportModalOpen(false);
      setReportingReviewId(null);
    } catch (error) {
      console.error("Failed to report review:", error);
    }
  };

  // Handle review form submission
  const handleReviewSubmitted = (newReview) => {
    // Only add new reviews since editing is no longer allowed
    addReview(newReview);
  };

  // Handle host reply submission - US-R007
  const handleReplySubmit = async (reviewId, replyText) => {
    setReplyLoading(true);
    try {
      const response = await createReviewReply(reviewId, replyText);
      if (response.ok) {
        // Update the specific review in the reviews array
        const updatedReview = reviews.find(review => review.id === reviewId);
        if (updatedReview) {
          updateReview({
            ...updatedReview,
            Reply: response.reply
          });
        }
      }
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle host reply edit submission - US-R007
  const handleEditReply = async (reviewId, replyText) => {
    setReplyLoading(true);
    try {
      const response = await updateReviewReply(reviewId, replyText);
      if (response.ok) {
        // Update the specific review in the reviews array
        const updatedReview = reviews.find(review => review.id === reviewId);
        if (updatedReview) {
          updateReview({
            ...updatedReview,
            Reply: response.reply
          });
        }
      }
    } catch (error) {
      console.error("Failed to update reply:", error);
      alert("Failed to update reply. Please try again.");
    } finally {
      setReplyLoading(false);
    }
  };

  // Don't render anything if there are no reviews and no loading state
  if (!loading && reviewStats.totalReviews === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Reviews</h2>
        
        {/* Review Form for new users */}
        {!isPlaceOwner && (
          <ReviewForm 
            placeId={placeId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
        
        {isPlaceOwner && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              As the host of this place, you cannot leave a review.
            </p>
          </div>
        )}
        
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">No reviews yet</p>
          <p className="text-gray-500 text-sm">Be the first to share your experience!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold mb-6">Reviews</h2>

      {/* Review Form - show only if user hasn't reviewed yet and is not the place owner */}
      {!userReview && !isPlaceOwner && (
        <ReviewForm 
          placeId={placeId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Message for place owner */}
      {isPlaceOwner && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            As the host of this place, you cannot leave a review.
          </p>
        </div>
      )}

      {/* Reviews Header with Overall Rating */}
      {reviewStats.totalReviews > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <StarRating rating={reviewStats.averageRating} size="lg" />
              <span className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</span>
            </div>
            <div className="text-gray-600">
              {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Rating Breakdown */}
          <ReviewRatingBreakdown
            ratingBreakdown={reviewStats.ratingBreakdown}
            totalReviews={reviewStats.totalReviews}
          />
        </div>
      )}

      {/* Sort Filter */}
      {reviewStats.totalReviews > 0 && (
        <div className="mb-6">
          <ReviewSortFilter sortBy={sortBy} onSortChange={changeSortOrder} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onHelpfulClick={handleHelpfulClick}
            onReportClick={handleReportClick}
            onReplyClick={handleReplySubmit}
            onEditReply={handleEditReply}
            placeOwnerId={placeOwnerId}
            isLoading={replyLoading}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? "Loading..." : "Load More Reviews"}
          </button>
        </div>
      )}

      {/* Loading State for Initial Load */}
      {loading && reviews.length === 0 && (
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-start gap-4 p-6 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          onClose={() => {
            setReportModalOpen(false);
            setReportingReviewId(null);
          }}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}

// Simple report modal component for reporting reviews
function ReportModal({ onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: "spam", label: "Spam" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "fake", label: "Fake review" },
    { value: "harassment", label: "Harassment" },
    { value: "off_topic", label: "Off-topic" },
    { value: "other", label: "Other" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    setSubmitting(true);
    try {
      await onSubmit(selectedReason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Report Review</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 mb-6">
            {reasons.map((reason) => (
              <label 
                key={reason.value} 
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                  selectedReason === reason.value 
                    ? "border-red-500 bg-red-50 text-red-900" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-sm font-medium">{reason.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
