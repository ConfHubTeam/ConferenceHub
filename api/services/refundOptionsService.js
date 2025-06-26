/**
 * Refund Options Service
 * Handles validation and processing of refund options for places
 * Uses centralized configuration for consistency with frontend
 */

// Get protection plan configuration from environment
const PROTECTION_PLAN_PERCENTAGE = parseInt(process.env.PROTECTION_PLAN_PERCENTAGE) || 20;

// Valid refund options - must match frontend configuration
const VALID_REFUND_OPTIONS = [
  'flexible_14_day',
  'moderate_7_day', 
  'strict',
  'non_refundable',
  'reschedule_only',
  'client_protection_plan'
];

// Define mutual exclusivity rules - must match frontend configuration
const CONFLICTING_OPTIONS = {
  'non_refundable': ['flexible_14_day', 'moderate_7_day', 'strict', 'reschedule_only', 'client_protection_plan'],
  'flexible_14_day': ['non_refundable', 'reschedule_only'],
  'moderate_7_day': ['non_refundable', 'reschedule_only'],
  'strict': ['non_refundable', 'reschedule_only'],
  'reschedule_only': ['non_refundable', 'flexible_14_day', 'moderate_7_day', 'strict'],
  'client_protection_plan': ['non_refundable'] // Protection plan can work with reschedule_only but not with non_refundable
};

// Centralized refund policy metadata for backend use
const REFUND_POLICY_METADATA = {
  'flexible_14_day': {
    value: 'flexible_14_day',
    displayName: 'Flexible 14-Day',
    description: 'Full refund if canceled 14+ days before check-in',
    refundRules: [
      { minHours: 336, refundPercent: 100 }, // 14 days
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'moderate_7_day': {
    value: 'moderate_7_day',
    displayName: 'Moderate 7-Day',
    description: '50% refund if canceled 7+ days before check-in',
    refundRules: [
      { minHours: 168, refundPercent: 50 }, // 7 days
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'strict': {
    value: 'strict',
    displayName: 'Strict',
    description: 'Limited refund with significant advance notice',
    refundRules: [
      { minHours: 144, refundPercent: 50 }, // 6 days for partial
      { minHours: 48, refundPercent: 25 }, // 2 days for minimal
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'non_refundable': {
    value: 'non_refundable',
    displayName: 'Non-refundable',
    description: 'No refunds under any condition',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'reschedule_only': {
    value: 'reschedule_only',
    displayName: 'Reschedule',
    description: 'No refund, but reschedule allowed with 3+ days notice',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ],
    rescheduleRules: [
      { minHours: 72, allowed: true }, // 3 days
      { minHours: 0, allowed: false }
    ]
  },
  'client_protection_plan': {
    value: 'client_protection_plan',
    displayName: 'Protection Plan Available',
    description: `Add ${PROTECTION_PLAN_PERCENTAGE}% fee for enhanced cancellation coverage`
  }
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
 * Gets all valid refund options with descriptions for API responses
 * @returns {Array} - Array of refund option objects with value, label and description
 */
const getRefundOptionsMetadata = () => {
  return Object.values(REFUND_POLICY_METADATA).map(policy => ({
    value: policy.value,
    label: policy.displayName,
    description: policy.description
  }));
};

/**
 * Get refund policy display info for a specific policy
 * @param {string} policyKey - The refund policy key
 * @returns {Object} - Policy display information
 */
const getRefundPolicyDisplayInfo = (policyKey) => {
  return REFUND_POLICY_METADATA[policyKey] || {
    displayName: 'Unknown Policy',
    description: 'Policy information not available'
  };
};

module.exports = {
  validateRefundOptions,
  processRefundOptions,
  getRefundOptionsMetadata,
  getRefundPolicyDisplayInfo,
  VALID_REFUND_OPTIONS,
  CONFLICTING_OPTIONS,
  REFUND_POLICY_METADATA
};
