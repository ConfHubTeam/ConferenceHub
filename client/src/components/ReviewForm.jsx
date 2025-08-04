import { useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";
import InteractiveStarRating from "./InteractiveStarRating";
import api from "../utils/api";
import { useTranslation } from "../i18n/hooks/useTranslation";

export default function ReviewForm({ placeId, onReviewSubmitted, existingReview = null, onCancel, placeOwnerId }) {
  const { user } = useContext(UserContext);
  const { notify } = useNotification();
  const { t } = useTranslation("reviews");
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Character limits
  const MIN_COMMENT_LENGTH = 10;
  const MAX_COMMENT_LENGTH = 1000;

  // Fetch eligible bookings when component mounts
  useEffect(() => {
    if (user && !existingReview) {
      fetchEligibleBookings();
    }
  }, [user, placeId]);

  const fetchEligibleBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await api.get("/reviews/eligibility/bookings");
      
      if (response.data.ok) {
        // Filter bookings for the current place
        const placeBookings = response.data.bookings.filter(
          booking => booking.placeId === parseInt(placeId)
        );
        
        setEligibleBookings(placeBookings);
        
        // Auto-select if only one booking available
        if (placeBookings.length === 1) {
          setSelectedBookingId(placeBookings[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching eligible bookings:", error);
      notify(t("reviewForm.messages.loadBookingsError"), "error");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Validation
  const isValidRating = rating >= 1 && rating <= 5;
  const isValidComment = comment.trim().length >= MIN_COMMENT_LENGTH && comment.trim().length <= MAX_COMMENT_LENGTH;
  const isValidBooking = existingReview || selectedBookingId !== "";
  const isFormValid = isValidRating && isValidComment && isValidBooking;

  // Check if user has eligible bookings for this place
  const hasEligibleBookings = eligibleBookings.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      const reviewData = {
        placeId: parseInt(placeId),
        rating,
        comment: comment.trim()
      };

      // Add bookingId for new reviews
      if (!existingReview) {
        reviewData.bookingId = parseInt(selectedBookingId);
      }

      let response;
      if (existingReview) {
        // Update existing review
        response = await api.put(`/reviews/${existingReview.id}`, reviewData);
      } else {
        // Create new review
        response = await api.post("/reviews", reviewData);
      }

      // Call the callback to update the parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response.data);
      }

      // Show success notification
      notify(
        existingReview ? t("reviewForm.messages.updateSuccess") : t("reviewForm.messages.submitSuccess"),
        "success"
      );

      // Reset form if creating new review
      if (!existingReview) {
        setRating(0);
        setComment("");
        setSelectedBookingId("");
        setShowForm(false);
      }

    } catch (error) {
      console.error("Error submitting review:", error);
      let errorMessage = t("reviewForm.messages.submitError");
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setError(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (existingReview) {
      // Reset to original values
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      // Clear form
      setRating(0);
      setComment("");
      setSelectedBookingId("");
      setShowForm(false);
    }
    setError("");
    
    // Call onCancel callback if provided
    if (onCancel) {
      onCancel();
    }
  };

  // Don't show anything if user is not authenticated
  if (!user) {
    return null;
  }

  // Don't show anything if user is agent or host (they shouldn't review)
  if (isAgent || isPlaceOwner) {
    return null;
  }

  // Don't show form if user hasn't completed a booking for this place (only for regular clients)
  if (user && !existingReview && !loadingBookings && !hasEligibleBookings) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t("reviewForm.eligibility.noBookings.title")}</h3>
            <p className="text-sm text-gray-600">{t("reviewForm.eligibility.noBookings.description")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking eligibility
  if (user && !existingReview && loadingBookings) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">{t("reviewForm.eligibility.checking")}</span>
        </div>
      </div>
    );
  }

  // If editing existing review or form is not shown, show the toggle button (only if eligible bookings exist)
  if (!existingReview && !showForm && hasEligibleBookings) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("reviewForm.writeButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">
          {existingReview ? t("reviewForm.editTitle") : t("reviewForm.title")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Selection Section - Only for new reviews */}
          {!existingReview && eligibleBookings.length > 1 && (
            <div>
              {loadingBookings ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">{t("reviewForm.fields.booking.loading")}</span>
                </div>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="">{t("reviewForm.fields.booking.placeholder")}</option>
                  {eligibleBookings.map((booking, index) => (
                    <option key={booking.id} value={booking.id}>
                      {t("reviewForm.fields.booking.option", { number: index + 1 })}
                    </option>
                  ))}
                </select>
              )}
              {!isValidBooking && selectedBookingId === "" && eligibleBookings.length > 1 && (
                <p className="mt-2 text-sm text-red-600">{t("reviewForm.fields.booking.error")}</p>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("reviewForm.fields.rating.label")} {t("reviewForm.fields.rating.required")}
            </label>
            <InteractiveStarRating
              rating={rating}
              onRatingChange={setRating}
              size="xl"
              disabled={isSubmitting}
            />
            {!isValidRating && rating > 0 && (
              <p className="mt-2 text-sm text-red-600">{t("reviewForm.fields.rating.error")}</p>
            )}
          </div>

          {/* Comment Section */}
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
              {t("reviewForm.fields.comment.label")} {t("reviewForm.fields.comment.required")}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviewForm.fields.comment.placeholder")}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              rows={4}
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {comment.trim().length < MIN_COMMENT_LENGTH && comment.length > 0 && (
                  <span className="text-red-600">
                    {t("reviewForm.fields.comment.minLength", { min: MIN_COMMENT_LENGTH })}
                  </span>
                )}
                {comment.trim().length >= MIN_COMMENT_LENGTH && (
                  <span className="text-green-600">
                    {t("reviewForm.fields.comment.validLength")}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {t("reviewForm.fields.comment.characterCount", { current: comment.length, max: MAX_COMMENT_LENGTH })}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {t("reviewForm.buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {existingReview ? t("reviewForm.buttons.updating") : t("reviewForm.buttons.submitting")}
                </div>
              ) : (
                existingReview ? t("reviewForm.buttons.update") : t("reviewForm.buttons.submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
