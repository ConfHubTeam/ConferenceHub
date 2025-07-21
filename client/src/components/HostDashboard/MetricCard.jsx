import React from "react";

const MetricCard = ({ icon: Icon, iconBgColor, iconColor, title, value, className = "" }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    <div className="flex items-center">
      <div className={`p-2 ${iconBgColor} rounded-lg`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default MetricCard;
