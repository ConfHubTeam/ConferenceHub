import React from "react";
import { useTranslation } from "react-i18next";

const PerformanceBadge = ({ rating }) => {
  const { t } = useTranslation(["dashboard", "reviews"]);
  const avgRating = parseFloat(rating);
  let badgeColor = "bg-gray-100 text-gray-600";
  let badgeText = t("dashboard:performance.noData");
  
  if (avgRating >= 4.5) {
    badgeColor = "bg-green-100 text-green-700";
    badgeText = t("dashboard:performance.excellent");
  } else if (avgRating >= 4.0) {
    badgeColor = "bg-blue-100 text-blue-700";
    badgeText = t("dashboard:performance.great");
  } else if (avgRating >= 3.5) {
    badgeColor = "bg-yellow-100 text-yellow-700";
    badgeText = t("dashboard:performance.good");
  } else if (avgRating >= 3.0) {
    badgeColor = "bg-orange-100 text-orange-700";
    badgeText = t("dashboard:performance.fair");
  } else if (avgRating > 0) {
    badgeColor = "bg-red-100 text-red-700";
    badgeText = t("dashboard:performance.poor");
  }
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
      {badgeText}
    </span>
  );
};

export default PerformanceBadge;
