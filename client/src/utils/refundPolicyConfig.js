/**
 * Centralized Refund Policy Configuration with Translation Support
 * Single source of truth for all refund policy wording, rules, and metadata
 * Used by both frontend and backend to ensure consistency
 */

import { getTranslationData } from "../i18n/helpers/translationHelpers";

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

// Icons and visual metadata (language-independent)
const POLICY_VISUAL_METADATA = {
  'flexible_14_day': {
    icon: '✅',
    type: 'flexible',
    refundRules: [
      { minHours: 336, refundPercent: 100 }, // 14 days
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'moderate_7_day': {
    icon: '⚡',
    type: 'moderate',
    refundRules: [
      { minHours: 168, refundPercent: 50 }, // 7 days
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'strict': {
    icon: '🔒',
    type: 'strict',
    refundRules: [
      { minHours: 144, refundPercent: 50 }, // 6 days for partial
      { minHours: 48, refundPercent: 25 }, // 2 days for minimal
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'non_refundable': {
    icon: '❌',
    type: 'strict',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ]
  },
  'reschedule_only': {
    icon: '🔄',
    type: 'moderate',
    refundRules: [
      { minHours: 0, refundPercent: 0 }
    ],
    rescheduleRules: [
      { minHours: 72, allowed: true }, // 3 days
      { minHours: 0, allowed: false }
    ]
  },
  'client_protection_plan': {
    icon: '🛡️',
    type: 'protection'
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

/**
 * Get translated refund policy metadata
 * @param {string} language - Language code (en, ru, uz)
 * @returns {Object} - Translated policy metadata
 */
export const getTranslatedRefundPolicyMetadata = (language = 'en') => {
  const translationData = getTranslationData('refundPolicies', language);
  const policies = {};
  
  VALID_REFUND_OPTIONS.forEach(option => {
    const visual = POLICY_VISUAL_METADATA[option];
    const translated = translationData?.policies?.[option] || {};
    
    policies[option] = {
      value: option,
      label: translated.label || option,
      shortLabel: translated.shortLabel || translated.label || option,
      description: option === 'client_protection_plan' 
        ? translated.description?.replace('{{percentage}}', PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE) || `Add ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% fee for protection`
        : translated.description || 'Description not available',
      shortDescription: translated.shortDescription || translated.description || 'Description not available',
      detailedDescription: option === 'client_protection_plan'
        ? translated.detailedDescription?.replace('{{percentage}}', PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE) || `For an additional ${PROTECTION_PLAN_CONFIG.PROTECTION_PERCENTAGE}% fee, enhanced coverage`
        : translated.detailedDescription || translated.description || 'Description not available',
      ...visual
    };
  });
  
  return policies;
};

/**
 * Get display data for refund options with translations
 * @param {Array} refundOptions - Array of refund option strings from place
 * @param {string} language - Language code
 * @returns {Array} - Array of display objects for the refund options
 */
export const getRefundPolicyDisplayData = (refundOptions = [], language = 'en') => {
  if (!Array.isArray(refundOptions) || refundOptions.length === 0) {
    return [];
  }

  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  
  return refundOptions
    .map(option => translatedMetadata[option])
    .filter(Boolean); // Remove any undefined options
};

/**
 * Get human-readable policy summary for specific user type
 * @param {string} policyKey - Refund policy key
 * @param {string} userType - 'client', 'host', or 'admin' (currently returns description)
 * @param {string} language - Language code
 * @returns {string} - Human-readable summary
 */
export const getPolicySummary = (policyKey, userType = 'client', language = 'en') => {
  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  return translatedMetadata[policyKey]?.description || 'Policy information not available';
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
 * @param {string} language - Language code
 * @returns {Object|null} - Primary refund policy metadata or null
 */
export const getPrimaryRefundPolicy = (refundOptions = [], language = 'en') => {
  if (!Array.isArray(refundOptions) || refundOptions.length === 0) {
    return null;
  }

  // Filter out protection plan to get actual refund policies
  const actualPolicies = refundOptions.filter(option => option !== 'client_protection_plan');
  
  if (actualPolicies.length === 0) {
    return null;
  }

  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  // Return the first policy (they should be mutually exclusive anyway)
  return translatedMetadata[actualPolicies[0]] || null;
};

/**
 * Get refund policy display info for a specific policy
 * @param {string} policyKey - The refund policy key
 * @param {string} language - Language code
 * @returns {Object} - Policy display information
 */
export const getRefundPolicyDisplayInfo = (policyKey, language = 'en') => {
  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  return translatedMetadata[policyKey] || {
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
        const translatedMetadata = getTranslatedRefundPolicyMetadata();
        conflicts.push({
          option,
          conflictsWith: conflictingOption,
          message: `"${translatedMetadata[option]?.label}" conflicts with "${translatedMetadata[conflictingOption]?.label}"`
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
export const getRefundOptionsMetadata = (language = 'en') => {
  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  return Object.values(translatedMetadata).map(policy => ({
    value: policy.value,
    label: policy.label,
    description: policy.description
  }));
};

// Backward compatibility exports
export const REFUND_OPTION_METADATA = getTranslatedRefundPolicyMetadata;
