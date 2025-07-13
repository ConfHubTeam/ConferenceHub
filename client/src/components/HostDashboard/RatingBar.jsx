import React from "react";
import { StarIcon } from "@heroicons/react/24/outline";

const RatingBar = ({ rating, count, percentage, showDetailed = false }) => {
  const getBarColor = (rating) => {
    const colors = {
      5: "bg-emerald-500",
      4: "bg-blue-500", 
      3: "bg-yellow-500",
      2: "bg-orange-500",
      1: "bg-red-500"
    };
    return colors[rating] || "bg-gray-300";
  };

  if (showDetailed) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center w-8">
          <span className="text-xs font-medium text-gray-700">{rating}</span>
          <StarIcon className="w-3 h-3 text-yellow-400 ml-1" />
        </div>
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(rating)}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-16 text-right">
          <span className="text-xs font-medium text-gray-600">{count}</span>
          <span className="text-xs text-gray-400">({percentage}%)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{rating}</span>
        <StarIcon className="w-4 h-4 text-yellow-400 ml-1" />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className={`h-3 rounded-full transition-all duration-700 ease-out ${getBarColor(rating)}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-bold text-gray-900">{count}</div>
        <div className="text-xs text-gray-500">({percentage}%)</div>
      </div>
    </div>
  );
};

export default RatingBar;
