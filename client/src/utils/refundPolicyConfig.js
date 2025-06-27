/**
 * Centralized Refund Policy Configuration
 * Single source of truth for all refund policy wording, rules, and metadata
 * Used by both frontend and backend to ensure consistency
 */

// Valid refund option keys - used for validation
export const VALID_REFUND_OPTIONS = [
  'flexible_14_day',
  'moderate_7_day', 
  'strict',
  'non_refundable',
  'reschedule_only',
  'client_protection_plan'
];

// Protection Plan Configuration - centralized percentage management
export const PROTECTION_PLAN_CONFIG = {
  // Get protection percentage from environment variable, default to 20%
  PROTECTION_PERCENTAGE: parseInt(import.meta.env.VITE_PROTECTION_PLAN_PERCENTAGE) || 20,
  // Calculate protection rate for calculations automatically from percentage
  get PROTECTION_RATE() {
    return this.PROTECTION_PERCENTAGE / 100;
  },
};

// Centralized refund policy metadata - single source of truth for all wording
export const REFUND_POLICY_METADATA = {
  'flexible_14_day': {
    value: 'flexible_14_day',
    label: 'Flexible 14-Day',
    shortLabel: 'Flexible',
    description: 'Full refund if canceled 14+ days before check-in',
    shortDescription: 'Full refund (14+ days notice)',
    detailedDescription: 'Get a full refund if you cancel your booking at least 14 days before your scheduled check-in time.',
    icon: '✅',
    type: 'flexible',
    refundRules: [
      { minHours: 336, refundPercent: 100 }, // 14 days
      { minHours: 0, refundPercent: 0 }
    ],
    adminDescription: 'Guests receive 100% refund for cancellations made 14+ days in advance'
  },
  'moderate_7_day': {
    value: 'moderate_7_day',
    label: 'Moderate 7-Day',
    shortLabel: 'Moderate',
    description: '50% refund if canceled 7+ days before check-in',
    shortDescription: '50% refund (7+ days notice)',
    detailedDescription: 'Get a 50% refund if you cancel your booking at least 7 days before your scheduled check-in time.',
    icon: '⚡',
    type: 'moderate',
    refundRules: [
      { minHours: 168, refundPercent: 50 }, // 7 days
      { minHours: 0, refundPercent: 0 }
    ],
    adminDescription: 'Guests receive 50% refund for cancellations made 7+ days in advance'
  },
  'strict': {
    value: 'strict',
    label: 'Strict',
    shortLabel: 'Strict',
    description: 'No refund if canceled less than 6 days before check-in',
    shortDescription: 'No refund (<6 days notice)',
    detailedDescription: 'No refund available if cancellation is made less than 6 days before check-in.',
    icon: '🔒',
    type: 'strict',
    refundRules: [
      { minHours: 144, refundPercent: 50 }, // 6 days for partial
      { minHours: 48, refundPercent: 25 }, // 2 days for minimal
      { minHours: 0, refundPercent: 0 }
    ],
    adminDescription: 'Limited refunds: 50% for 6+ days notice, 25% for 2+ days notice'
  },
  'non_refundable': {
    value: 'non_refundable',
    label: 'Non-refundable',
    shortLabel: 'Non-refundable',
    description: 'No refunds under any condition',
    shortDescription: 'No refunds allowed',
    detailedDescription: 'This booking is non-refundable. No refunds will be provided regardless of cancellation timing.',
    icon: '❌',
    type: 'strict',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ],
    adminDescription: 'No refunds allowed under any circumstances'
  },
  'reschedule_only': {
    value: 'reschedule_only',
    label: 'Reschedule',
    shortLabel: 'Reschedule',
    description: 'No refund, but reschedule allowed with 3+ days notice',
    shortDescription: 'Reschedule allowed (3+ days notice)',
    detailedDescription: 'No monetary refunds available, but you can reschedule your booking if you provide at least 3 days notice.',
    icon: '🔄',
    type: 'moderate',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ],
    rescheduleRules: [
      { minHours: 72, allowed: true }, // 3 days
      { minHours: 0, allowed: false }
    ],
    adminDescription: 'No refunds, but guests can reschedule with 3+ days notice'
  },
  'client_protection_plan': {
    value: 'client_protection_plan',
    label: 'Protection Plan Available',
    shortLabel: 'Protection Plan',
    description: `Add ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% fee for anytime cancellation protection`,
    shortDescription: `Protection plan available (+${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}%)`,
    detailedDescription: `For an additional ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% fee, you can cancel anytime and receive a full refund according to the base policy or better.`,
    icon: '🛡️',
    type: 'protection',
    adminDescription: `Guests can add ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% protection plan for enhanced cancellation coverage`
  }
};

// Mutual exclusivity rules - defines which options conflict with each other
export const CONFLICTING_OPTIONS = {
  'non_refundable': ['flexible_14_day', 'moderate_7_day', 'strict', 'reschedule_only', 'client_protection_plan'],
  'flexible_14_day': ['non_refundable', 'reschedule_only'],
  'moderate_7_day': ['non_refundable', 'reschedule_only'],
  'strict': ['non_refundable', 'reschedule_only'],
  'reschedule_only': ['non_refundable', 'flexible_14_day', 'moderate_7_day', 'strict'],
  'client_protection_plan': ['non_refundable'] // Protection plan can work with reschedule_only but not with non_refundable
};

