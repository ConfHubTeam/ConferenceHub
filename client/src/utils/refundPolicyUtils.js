/**
 * Refund Policy Utilities
 * Provides utilities for displaying and handling refund policies
 * Uses centralized configuration from refundPolicyConfig.js
 */

// Re-export everything from the centralized config for backward compatibility
export {
  PROTECTION_PLAN_CONFIG,
  VALID_REFUND_OPTIONS,
  CONFLICTING_OPTIONS,
  getTranslatedRefundPolicyMetadata,
  getRefundPolicyDisplayData,
  getRefundPolicyDisplayInfo,
  getPolicySummary,
  isProtectionPlanAvailable,
  calculateProtectionPlanFee,
  getProtectionPlanPercentage,
  getProtectionPlanRate,
  getPrimaryRefundPolicy,
  validateRefundOptionConflicts,
  getRefundOptionsMetadata
} from './refundPolicyConfig.js';
