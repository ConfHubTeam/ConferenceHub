import React from "react";

const StatsSummaryCard = ({ icon: Icon, iconBgColor, iconColor, value, label, subValue = null, subLabel = null }) => (
  <div className="text-center">
    <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mb-2">{label}</p>
    {subValue && subLabel && (
      <div className="pt-2 border-t border-gray-200">
        <p className="text-lg font-semibold text-gray-700">{subValue}</p>
        <p className="text-xs text-gray-500">{subLabel}</p>
      </div>
    )}
  </div>
);

export default StatsSummaryCard;
