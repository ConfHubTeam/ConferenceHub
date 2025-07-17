/**
 * Debug Date Comparison
 * Check why date comparison is not working correctly
 */

function debugDateComparison() {
  console.log("🔍 DEBUGGING DATE COMPARISON");
  console.log("============================");

  // Test the same dates as in our booking
  const checkInDate = new Date('2025-07-20');
  const checkOutDate = new Date('2025-07-20');
  
  console.log("📅 Check-in date:", checkInDate);
  console.log("📅 Check-out date:", checkOutDate);
  console.log("📅 Are they equal (===)?", checkInDate === checkOutDate);
  console.log("📅 Are they equal (.getTime())?", checkInDate.getTime() === checkOutDate.getTime());
  console.log("📅 Formatted dates equal?", checkInDate.toISOString().split('T')[0] === checkOutDate.toISOString().split('T')[0]);
  
  // Test the _formatDate function logic
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formattedCheckIn = formatDate(checkInDate);
  const formattedCheckOut = formatDate(checkOutDate);
  
  console.log("📅 Formatted check-in:", formattedCheckIn);
  console.log("📅 Formatted check-out:", formattedCheckOut);
  console.log("📅 Formatted dates equal?", formattedCheckIn === formattedCheckOut);
  
  // Simulate the dateRange logic
  const dateRange = checkInDate === checkOutDate 
    ? formatDate(checkInDate)
    : `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`;
    
  console.log("📅 Final dateRange:", dateRange);
  
  // Better date comparison
  const betterDateRange = checkInDate.getTime() === checkOutDate.getTime()
    ? formatDate(checkInDate)
    : `${formatDate(checkInDate)} - ${formatDate(checkOutDate)}`;
    
  console.log("📅 Better dateRange:", betterDateRange);
}

debugDateComparison();
