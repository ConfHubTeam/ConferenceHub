import React from "react";

const TrendIndicator = ({ trend }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  
  if (isNeutral) {
    return (
      <span className="text-sm text-gray-500 flex items-center">
        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
        Stable
      </span>
    );
  }
  
  return (
    <span className={`text-sm font-medium flex items-center ${
      isPositive ? "text-green-600" : "text-red-600"
    }`}>
      <div className={`w-0 h-0 border-l-2 border-r-2 border-transparent mr-1 ${
        isPositive ? "border-b-2 border-b-green-500" : "border-t-2 border-t-red-500"
      }`}></div>
      {isPositive ? "+" : ""}{trend} this month
    </span>
  );
};

export default TrendIndicator;
