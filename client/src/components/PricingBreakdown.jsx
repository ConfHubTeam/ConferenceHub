import PriceDisplay from "./PriceDisplay";

export default function PricingBreakdown({ 
  selectedCalendarDates = [], 
  totalHours, 
  totalPrice, 
  breakdown = [], 
  placeDetail,
  protectionPlanFee = 0,
  finalTotal,
  // New props for booking details display
  basePrice,
  currency,
  numOfGuests,
  protectionPlanIncluded = false,
  title = "Pricing Breakdown",
  isBookingDetails = false // Flag to indicate this is showing saved booking data
}) {
  // Handle booking details display (showing saved data from database)
  if (isBookingDetails) {
    const displayCurrency = currency || placeDetail?.currency;
    const displayTotal = finalTotal || totalPrice;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        
        <div className="space-y-3">
          {/* Base Price */}
          <div className="flex justify-between items-center">          <span className="text-gray-600">Base price</span>
          <PriceDisplay 
            price={basePrice || totalPrice} 
            currency={displayCurrency} 
            bold={false}
          />
        </div>
        
        {/* Protection Plan Fee */}
        {protectionPlanIncluded && protectionPlanFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Protection plan</span>
              <PriceDisplay 
                price={protectionPlanFee} 
                currency={displayCurrency} 
                bold={false}
              />
            </div>
          )}
          
          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <PriceDisplay 
                price={displayTotal} 
                currency={displayCurrency} 
                bold={true}
                className="text-lg font-semibold"
              />
            </div>
          </div>
          
          {/* Additional Info */}
          {numOfGuests && (
            <div className="text-sm text-gray-500 pt-2">
              For {numOfGuests} {numOfGuests === 1 ? 'guest' : 'guests'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Only show pricing breakdown if there are selected calendar dates and hours
  if (!selectedCalendarDates || selectedCalendarDates.length === 0 || totalHours <= 0) {
    return null;
  }

  // Use finalTotal from calculator if provided, otherwise calculate it
  const displayTotal = finalTotal !== undefined ? finalTotal : totalPrice + protectionPlanFee;

  return (
    <div className="border-t">
      <div className="border-b">
        {/* Calendar-based pricing breakdown */}
        {breakdown.length > 0 && (
          <>
            {breakdown.map((item, index) => (
              <div key={index} className="flex px-3 py-2 justify-between items-center text-gray-600 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.date}</p>
                  <p className="text-xs text-gray-500">{item.timeSlot} • {item.priceType}</p>
                </div>
                <p className="">
                  <PriceDisplay 
                    price={item.price} 
                    currency={placeDetail.currency} 
                    bold={false}
                  />
                </p>
              </div>
            ))}
            <div className="flex px-3 py-3 justify-between items-center text-gray-600 border-t">
              <p className="underline font-medium">Subtotal ({totalHours} hours)</p>
              <p className="">
                <PriceDisplay 
                  price={totalPrice} 
                  currency={placeDetail.currency} 
                  bold={false}
                />
              </p>
            </div>
          </>
        )}
        
        {protectionPlanFee > 0 && (
          <div className="flex px-3 pb-4 justify-between items-center text-blue-600">
            <p className="underline flex items-center">
              <span className="mr-2">🛡️</span>
              Protection Plan
            </p>
            <p className="">
              <PriceDisplay 
                price={protectionPlanFee} 
                currency={placeDetail.currency} 
                bold={false}
              />
            </p>
          </div>
        )}
      </div>
      <div>
        <div className="flex px-3 py-4 justify-between items-center">
          <p className="underline">Total</p>
          <p className="">
            <PriceDisplay 
              price={displayTotal} 
              currency={placeDetail.currency} 
              bold={true}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
