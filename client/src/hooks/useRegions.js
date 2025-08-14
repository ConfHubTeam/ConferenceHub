/**
 * React Hook for Region Management
 * Follows Single Responsibility Principle - only handles region state and operations
 * Integrates with existing i18n system
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createRegionService } from '../services/RegionService.js';

/**
 * Custom hook for region management
 * @returns {Object} Region state and operations
 */
export function useRegions() {
  const { i18n } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create region service with i18n integration (memoized to prevent recreations)
  const regionService = useMemo(() => createRegionService(i18n), [i18n]);

  // Get all regions (updates when language changes)
  const regions = useMemo(() => regionService.getAllRegions(), [regionService, i18n.language]);

  // Get filtered regions based on search term
  const filteredRegions = useMemo(() => {
    return regionService.searchRegions(searchTerm);
  }, [regionService, searchTerm, i18n.language]);

  // Get sorted regions
  const sortedRegions = useMemo(() => {
    return regionService.getRegionsSorted();
  }, [regionService, i18n.language]);

  // Get default region
  const defaultRegion = useMemo(() => {
    return regionService.getDefaultRegion();
  }, [regionService, i18n.language]);

  // Initialize with default region on mount
  useEffect(() => {
    if (!selectedRegion) {
      setSelectedRegion(defaultRegion);
    }
  }, [defaultRegion]); // Only run when defaultRegion changes

  // Update selected region display name when language changes
  useEffect(() => {
    if (selectedRegion) {
      const updatedRegion = regionService.getRegionById(selectedRegion.id);
      if (updatedRegion) {
        setSelectedRegion(updatedRegion);
      }
    }
  }, [i18n.language, regionService, selectedRegion?.id]);

  // Handlers
  const selectRegion = useCallback((regionId) => {
    if (regionId === null || regionId === '') {
      setSelectedRegion(null);
      return;
    }
    
    const region = regionService.getRegionById(regionId);
    setSelectedRegion(region);
  }, [regionService]);

  const selectRegionByObject = useCallback((region) => {
    setSelectedRegion(region);
  }, []);

  const resetToDefault = useCallback(() => {
    setSelectedRegion(defaultRegion);
  }, [defaultRegion]);

  const clearSelection = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Utility functions
  const getMapConfig = useCallback((zoomLevel = 'CITY') => {
    if (selectedRegion) {
      return regionService.getMapConfigForRegion(selectedRegion.id, zoomLevel);
    }
    return regionService.getDefaultMapConfig();
  }, [selectedRegion, regionService]);

  const findNearestRegion = useCallback((lat, lng) => {
    return regionService.findNearestRegion(lat, lng);
  }, [regionService]);

  const isWithinUzbekistan = useCallback((lat, lng) => {
    return regionService.isWithinUzbekistanBounds(lat, lng);
  }, [regionService]);

  return {
    // State
    regions,
    filteredRegions,
    sortedRegions,
    selectedRegion,
    defaultRegion,
    searchTerm,
    
    // Actions
    selectRegion,
    selectRegionByObject,
    resetToDefault,
    clearSelection,
    updateSearchTerm,
    clearSearch,
    
    // Utilities
    getMapConfig,
    findNearestRegion,
    isWithinUzbekistan,
    
    // Computed values
    hasSelection: selectedRegion !== null,
    isDefaultSelected: selectedRegion?.isDefault || false,
    hasSearchResults: filteredRegions.length > 0,
    
    // Service instance (for advanced use cases)
    regionService
  };
}

/**
 * Hook for simple region selection without search functionality
 * @returns {Object} Simplified region state and operations
 */
export function useRegionSelector() {
  const { 
    regions, 
    selectedRegion, 
    defaultRegion,
    selectRegion, 
    resetToDefault, 
    clearSelection,
    getMapConfig,
    hasSelection,
    isDefaultSelected
  } = useRegions();

  return {
    regions,
    selectedRegion,
    defaultRegion,
    selectRegion,
    resetToDefault,
    clearSelection,
    getMapConfig,
    hasSelection,
    isDefaultSelected
  };
}

/**
 * Hook for region search functionality
 * @returns {Object} Search-focused region operations
 */
export function useRegionSearch() {
  const {
    filteredRegions,
    searchTerm,
    updateSearchTerm,
    clearSearch,
    hasSearchResults,
    selectRegionByObject
  } = useRegions();

  return {
    filteredRegions,
    searchTerm,
    updateSearchTerm,
    clearSearch,
    hasSearchResults,
    selectRegion: selectRegionByObject
  };
}

// Export default hook
export default useRegions;
