import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyUtils";
import { formatHourTo12, formatHourLocalized } from "../utils/TimeUtils";

/**
 * Custom hook for formatting filter values with translation support
 * Follows Single Responsibility Principle - only handles filter formatting
 * Follows DRY Principle - centralized formatting logic used across components
 * Follows Interface Segregation - provides specific formatting methods
 * 
 * @returns {Object} Object containing all formatting functions
 */
export const useFilterFormatting = () => {
  const { t, i18n } = useTranslation("search");

  // Get appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'uz': return uz;
      default: return enUS;
    }
  };

  /**
   * Formats selected dates and times for display
   * @param {Array} selectedDates - Array of selected date objects
   * @param {string} startTime - Start time in HH:mm format
   * @param {string} endTime - End time in HH:mm format
   * @returns {string} Formatted date/time string
   */
  const formatDateTime = (selectedDates, startTime, endTime) => {
    if (!selectedDates || selectedDates.length === 0) return "";
    
    if (selectedDates.length === 1) {
      const formattedDate = format(selectedDates[0], "MMM d", { locale: getDateLocale() });
      // Include time information if available
      if (startTime && endTime) {
        return `${formattedDate}, ${formatHourLocalized(startTime, i18n.language)}-${formatHourLocalized(endTime, i18n.language)}`;
      }
      return formattedDate;
    }
    
    return t("filters.buttons.multiple_dates", { count: selectedDates.length });
  };

  /**
   * Formats price range for display with proper currency formatting
   * @param {number|null} minPrice - Minimum price value
   * @param {number|null} maxPrice - Maximum price value
   * @param {Object} currency - Currency object with charCode and symbol
   * @returns {string} Formatted price range string
   */
  const formatPriceRange = (minPrice, maxPrice, currency) => {
    if (!currency) return "";
    
    const symbol = getCurrencySymbol(currency);
    const hasMin = minPrice !== null && minPrice !== undefined && minPrice !== "";
    const hasMax = maxPrice !== null && maxPrice !== undefined && maxPrice !== "";

    if (!hasMin && !hasMax) return "";

    if (hasMin && hasMax) {
      const formattedMin = formatCurrency(minPrice, currency);
      const formattedMax = formatCurrency(maxPrice, currency);
      
      if (currency.charCode === "USD") {
        return `${symbol}${formattedMin} - ${symbol}${formattedMax}`;
      } else {
        return `${formattedMin} - ${formattedMax} ${symbol}`;
      }
    } else if (hasMin) {
      const formattedMin = formatCurrency(minPrice, currency);
      
      if (currency.charCode === "USD") {
        return `${symbol}${formattedMin}+`;
      } else {
        return `${formattedMin}+ ${symbol}`;
      }
    } else if (hasMax) {
      const formattedMax = formatCurrency(maxPrice, currency);
      
      if (currency.charCode === "USD") {
        return `${t("filters.buttons.up_to")} ${symbol}${formattedMax}`;
      } else {
        return `${t("filters.buttons.up_to")} ${formattedMax} ${symbol}`;
      }
    }

    return "";
  };

  /**
   * Formats attendees range for display with translation support
   * @param {number|null} minAttendees - Minimum attendees value
   * @param {number|null} maxAttendees - Maximum attendees value
   * @param {string|null} rangeId - Predefined range ID
   * @returns {string} Formatted attendees range string
   */
  const formatAttendeesRange = (minAttendees, maxAttendees, rangeId) => {
    const hasMin = minAttendees !== null && minAttendees !== undefined;
    const hasMax = maxAttendees !== null && maxAttendees !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (rangeId && rangeId !== "custom") {
      // Convert hyphen to underscore for translation keys
      const translationKey = rangeId.replace(/-/g, "_").replace(/\+/g, "plus");
      return t(`filters.modals.attendees.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.attendees_range", { min: minAttendees, max: maxAttendees });
    } else if (hasMin) {
      return t("filters.buttons.attendees_min", { min: minAttendees });
    } else if (hasMax) {
      return t("filters.buttons.attendees_max", { max: maxAttendees });
    }

    return "";
  };

  /**
   * Formats size range for display with translation support
   * @param {number|null} minSize - Minimum size value in square meters
   * @param {number|null} maxSize - Maximum size value in square meters
   * @param {string|null} rangeId - Predefined range ID
   * @returns {string} Formatted size range string
   */
  const formatSizeRange = (minSize, maxSize, rangeId) => {
    const hasMin = minSize !== null && minSize !== undefined;
    const hasMax = maxSize !== null && maxSize !== undefined;

    if (!hasMin && !hasMax) return "";

    // Check for predefined ranges with translation keys
    if (rangeId && rangeId !== "custom") {
      // Convert "extra-large" to "extraLarge" for translation keys
      const translationKey = rangeId === "extra-large" ? "extraLarge" : rangeId;
      return t(`filters.modals.size.presets.${translationKey}`);
    }

    // Custom formatting with translations
    if (hasMin && hasMax) {
      return t("filters.buttons.size_range", { min: minSize, max: maxSize });
    } else if (hasMin) {
      return t("filters.buttons.size_min", { min: minSize });
    } else if (hasMax) {
      return t("filters.buttons.size_max", { max: maxSize });
    }

    return "";
  };

  /**
   * Formats perks selection for display
   * @param {boolean} hasSelectedPerks - Whether any perks are selected
   * @param {number} selectedPerksCount - Number of selected perks
   * @returns {string} Formatted perks string
   */
  const formatPerks = (hasSelectedPerks, selectedPerksCount) => {
    if (!hasSelectedPerks) return "";
    return t("filters.buttons.perks_with_count", { count: selectedPerksCount });
  };

  /**
   * Formats policies selection for display
   * @param {boolean} hasSelectedPolicies - Whether any policies are selected
   * @param {number} selectedPoliciesCount - Number of selected policies
   * @returns {string} Formatted policies string
   */
  const formatPolicies = (hasSelectedPolicies, selectedPoliciesCount) => {
    if (!hasSelectedPolicies) return "";
    return t("filters.buttons.policies_with_count", { count: selectedPoliciesCount });
  };

  // Return all formatting functions following Interface Segregation Principle
  return {
    formatDateTime,
    formatPriceRange,
    formatAttendeesRange,
    formatSizeRange,
    formatPerks,
    formatPolicies
  };
};
