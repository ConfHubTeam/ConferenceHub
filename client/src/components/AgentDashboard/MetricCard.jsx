import React from "react";

const MetricCard = ({ icon: Icon, iconBgColor, iconColor, title, value, className = "", trend = null }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <div className="flex items-center">
      <div className={`p-2 ${iconBgColor} rounded-lg`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center space-x-1">
              <div className={`w-0 h-0 border-l-2 border-r-2 border-transparent ${
                trend.direction === 'up' 
                  ? 'border-b-2 border-b-green-500' 
                  : trend.direction === 'down'
                  ? 'border-t-2 border-t-red-500'
                  : 'border-b-2 border-b-gray-400'
              }`}></div>
              <span className={`text-xs font-medium ${
                trend.direction === 'up' 
                  ? 'text-green-600' 
                  : trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default MetricCard;
