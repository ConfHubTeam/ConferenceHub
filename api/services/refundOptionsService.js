/**
 * Refund Options Service
 * Handles validation and processing of refund options for places
 */

// Get protection plan configuration from environment
const PROTECTION_PLAN_PERCENTAGE = parseInt(process.env.PROTECTION_PLAN_PERCENTAGE) || 20;

const VALID_REFUND_OPTIONS = [
  'flexible_14_day',
  'moderate_7_day', 
  'strict',
  'non_refundable',
  'reschedule_only',
  'client_protection_plan'
];

// Define mutual exclusivity rules
const CONFLICTING_OPTIONS = {
  'non_refundable': ['flexible_14_day', 'moderate_7_day', 'reschedule_only', 'client_protection_plan'],
  'flexible_14_day': ['non_refundable', 'reschedule_only'],
  'moderate_7_day': ['non_refundable', 'reschedule_only'],
  'reschedule_only': ['flexible_14_day', 'moderate_7_day', 'strict', 'non_refundable'],
  'strict': ['reschedule_only'],
  'client_protection_plan': [] // Independent but can show warning with non_refundable
};

/**
 * Validates refund options array
 * @param {Array} refundOptions - Array of refund option strings
 * @returns {Object} - { isValid: boolean, error?: string }
 */
const validateRefundOptions = (refundOptions) => {
  // Check if refundOptions exists and is an array
  if (!refundOptions || !Array.isArray(refundOptions)) {
    return {
      isValid: false,
      error: "Refund options must be provided as an array"
    };
  }

  // Check if at least one option is selected
  if (refundOptions.length === 0) {
    return {
      isValid: false,
      error: "At least one refund option must be selected"
    };
  }

  // Validate each option
  for (const option of refundOptions) {
    if (!VALID_REFUND_OPTIONS.includes(option)) {
      return {
        isValid: false,
        error: `Invalid refund option: ${option}. Valid options are: ${VALID_REFUND_OPTIONS.join(', ')}`
      };
    }
  }

  // Check for conflicting options
  const conflictValidation = validateConflictingOptions(refundOptions);
  if (!conflictValidation.isValid) {
    return conflictValidation;
  }

  return { isValid: true };
};

/**
 * Check for conflicting refund options
 * @param {Array} refundOptions - Array of refund option strings
 * @returns {Object} - { isValid: boolean, error?: string }
 */
const validateConflictingOptions = (refundOptions) => {
  for (const option of refundOptions) {
    const conflictingOptions = CONFLICTING_OPTIONS[option] || [];
    
    for (const conflictingOption of conflictingOptions) {
      if (refundOptions.includes(conflictingOption)) {
        return {
          isValid: false,
          error: `Conflicting refund options: "${option}" and "${conflictingOption}" cannot be selected together`
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Processes and sanitizes refund options
 * @param {Array} refundOptions - Raw refund options from request
 * @returns {Array} - Processed and validated refund options
 */
const processRefundOptions = (refundOptions) => {
  if (!Array.isArray(refundOptions)) {
    return [];
  }

  // Remove duplicates and filter valid options
  const uniqueOptions = [...new Set(refundOptions)];
  return uniqueOptions.filter(option => VALID_REFUND_OPTIONS.includes(option));
};

/**
 * Gets all valid refund options with descriptions
 * @returns {Array} - Array of refund option objects with value and description
 */
const getRefundOptionsMetadata = () => {
  return [
    {
      value: 'flexible_14_day',
      label: 'Flexible 14-Day',
      description: 'Full refund if canceled 14+ days before'
    },
    {
      value: 'moderate_7_day',
      label: 'Moderate 7-Day',
      description: '50% refund if canceled 7+ days before'
    },
    {
      value: 'strict',
      label: 'Strict',
      description: 'No refund if canceled <6 days before'
    },
    {
      value: 'non_refundable',
      label: 'Non-refundable',
      description: 'No refunds under any condition'
    },
    {
      value: 'reschedule_only',
      label: 'Reschedule Only',
      description: 'No refund, but reschedule allowed if 3+ days notice'
    },
    {
      value: 'client_protection_plan',
      label: 'Enable Client Protection Plan',
      description: `Add ${PROTECTION_PLAN_PERCENTAGE}% paid option for anytime cancellation`
    }
  ];
};

module.exports = {
  validateRefundOptions,
  processRefundOptions,
  getRefundOptionsMetadata,
  VALID_REFUND_OPTIONS,
  CONFLICTING_OPTIONS
};
