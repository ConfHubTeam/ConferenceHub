import React from "react";

const PerformanceBadge = ({ rating }) => {
  const avgRating = parseFloat(rating);
  let badgeColor = "bg-gray-100 text-gray-600";
  let badgeText = "No Data";
  
  if (avgRating >= 4.5) {
    badgeColor = "bg-green-100 text-green-700";
    badgeText = "Excellent";
  } else if (avgRating >= 4.0) {
    badgeColor = "bg-blue-100 text-blue-700";
    badgeText = "Great";
  } else if (avgRating >= 3.5) {
    badgeColor = "bg-yellow-100 text-yellow-700";
    badgeText = "Good";
  } else if (avgRating >= 3.0) {
    badgeColor = "bg-orange-100 text-orange-700";
    badgeText = "Fair";
  } else if (avgRating > 0) {
    badgeColor = "bg-red-100 text-red-700";
    badgeText = "Poor";
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
      {badgeText}
    </span>
  );
};

export default PerformanceBadge;
