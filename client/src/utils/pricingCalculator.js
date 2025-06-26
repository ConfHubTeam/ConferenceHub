// Centralized service fee configuration
export const SERVICE_FEE_CONFIG = {
  // Service fee rates per currency (base amounts)
  SERVICE_FEE_BY_CURRENCY: {
    UZS: parseInt(import.meta.env.VITE_FLAT_RATE_FEE_UZS) || 100000,
  },
  DEFAULT_CURRENCY: 'UZS',
  // You can add more service fee configurations here if needed
  // PERCENTAGE_BASED: false,
  // PERCENTAGE_RATE: 0.05,
};

// Protection Plan Configuration
export const PROTECTION_PLAN_CONFIG = {
  // Get protection percentage from environment variable, default to 20%
  PROTECTION_PERCENTAGE: parseInt(import.meta.env.VITE_PROTECTION_PLAN_PERCENTAGE) || 20,
  // Calculate protection rate for calculations automatically from percentage
  get PROTECTION_RATE() {
    return this.PROTECTION_PERCENTAGE / 100;
  },
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

// Calculate service fee based on configuration and currency
export const calculateServiceFee = (totalPrice, placeDetail, customServiceFee = null) => {
  // If a custom service fee is provided, use it
  if (customServiceFee !== null) {
    return customServiceFee;
  }
  
  // Get currency from place detail, fallback to default
  const currency = placeDetail?.currency?.code || SERVICE_FEE_CONFIG.DEFAULT_CURRENCY;
  
  // Get service fee for the specific currency
  const serviceFee = SERVICE_FEE_CONFIG.SERVICE_FEE_BY_CURRENCY[currency] || 
                     SERVICE_FEE_CONFIG.SERVICE_FEE_BY_CURRENCY[SERVICE_FEE_CONFIG.DEFAULT_CURRENCY];
  
  return serviceFee;
  
  // Future: Add percentage-based calculation if needed
  // if (SERVICE_FEE_CONFIG.PERCENTAGE_BASED) {
  //   return totalPrice * SERVICE_FEE_CONFIG.PERCENTAGE_RATE;
  // }
};

// Calculate total hours and pricing from selected calendar dates
export const calculateBookingPricing = (selectedCalendarDates, placeDetail, customServiceFee = null, protectionPlanSelected = false) => {
  if (!selectedCalendarDates || selectedCalendarDates.length === 0) {
    const serviceFee = calculateServiceFee(0, placeDetail, customServiceFee);
    return {
      totalHours: 0,
      regularHours: 0,
      fullDays: 0,
      regularPrice: 0,
      fullDayPrice: 0,
      totalPrice: 0,
      serviceFee,
      protectionPlanFee: 0,
      finalTotal: serviceFee,
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

  // Calculate service fee using the centralized function with currency awareness
  const serviceFee = calculateServiceFee(totalPrice, placeDetail, customServiceFee);
  
  // Calculate protection plan fee using configurable rate
  const protectionPlanFee = protectionPlanSelected ? Math.round(totalPrice * PROTECTION_PLAN_CONFIG.PROTECTION_RATE) : 0;
  
  // Calculate final total with service fee and protection plan
  const finalTotal = totalPrice + serviceFee + protectionPlanFee;

  return {
    totalHours,
    totalPrice,
    serviceFee,
    protectionPlanFee,
    finalTotal,
    breakdown
  };
};
