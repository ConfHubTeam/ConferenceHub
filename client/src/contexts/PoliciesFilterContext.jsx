import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { VALID_REFUND_OPTIONS, getTranslatedRefundPolicyMetadata, getPrimaryRefundPolicy } from "../utils/refundPolicyConfig";

// Context for managing policies filter state
const PoliciesFilterContext = createContext();

// Hook to use the policies filter context
export const usePoliciesFilter = () => {
  const context = useContext(PoliciesFilterContext);
  if (!context) {
    throw new Error("usePoliciesFilter must be used within a PoliciesFilterProvider");
  }
  return context;
};

// Provider component following Single Responsibility Principle
export const PoliciesFilterProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  
  // State management - Single source of truth for policy filter state
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [showAllPolicies, setShowAllPolicies] = useState(false);

  // Get translated metadata based on current language
  const currentLanguage = i18n.language || 'en';
  const translatedPolicyMetadata = useMemo(() => {
    return getTranslatedRefundPolicyMetadata(currentLanguage);
  }, [currentLanguage]);

  // Action handlers following DRY principle - reusable and composable
  const addPolicy = useCallback((policyKey) => {
    if (!VALID_REFUND_OPTIONS.includes(policyKey)) {
      console.warn(`Invalid policy key: ${policyKey}`);
      return;
    }
    
    setSelectedPolicies(prev => {
      if (prev.includes(policyKey)) {
        return prev; // No change if already selected
      }
      return [...prev, policyKey];
    });
  }, []);

  const removePolicy = useCallback((policyKey) => {
    setSelectedPolicies(prev => prev.filter(policy => policy !== policyKey));
  }, []);

  const togglePolicy = useCallback((policyKey) => {
    if (!VALID_REFUND_OPTIONS.includes(policyKey)) {
      console.warn(`Invalid policy key: ${policyKey}`);
      return;
    }
    
    setSelectedPolicies(prev => {
      if (prev.includes(policyKey)) {
        return prev.filter(policy => policy !== policyKey);
      }
      return [...prev, policyKey];
    });
  }, []);

  const clearAllPolicies = useCallback(() => {
    setSelectedPolicies([]);
  }, []);

  // Utility functions following Interface Segregation Principle
  const isPolicySelected = useCallback((policyKey) => {
    return selectedPolicies.includes(policyKey);
  }, [selectedPolicies]);

  // Get policies with their display metadata - memoized for performance
  const relevantPoliciesWithLabels = useMemo(() => {
    return VALID_REFUND_OPTIONS.map(policyKey => ({
      key: policyKey,
      ...translatedPolicyMetadata[policyKey],
      label: t(`search:filters.modals.policy.policies.${policyKey}`) || translatedPolicyMetadata[policyKey]?.label || policyKey,
      description: t(`search:filters.modals.policy.descriptions.${policyKey}`) || translatedPolicyMetadata[policyKey]?.description || '',
      detailedDescription: t(`search:filters.modals.policy.descriptions.${policyKey}`) || translatedPolicyMetadata[policyKey]?.detailedDescription || translatedPolicyMetadata[policyKey]?.description || ''
    }));
  }, [t, translatedPolicyMetadata]);

  // Most commonly used policies for default display
  const popularPolicies = useMemo(() => [
    'flexible_14_day',
    'moderate_7_day', 
    'strict'
  ], []);

  // Filter function for places based on selected policies
  const filterPlacesByPolicies = useCallback((places) => {
    if (selectedPolicies.length === 0) {
      return places;
    }

    return places.filter(place => {
      // Get place's refund options
      const placeRefundOptions = place.refundOptions || [];
      
      if (placeRefundOptions.length === 0) {
        return false; // Exclude places without any refund policy
      }

      // Check if place has ALL of the selected policies
      return selectedPolicies.every(selectedPolicy => {
        return placeRefundOptions.includes(selectedPolicy);
      });
    });
  }, [selectedPolicies]);

  // Context value following Interface Segregation Principle
  const contextValue = useMemo(() => ({
    // State
    selectedPolicies,
    showAllPolicies,
    
    // Actions
    addPolicy,
    removePolicy,
    togglePolicy,
    clearAllPolicies,
    setShowAllPolicies,
    
    // Utilities
    isPolicySelected,
    filterPlacesByPolicies,
    
    // Data
    relevantPoliciesWithLabels,
    popularPolicies,
    allValidPolicies: VALID_REFUND_OPTIONS,
    policyMetadata: translatedPolicyMetadata,
    
    // Computed values
    hasSelectedPolicies: selectedPolicies.length > 0,
    selectedPoliciesCount: selectedPolicies.length
  }), [
    selectedPolicies,
    showAllPolicies,
    addPolicy,
    removePolicy,
    togglePolicy,
    clearAllPolicies,
    isPolicySelected,
    filterPlacesByPolicies,
    relevantPoliciesWithLabels,
    popularPolicies,
    translatedPolicyMetadata
  ]);

  return (
    <PoliciesFilterContext.Provider value={contextValue}>
      {children}
    </PoliciesFilterContext.Provider>
  );
};

export default PoliciesFilterContext;
