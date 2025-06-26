import { useState, useEffect } from "react";
import { isProtectionPlanAvailable, calculateProtectionPlanFee, getProtectionPlanPercentage } from "../utils/refundPolicyUtils";
import PriceDisplay from "./PriceDisplay";

/**
 * ProtectionPlanOption Component
 * Displays an optional protection plan upsell with price calculation
 */
export default function ProtectionPlanOption({ 
  placeDetail, 
  totalBookingPrice, 
  isSelected = false, 
  onSelectionChange,
  className = "" 
}) {
  const [protectionSelected, setProtectionSelected] = useState(isSelected);

  // Check if protection plan is available for this place
  const isAvailable = isProtectionPlanAvailable(placeDetail?.refundOptions);

  // Calculate protection plan fee
  const protectionFee = calculateProtectionPlanFee(totalBookingPrice);
  
  // Get configurable protection percentage for display
  const protectionPercentage = getProtectionPlanPercentage();

  // Update local state when prop changes
  useEffect(() => {
    setProtectionSelected(isSelected);
  }, [isSelected]);

  // Don't render if protection plan is not available or no booking price
  if (!isAvailable || !totalBookingPrice || totalBookingPrice <= 0) {
    return null;
  }

  const handleSelectionToggle = () => {
    const newSelection = !protectionSelected;
    setProtectionSelected(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection, protectionFee);
    }
  };

  return (
    <div className={`${className}`}>
      <label className={`flex items-start gap-3 p-4 border rounded-lg transition-colors cursor-pointer ${
        protectionSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:bg-gray-50'
      }`}>
        <input
          type="checkbox"
          checked={protectionSelected}
          onChange={handleSelectionToggle}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="font-semibold text-gray-900">Protection Plan</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                +<PriceDisplay 
                  price={protectionFee} 
                  currency={placeDetail.currency} 
                  className="inline"
                />
              </div>
              <div className="text-xs text-gray-500">
                {protectionPercentage}% of booking
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            <p className="mb-2">
              Cancel anytime and get a <strong>full refund</strong> of your booking amount.
            </p>
            <div className="bg-white border border-gray-200 rounded p-2">
              <h5 className="font-medium text-gray-800 text-xs mb-1">What's covered:</h5>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>✓ 100% refund of booking price</li>
                <li>✓ No questions asked cancellation</li>
                <li className="text-red-600">✗ Protection fee is non-refundable</li>
              </ul>
            </div>
          </div>
        </div>
      </label>
      
      {protectionSelected && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Protection Plan Active
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            You can cancel anytime and receive a full refund of your booking amount.
          </p>
        </div>
      )}
    </div>
  );
}
