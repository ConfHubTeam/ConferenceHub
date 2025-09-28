/**
 * Translation helper functions for dynamic content loading
 */
import i18n from '../config';

/**
 * Get translation data from a specific namespace
 * @param {string} namespace - Translation namespace (e.g., 'refundPolicies')
 * @param {string} language - Language code (en, ru, uz)
 * @returns {Object|null} - Translation data or null if not found
 */
export const getTranslationData = (namespace, language = 'en') => {
  try {
    // Try to get from i18n resources if available
    if (i18n && i18n.hasResourceBundle && i18n.hasResourceBundle(language, namespace)) {
      return i18n.getResourceBundle(language, namespace);
    }
    
    // Fallback to hardcoded data for development/fallback
    const fallbackData = {
      en: {
        refundPolicies: {
          title: "Cancellation & Refund Policy",

          importantNotes: {
            title: "Important Notes",
            timezone: "Cancellation policies apply to the booking start time in Uzbekistan timezone",
            processingTime: "Refunds are processed within 3-5 business days",
            serviceFees: "Service fees are non-refundable unless specified otherwise",

          },
          policies: {
            flexible_14_day: {
              label: "Flexible 14-Day",
              shortLabel: "Flexible",
              description: "Full refund if canceled 14+ days before check-in",
              shortDescription: "Full refund (14+ days notice)",
              detailedDescription: "Get a full refund if you cancel your booking at least 14 days before your scheduled check-in time."
            },
            moderate_7_day: {
              label: "Moderate 7-Day",
              shortLabel: "Moderate", 
              description: "50% refund if canceled 7+ days before check-in",
              shortDescription: "50% refund (7+ days notice)",
              detailedDescription: "Get a 50% refund if you cancel your booking at least 7 days before your scheduled check-in time."
            },
            strict: {
              label: "Strict",
              shortLabel: "Strict",
              description: "No refund if canceled less than 6 days before check-in",
              shortDescription: "No refund (<6 days notice)",
              detailedDescription: "No refund available if cancellation is made less than 6 days before check-in."
            },
            non_refundable: {
              label: "Non-refundable",
              shortLabel: "Non-refundable",
              description: "No refunds under any condition",
              shortDescription: "No refunds allowed",
              detailedDescription: "This booking is non-refundable. No refunds will be provided regardless of cancellation timing."
            },
            reschedule_only: {
              label: "Reschedule",
              shortLabel: "Reschedule",
              description: "No refund, but reschedule allowed with 3+ days notice",
              shortDescription: "Reschedule allowed (3+ days notice)",
              detailedDescription: "No monetary refunds available, but you can reschedule your booking if you provide at least 3 days notice."
            },

          }
        }
      }
    };
    
    return fallbackData[language]?.[namespace] || null;
  } catch (error) {
    console.warn(`Failed to load translation data for ${namespace} in ${language}:`, error);
    return null;
  }
};
