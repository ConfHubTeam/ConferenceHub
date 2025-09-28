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
  'reschedule_only'
];



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

};

// Mutual exclusivity rules - defines which options conflict with each other
export const CONFLICTING_OPTIONS = {
  'non_refundable': ['flexible_14_day', 'moderate_7_day', 'strict', 'reschedule_only'],
  'flexible_14_day': ['non_refundable', 'reschedule_only'],
  'moderate_7_day': ['non_refundable', 'reschedule_only'],
  'strict': ['non_refundable', 'reschedule_only'],
  'reschedule_only': ['non_refundable', 'flexible_14_day', 'moderate_7_day', 'strict']
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
      description: translated.description || 'Description not available',
      shortDescription: translated.shortDescription || translated.description || 'Description not available',
      detailedDescription: translated.detailedDescription || translated.description || 'Description not available',
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
 * Get the primary refund policy
 * @param {Array} refundOptions - Array of refund option strings from place
 * @param {string} language - Language code
 * @returns {Object|null} - Primary refund policy metadata or null
 */
export const getPrimaryRefundPolicy = (refundOptions = [], language = 'en') => {
  if (!Array.isArray(refundOptions) || refundOptions.length === 0) {
    return null;
  }

  const translatedMetadata = getTranslatedRefundPolicyMetadata(language);
  // Return the first policy (they should be mutually exclusive anyway)
  return translatedMetadata[refundOptions[0]] || null;
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
