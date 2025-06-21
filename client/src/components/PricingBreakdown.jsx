import PriceDisplay from "./PriceDisplay";
import { calculateServiceFee } from "../utils/pricingCalculator";

export default function PricingBreakdown({ 
  selectedCalendarDates = [], 
  totalHours, 
  totalPrice, 
  breakdown = [], 
  placeDetail,
  serviceFee,
  finalTotal
}) {
  // Only show pricing breakdown if there are selected calendar dates and hours
  if (!selectedCalendarDates || selectedCalendarDates.length === 0 || totalHours <= 0) {
    return null;
  }

  // Calculate service fee based on currency if not provided
  const displayServiceFee = serviceFee !== undefined ? serviceFee : calculateServiceFee(totalPrice, placeDetail);
  
  // Use finalTotal from calculator if provided, otherwise calculate it
  const displayTotal = finalTotal !== undefined ? finalTotal : totalPrice + displayServiceFee;

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
        
        <div className="flex px-3 pb-4 justify-between items-center text-gray-600">
          <p className="underline">Service fee</p>
          <p className="">
            <PriceDisplay 
              price={displayServiceFee} 
              currency={placeDetail.currency} 
              bold={false}
            />
          </p>
        </div>
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
