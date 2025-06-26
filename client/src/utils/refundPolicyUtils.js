/**
 * Refund Policy Utilities
 * Provides utilities for displaying and handling refund policies
 */

// Protection Plan Configuration
export const PROTECTION_PLAN_CONFIG = {
  // Get protection percentage from environment variable, default to 20%
  PROTECTION_PERCENTAGE: parseInt(import.meta.env.VITE_PROTECTION_PLAN_PERCENTAGE) || 20,
  // Calculate protection rate for calculations automatically from percentage
  get PROTECTION_RATE() {
    return this.PROTECTION_PERCENTAGE / 100;
  },
};

// Map refund option values to user-friendly display data
export const REFUND_OPTION_METADATA = {
  'flexible_14_day': {
    label: 'Flexible 14-Day',
    description: 'Full refund if canceled 14+ days before',
    shortDescription: 'Full refund (14+ days notice)',
    icon: '✅',
    type: 'flexible'
  },
  'moderate_7_day': {
    label: 'Moderate 7-Day', 
    description: '50% refund if canceled 7+ days before',
    shortDescription: '50% refund (7+ days notice)',
    icon: '⚡',
    type: 'moderate'
  },
  'strict': {
    label: 'Strict',
    description: 'No refund if canceled less than 6 days before',
    shortDescription: 'No refund (<6 days notice)',
    icon: '🔒',
    type: 'strict'
  },
  'non_refundable': {
    label: 'Non-refundable',
    description: 'No refunds under any condition',
    shortDescription: 'No refunds allowed',
    icon: '❌',
    type: 'strict'
  },
  'reschedule_only': {
    label: 'Reschedule Only',
    description: 'No refund, but reschedule allowed if 3+ days notice',
    shortDescription: 'Reschedule allowed (3+ days notice)',
    icon: '🔄',
    type: 'moderate'
  },
  'client_protection_plan': {
    label: 'Protection Plan Available',
    description: `Add ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% paid option for anytime cancellation`,
    shortDescription: `Protection plan available (+${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}%)`,
    icon: '🛡️',
    type: 'protection'
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
    .map(option => REFUND_OPTION_METADATA[option])
    .filter(Boolean); // Remove any undefined options
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
  return REFUND_OPTION_METADATA[actualPolicies[0]] || null;
};
