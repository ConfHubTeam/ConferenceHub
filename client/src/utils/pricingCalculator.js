// Centralized pricing configuration for conference room bookings
export const PRICING_CONFIG = {
  DEFAULT_CURRENCY: 'UZS',
};

// Helper function to format hour to 12-hour format
const formatHourTo12 = (hour24) => {
  if (!hour24) return "";
  const [hours] = hour24.split(':');
  const hourNum = parseInt(hours, 10);
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
  const amPm = hourNum < 12 ? 'AM' : 'PM';
  return `${displayHour}:00 ${amPm}`;
};

// Calculate total hours and pricing from selected calendar dates
export const calculateBookingPricing = (selectedCalendarDates, placeDetail) => {
  if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
    return {
      totalHours: 0,
      regularHours: 0,
      fullDays: 0,
      regularPrice: 0,
      fullDayPrice: 0,
      totalPrice: 0,
      finalTotal: 0,
      breakdown: []
    };
  }

  const { 
    price: hourlyRate, 
    fullDayHours = 8, 
    fullDayDiscountPrice = 0 
  } = placeDetail;

  let totalHours = 0;
  let totalPrice = 0;
  let breakdown = [];

  selectedCalendarDates.forEach(dateSlot => {
    const startTime = dateSlot.startTime;
    const endTime = dateSlot.endTime;
    
    // Calculate hours for this date slot
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    const hoursForThisSlot = endHour - startHour;
    
    totalHours += hoursForThisSlot;
    
    // Determine pricing for this slot
    let slotPrice = 0;
    let priceType = '';
    
    if (hoursForThisSlot >= fullDayHours && fullDayDiscountPrice > 0) {
      // Full day pricing
      const fullDaysUsed = Math.floor(hoursForThisSlot / fullDayHours);
      const remainingHours = hoursForThisSlot % fullDayHours;
      
      slotPrice = (fullDaysUsed * fullDayDiscountPrice) + (remainingHours * hourlyRate);
      priceType = fullDaysUsed > 0 ? `${fullDaysUsed} full day${fullDaysUsed > 1 ? 's' : ''} + ${remainingHours}h` : `${hoursForThisSlot}h`;
    } else {
      // Regular hourly pricing
      slotPrice = hoursForThisSlot * hourlyRate;
      priceType = `${hoursForThisSlot}h`;
    }
    
    totalPrice += slotPrice;
    
    breakdown.push({
      date: dateSlot.formattedDate,
      timeSlot: `${formatHourTo12(startTime)} - ${formatHourTo12(endTime)}`,
      hours: hoursForThisSlot,
      price: slotPrice,
      priceType
    });
  });

  // Calculate final total
  const finalTotal = totalPrice;

  return {
    totalHours,
    totalPrice,
    finalTotal,
    breakdown
  };
};
