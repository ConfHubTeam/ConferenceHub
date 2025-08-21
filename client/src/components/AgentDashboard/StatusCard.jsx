import React from "react";

const StatusCard = ({ icon: Icon, iconBgColor, iconColor, count, label, trend = null }) => (
  <div className="text-center">
    <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <div className="flex items-center justify-center space-x-2">
      <p className="text-2xl font-bold text-gray-900">{count}</p>
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
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

export default StatusCard;
