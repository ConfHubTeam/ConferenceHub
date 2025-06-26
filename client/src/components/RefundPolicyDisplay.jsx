import { getRefundPolicyDisplayData, isProtectionPlanAvailable, getProtectionPlanPercentage } from "../utils/refundPolicyUtils";

/**
 * RefundPolicyDisplay Component
 * Displays the selected refund policies for a place in a professional format
 */
export default function RefundPolicyDisplay({ placeDetail, className = "" }) {
  if (!placeDetail || !placeDetail.refundOptions || placeDetail.refundOptions.length === 0) {
    return null;
  }

  const refundPolicies = getRefundPolicyDisplayData(placeDetail.refundOptions);
  const hasProtectionPlan = isProtectionPlanAvailable(placeDetail.refundOptions);
  const protectionPercentage = getProtectionPlanPercentage();
  
  // Filter out protection plan from display since it's shown separately
  const actualPolicies = refundPolicies.filter(policy => policy.type !== 'protection');

  if (actualPolicies.length === 0 && !hasProtectionPlan) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Cancellation & Refund Policy
      </h2>
      
      <div className="space-y-4">
        {/* Primary Refund Policies */}
        {actualPolicies.length > 0 && (
          <div className="space-y-3">
            {actualPolicies.map((policy, index) => (
              <div 
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  policy.type === 'flexible' ? 'bg-green-50 border-green-200' :
                  policy.type === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{policy.icon}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    policy.type === 'flexible' ? 'text-green-800' :
                    policy.type === 'moderate' ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>
                    {policy.label}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    policy.type === 'flexible' ? 'text-green-700' :
                    policy.type === 'moderate' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {policy.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Protection Plan Availability Notice */}
        {hasProtectionPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-0.5">🛡️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-blue-800">
                  Protection Plan Available
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Add protection during booking for peace of mind cancellation (+{protectionPercentage}% of booking price)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Important Notes
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Cancellation policies apply to the booking start time in Uzbekistan timezone</li>
            <li>• Refunds are processed within 3-5 business days</li>
            <li>• Service fees are non-refundable unless specified otherwise</li>
            {hasProtectionPlan && (
              <li>• Protection Plan fee is non-refundable but covers the full booking amount</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
