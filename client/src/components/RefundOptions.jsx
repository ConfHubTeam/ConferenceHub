import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
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
  
  // Get metadata from centralized config
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

    </div>
  );
}
