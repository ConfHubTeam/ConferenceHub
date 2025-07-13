import React from "react";

const BookingStatusItem = ({ icon: Icon, iconBgColor, iconColor, count, label }) => (
  <div className="text-center">
    <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900">{count}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

export default BookingStatusItem;
