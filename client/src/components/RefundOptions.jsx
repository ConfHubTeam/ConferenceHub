import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  getProtectionPlanPercentage, 
  getRefundOptionsMetadata,
  CONFLICTING_OPTIONS
} from "../utils/refundPolicyConfig";

/**
 * RefundOptions Component
 * Handles the selection of refund options for places
 * Uses centralized configuration for consistency
 */
export default function RefundOptions({ 
  selectedOptions = [], 
  onOptionsChange, 
  isRequired = true,
  className = "" 
}) {
  const { t, i18n } = useTranslation('refundPolicies');
  const [refundOptions, setRefundOptions] = useState(selectedOptions);
  
  // Get current language for translations
  const currentLanguage = i18n.language || 'en';
  
  // Get configurable protection percentage and metadata from centralized config
  const protectionPercentage = getProtectionPlanPercentage();
  const refundOptionsMetadata = getRefundOptionsMetadata(currentLanguage);

  // Update local state when selectedOptions prop changes
  useEffect(() => {
    setRefundOptions(selectedOptions);
  }, [selectedOptions]);

  // Get conflicting options using centralized config
  const getConflictingOptions = (selectedOption) => {
    return CONFLICTING_OPTIONS[selectedOption] || [];
  };

  const handleOptionToggle = (optionValue) => {
    let newOptions;
    
    if (refundOptions.includes(optionValue)) {
      // Remove the option
      newOptions = refundOptions.filter(option => option !== optionValue);
    } else {
      // Add the option and remove conflicting ones
      const conflictingOptions = getConflictingOptions(optionValue);
      newOptions = refundOptions.filter(option => !conflictingOptions.includes(option));
      newOptions.push(optionValue);
    }
    
    setRefundOptions(newOptions);
    onOptionsChange(newOptions);
  };

  // Check if an option should be disabled
  const isOptionDisabled = (optionValue) => {
    for (const selectedOption of refundOptions) {
      const conflictingOptions = getConflictingOptions(selectedOption);
      if (conflictingOptions.includes(optionValue)) {
        return true;
      }
    }
    return false;
  };

  // Check for warnings
  const hasProtectionPlanWarning = () => {
    return refundOptions.includes('client_protection_plan') && refundOptions.includes('non_refundable');
  };

  return (
    <div id="refund-options" className={`space-y-4 ${className}`}>
      <div className="grid gap-3">
        {refundOptionsMetadata.map((option) => {
          const isDisabled = isOptionDisabled(option.value);
          const isSelected = refundOptions.includes(option.value);
          
          return (
            <label 
              key={option.value}
              className={`flex items-start gap-3 p-4 border rounded-xl transition-colors ${
                isDisabled && !isSelected
                  ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'border-primary bg-primary/5 cursor-pointer'
                  : 'border-gray-200 cursor-pointer hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled && !isSelected}
                onChange={() => handleOptionToggle(option.value)}
                className={`mt-1 h-4 w-4 border-gray-300 rounded focus:ring-primary focus:ring-2 ${
                  isDisabled && !isSelected 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'text-primary cursor-pointer'
                }`}
              />
              <div className="flex-1">
                <div className={`font-medium ${
                  isDisabled && !isSelected ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {option.label}
                </div>
                <div className={`text-sm mt-1 ${
                  isDisabled && !isSelected ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      
      {isRequired && refundOptions.length === 0 && (
        <div className="text-red-500 text-sm mb-4">
          {t("form.pleaseSelectOne", { ns: "refundPolicies" })}
        </div>
      )}
      
      {hasProtectionPlanWarning() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800">
                {t("form.pricingConsideration", { ns: "refundPolicies" })}
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                {t("form.protectionPlanWarning", { 
                  ns: "refundPolicies", 
                  percentage: protectionPercentage 
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
