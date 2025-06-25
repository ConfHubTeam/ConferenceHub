import { format, parseISO } from "date-fns";
import { getCurrentDateObjectInUzbekistan } from "../utils/uzbekistanTimezoneUtils";

// Helper function to safely parse date strings without timezone issues
const parseDateSafely = (dateString) => {
  if (!dateString) return getCurrentDateObjectInUzbekistan(); // Use Uzbekistan time as default
  
  // If it's already a Date object, return as is
  if (dateString instanceof Date) return dateString;
  
  // If it's a simple date string like "2024-12-25", parse it as local date
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  
  // For ISO strings with time, use parseISO from date-fns
  return parseISO(dateString);
};

export default function DateDuration({checkInDate, checkOutDate}) {
  return (
    <div>
      {checkInDate && (
        <div className="flex gap-1 items-center -mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          {format(parseDateSafely(checkInDate), "yyy-MM-dd")} -{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          {format(parseDateSafely(checkOutDate), "yyy-MM-dd")}
        </div>
      )}
    </div>
  );
}
