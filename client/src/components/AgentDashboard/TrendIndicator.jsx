import React from "react";

const TrendIndicator = ({ trend, size = "sm" }) => {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  if (!trend || trend === "neutral") {
    return (
      <span className={`${sizeClasses[size]} text-gray-600 flex items-center`}>
        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
        No change
      </span>
    );
  }

  const isPositive = trend === "up";
  
  return (
    <span className={`${sizeClasses[size]} font-medium flex items-center ${
      isPositive ? 'text-green-600' : 'text-red-600'
    }`}>
      <div className={`${iconSizes[size]} border-l-2 border-r-2 border-transparent mr-1 ${
        isPositive 
          ? 'border-b-2 border-b-green-500' 
          : 'border-t-2 border-t-red-500'
      }`}></div>
      {isPositive ? 'Trending up' : 'Trending down'}
    </span>
  );
};

export default TrendIndicator;
