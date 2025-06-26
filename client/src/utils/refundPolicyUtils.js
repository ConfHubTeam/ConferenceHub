/**
 * Refund Policy Utilities
 * Provides utilities for displaying and handling refund policies
 * Uses centralized configuration from refundPolicyConfig.js
 */

// Re-export everything from the centralized config for backward compatibility
export {
  PROTECTION_PLAN_CONFIG,
  REFUND_POLICY_METADATA,
  REFUND_OPTION_METADATA, // Backward compatibility alias
  VALID_REFUND_OPTIONS,
  CONFLICTING_OPTIONS,
  POLICY_SUMMARIES,
  getRefundPolicyDisplayData,
  getPolicySummary,
  isProtectionPlanAvailable,
  calculateProtectionPlanFee,
  getProtectionPlanPercentage,
  getProtectionPlanRate,
  getPrimaryRefundPolicy,
  getRefundPolicyDisplayInfo,
  validateRefundOptionConflicts,
  getRefundOptionsMetadata
} from './refundPolicyConfig.js';