// Human-readable policy summaries for different contexts
export const POLICY_SUMMARIES = {
  client: {
    'flexible_14_day': 'You can cancel up to 14 days before check-in for a full refund.',
    'moderate_7_day': 'You can cancel up to 7 days before check-in for a 50% refund.',
    'strict': 'Limited refund available only with significant advance notice.',
    'non_refundable': 'This booking cannot be refunded once confirmed.',
    'reschedule_only': 'You cannot get a refund, but you can reschedule with 3+ days notice.',
    'client_protection_plan': `Protection plan active - enhanced cancellation coverage for ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% fee.`
  },
  host: {
    'flexible_14_day': 'Guests receive full refunds for cancellations 14+ days in advance.',
    'moderate_7_day': 'Guests receive 50% refunds for cancellations 7+ days in advance.',
    'strict': 'Limited guest refunds - you retain most of the booking value.',
    'non_refundable': 'No refunds to guests - you receive full booking value.',
    'reschedule_only': 'No refunds, but guests may reschedule with advance notice.',
    'client_protection_plan': `Guests can purchase ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% protection plan for better cancellation terms.`
  },
  admin: {
    'flexible_14_day': 'Liberal refund policy - higher guest satisfaction, potential revenue loss.',
    'moderate_7_day': 'Balanced refund policy - moderate protection for both parties.',
    'strict': 'Conservative refund policy - protects host revenue, may reduce bookings.',
    'non_refundable': 'No refund policy - maximum host protection, lowest guest flexibility.',
    'reschedule_only': 'Reschedule-focused policy - retains bookings while allowing changes.',
    'client_protection_plan': `Optional protection upsell - generates ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% additional revenue.`
  }
};

/**
 * Get display data for refund options
 * @param {Array} refundOptions - Array of refund option strings from place
 * @returns {Array} - Array of display objects for the refund options
 */
export const getRefundPolicyDisplayData = (refundOptions = []) => {
  if (!Array.isArray(refundOptions) || refundOptions.length === 0) {
    return [];
  }

  return refundOptions
    .map(option => REFUND_POLICY_METADATA[option])
    .filter(Boolean); // Remove any undefined options
};

/**
 * Get human-readable policy summary for specific user type
 * @param {string} policyKey - Refund policy key
 * @param {string} userType - 'client', 'host', or 'admin'
 * @returns {string} - Human-readable summary
 */
export const getPolicySummary = (policyKey, userType = 'client') => {
  return POLICY_SUMMARIES[userType]?.[policyKey] || REFUND_POLICY_METADATA[policyKey]?.description || 'Policy information not available';
};

/**
 * Check if protection plan is available for a place
 * @param {Array} refundOptions - Array of refund option strings from place
 * @returns {boolean} - Whether protection plan is available
 */
export const isProtectionPlanAvailable = (refundOptions = []) => {
  return Array.isArray(refundOptions) && refundOptions.includes('client_protection_plan');
};

/**
 * Calculate protection plan fee
 * @param {number} totalBookingPrice - Total booking price (excluding service fees)
 * @param {number} protectionRate - Protection rate (defaults to configured rate)
 * @returns {number} - Protection plan fee amount
 */
export const calculateProtectionPlanFee = (totalBookingPrice, protectionRate = PROTECTION_PLAN_CONFIG.PROTECTION_RATE) => {
  if (!totalBookingPrice || totalBookingPrice <= 0) {
    return 0;
  }
  return Math.round(totalBookingPrice * protectionRate);
};

/**
 * Get protection plan percentage for display
 * @returns {number} - Protection percentage (e.g., 20 for 20%)
 */
export const getProtectionPlanPercentage = () => {
  return PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE;
};

/**
 * Get protection plan rate for calculations
 * @returns {number} - Protection rate (e.g., 0.2 for 20%)
 */
export const getProtectionPlanRate = () => {
  return PROTECTION_PLAN_CONFIG.PROTECTION_RATE;
};

/**
 * Get the primary refund policy (excluding protection plan)
 * @param {Array} refundOptions - Array of refund option strings from place
 * @returns {Object|null} - Primary refund policy metadata or null
 */
export const getPrimaryRefundPolicy = (refundOptions = []) => {
  if (!Array.isArray(refundOptions) || refundOptions.length === 0) {
    return null;
  }

  // Filter out protection plan to get actual refund policies
  const actualPolicies = refundOptions.filter(option => option !== 'client_protection_plan');
  
  if (actualPolicies.length === 0) {
    return null;
  }

  // Return the first policy (they should be mutually exclusive anyway)
  return REFUND_POLICY_METADATA[actualPolicies[0]] || null;
};

/**
 * Get refund policy display info for a specific policy
 * @param {string} policyKey - The refund policy key
 * @returns {Object} - Policy display information
 */
export const getRefundPolicyDisplayInfo = (policyKey) => {
  return REFUND_POLICY_METADATA[policyKey] || {
    label: 'Unknown Policy',
    description: 'Policy information not available',
    type: 'unknown'
  };
};

/**
 * Validate refund options for conflicts
 * @param {Array} refundOptions - Array of refund option strings
 * @returns {Object} - { isValid: boolean, conflicts?: Array }
 */
export const validateRefundOptionConflicts = (refundOptions = []) => {
  const conflicts = [];
  
  for (const option of refundOptions) {
    const conflictingOptions = CONFLICTING_OPTIONS[option] || [];
    
    for (const conflictingOption of conflictingOptions) {
      if (refundOptions.includes(conflictingOption)) {
        conflicts.push({
          option,
          conflictsWith: conflictingOption,
          message: `"${REFUND_POLICY_METADATA[option]?.label}" conflicts with "${REFUND_POLICY_METADATA[conflictingOption]?.label}"`
        });
      }
    }
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts
  };
};

// Export the metadata for backend compatibility
export const getRefundOptionsMetadata = () => {
  return Object.values(REFUND_POLICY_METADATA).map(policy => ({
    value: policy.value,
    label: policy.label,
    description: policy.description
  }));
};

// Backward compatibility exports
export const REFUND_OPTION_METADATA = REFUND_POLICY_METADATA;
