import { getPriorityInfo } from "../utils/bookingPriority";

/**
 * Small priority indicator showing total hours when there are competitors
 * Shows "P 7h" format - P for Priority, followed by hours
 */
export default function PriorityIndicator({ currentBooking, competingBookings = [] }) {
  const { hasCompetitors, isHighestHours, currentHours } = getPriorityInfo(
    currentBooking, 
    competingBookings
  );

  // Only show indicator if there are competitors and current booking has hours
  if (!hasCompetitors || currentHours === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      isHighestHours 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }`}>
      <span className="mr-1">P</span>
      <span>{currentHours}h</span>
    </div>
  );
}
