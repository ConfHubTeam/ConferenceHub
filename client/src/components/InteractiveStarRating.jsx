import { useState } from "react";

export default function InteractiveStarRating({ 
  rating, 
  onRatingChange, 
  size = "lg", 
  disabled = false,
  showLabel = true 
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10"
  };

  const starSize = sizeClasses[size] || sizeClasses.lg;

  const ratingLabels = {
    1: "Poor",
    2: "Fair", 
    3: "Good",
    4: "Very Good",
    5: "Excellent"
  };

  const handleMouseEnter = (star) => {
    if (!disabled) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const handleClick = (star) => {
    if (!disabled) {
      onRatingChange(star);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= activeRating;
          
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              className={`transition-colors duration-150 ${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              } ${isActive ? "text-yellow-400" : "text-gray-300"} hover:scale-110 transform transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded`}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(star)}
            >
              <svg
                className={starSize}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
      
      {showLabel && activeRating > 0 && (
        <span className="mt-2 text-sm font-medium text-gray-700">
          {ratingLabels[activeRating]}
        </span>
      )}
    </div>
  );
}
