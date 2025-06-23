import { format, parseISO } from "date-fns";

/**
 * Parse date safely - handles both Date objects and string dates
 */
const parseDateSafely = (dateString) => {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;
  
  // If it's a simple date string like "2024-12-25", parse it as local date
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  
  // For ISO strings with time, use parseISO from date-fns
  return parseISO(dateString);
};

/**
 * Group dates by year and month for smart formatting
 * @param {Array} timeSlots - Array of time slot objects with date property
 * @returns {string} Formatted date string
 */
export const formatBookingDates = (timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) return '';
  
  // Extract unique dates and parse them
  const uniqueDates = [...new Set(timeSlots.map(slot => slot.date))]
    .map(dateStr => ({
      original: dateStr,
      parsed: parseDateSafely(dateStr)
    }))
    .sort((a, b) => a.parsed - b.parsed);
  
  if (uniqueDates.length === 0) return '';
  
  // Group dates by year and month
  const groupedByYear = {};
  
  uniqueDates.forEach(({ parsed }) => {
    const year = parsed.getFullYear();
    const month = parsed.getMonth(); // 0-indexed
    const day = parsed.getDate();
    
    if (!groupedByYear[year]) {
      groupedByYear[year] = {};
    }
    if (!groupedByYear[year][month]) {
      groupedByYear[year][month] = [];
    }
    groupedByYear[year][month].push(day);
  });
  
  // Format the grouped dates
  const yearParts = [];
  
  Object.keys(groupedByYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(year => {
      const monthParts = [];
      
      Object.keys(groupedByYear[year])
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(month => {
          const days = groupedByYear[year][month].sort((a, b) => a - b);
          const monthName = format(new Date(parseInt(year), parseInt(month), 1), 'MMM');
          const daysList = days.join(', ');
          monthParts.push(`${daysList} ${monthName}`);
        });
      
      yearParts.push(`${monthParts.join(', ')} - ${year}`);
    });
  
  return yearParts.join(', ');
};
