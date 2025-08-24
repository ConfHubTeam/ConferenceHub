import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePriceFilter } from "../contexts/PriceFilterContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { formatCurrency, getCurrencySymbol, convertCurrency } from "../utils/currencyUtils";

/**
 * PriceFilterModal Component
 * A reusable modal for price range selection that can be used across the application
 * Supports preset price ranges and custom price input
 * Features mobile-first responsive design with desktop optimization
 * Uses currency from the global context (header selector)
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 */
export default function PriceFilterModal({ isOpen, onClose }) {
  const { t } = useTranslation("search");
  const {
    minPrice,
    maxPrice,
    updatePriceRange,
    clearPriceFilter,
    getFormattedPriceRange,
    hasActivePriceFilter
  } = usePriceFilter();

  const { selectedCurrency } = useCurrency();

  // Get router search params for URL updates
  const [searchParams, setSearchParams] = useRouterSearchParams();

  // Local state for modal
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [dynamicPresets, setDynamicPresets] = useState([]);
  const modalRef = useRef(null);

  // Base price presets in UZS (reference currency)
  const basePricePresets = [
    {
      id: "up-to-1mln",
      baseMax: 1000000, // 1 million UZS
      baseCurrency: "UZS"
    },
    {
      id: "1mln-3mln",
      baseMin: 1000000, // 1 million UZS
      baseMax: 3000000, // 3 million UZS
      baseCurrency: "UZS"
    },
    {
      id: "3mln-6mln",
      baseMin: 3000000, // 3 million UZS
      baseMax: 6000000, // 6 million UZS
      baseCurrency: "UZS"
    }
  ];

  // Generate dynamic presets based on selected currency
  const generateDynamicPresets = useCallback(async (currency) => {
    if (!currency) return [];

    try {
      const presets = [];
      
      for (const basePreset of basePricePresets) {
        let convertedMin = null;
        let convertedMax = null;
        let label = "";

        // Convert base values to selected currency
        if (basePreset.baseMin) {
          convertedMin = await convertCurrency(
            basePreset.baseMin, 
            basePreset.baseCurrency, 
            currency.charCode
          );
        }
        
        if (basePreset.baseMax) {
          convertedMax = await convertCurrency(
            basePreset.baseMax, 
            basePreset.baseCurrency, 
            currency.charCode
          );
        }

        // Round to user-friendly values and create labels
        if (currency.charCode === "USD") {
          if (convertedMin) convertedMin = Math.round(convertedMin / 10) * 10; // Round to nearest $10
          if (convertedMax) convertedMax = Math.round(convertedMax / 10) * 10; // Round to nearest $10
          
          if (basePreset.id === "up-to-1mln") {
            label = t("filters.modals.price.upToFormat", { amount: "$100" });
            convertedMin = null; // No minimum for "up to" filter
            convertedMax = 100; // Display value for better UX
          } else if (basePreset.id === "1mln-3mln") {
            label = `$100 – $300`;
            convertedMin = 100;
            convertedMax = 300;
          } else if (basePreset.id === "3mln-6mln") {
            label = `$300 – $600`;
            convertedMin = 300;
            convertedMax = 600;
          }
        } else if (currency.charCode === "RUB") {
          if (convertedMin) convertedMin = Math.round(convertedMin / 100) * 100; // Round to nearest 100 RUB
          if (convertedMax) convertedMax = Math.round(convertedMax / 100) * 100; // Round to nearest 100 RUB
          
          if (basePreset.id === "up-to-1mln") {
            label = t("filters.modals.price.upToFormat", { amount: "8,000 ₽" });
            convertedMin = null; // No minimum for "up to" filter
            convertedMax = 8000; // Display value for better UX
          } else if (basePreset.id === "1mln-3mln") {
            label = `8,000 – 23,000 ₽`;
            convertedMin = 8000;
            convertedMax = 23000;
          } else if (basePreset.id === "3mln-6mln") {
            label = `23,000 – 47,000 ₽`;
            convertedMin = 23000;
            convertedMax = 47000;
          }
        } else if (currency.charCode === "UZS") {
          // Keep original UZS values and use preset translation keys
          if (basePreset.id === "up-to-1mln") {
            label = t("filters.modals.price.presets.upTo1M");
          } else if (basePreset.id === "1mln-3mln") {
            label = t("filters.modals.price.presets.1M_3M");
          } else if (basePreset.id === "3mln-6mln") {
            label = t("filters.modals.price.presets.3M_5M");
          }
          convertedMin = basePreset.baseMin || null; // Use null if baseMin doesn't exist
          convertedMax = basePreset.baseMax;
        } else {
          // For other currencies, use generic formatting
          const symbol = getCurrencySymbol(currency);
          if (basePreset.id === "up-to-1mln") {
            label = t("filters.modals.price.upToFormat", { amount: `${formatCurrency(convertedMax, currency)} ${symbol}` });
          } else {
            label = `${formatCurrency(convertedMin, currency)} – ${formatCurrency(convertedMax, currency)} ${symbol}`;
          }
        }

        presets.push({
          id: basePreset.id,
          label,
          min: convertedMin, // Use display values for filtering (user-friendly rounded values)
          max: convertedMax,
          currency: currency.charCode
        });
      }

      // Add custom range option
      presets.push({
        id: "custom",
        label: t("filters.modals.price.customRange"),
        min: null,
        max: null,
        currency: null,
        isCustom: true
      });

      return presets;
    } catch (error) {
      console.error("Error generating dynamic presets:", error);
      // Fallback to basic presets
      return [
        {
          id: "custom",
          label: t("filters.modals.price.customRange"),
          min: null,
          max: null,
          currency: null,
          isCustom: true
        }
      ];
    }
  }, [t]);

  // Update dynamic presets when currency changes
  useEffect(() => {
    if (selectedCurrency) {
      generateDynamicPresets(selectedCurrency).then(setDynamicPresets);
    }
  }, [selectedCurrency, generateDynamicPresets]);

  // Handle outside click to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Reset temporary values when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempMinPrice(minPrice ? minPrice.toString() : "");
      setTempMaxPrice(maxPrice ? maxPrice.toString() : "");
      
      // Determine selected preset based on current filter values
      if (hasActivePriceFilter && dynamicPresets.length > 0) {
        const matchingPreset = dynamicPresets.find(preset => 
          !preset.isCustom &&
          preset.min === minPrice &&
          preset.max === maxPrice
        );
        
        if (matchingPreset) {
          setSelectedPreset(matchingPreset.id);
          setShowCustomRange(false);
        } else {
          setSelectedPreset("custom");
          setShowCustomRange(true);
        }
      } else {
        setSelectedPreset(null);
        setShowCustomRange(false);
      }
    }
  }, [isOpen, minPrice, maxPrice, hasActivePriceFilter, dynamicPresets]);

  // Handle preset selection
  const handlePresetSelect = useCallback(async (preset) => {
    setSelectedPreset(preset.id);
    
    if (preset.isCustom) {
      setShowCustomRange(true);
      return;
    }
    
    setShowCustomRange(false);
    
    // Use the preset values directly since they're already converted to current currency
    setTempMinPrice(preset.min ? preset.min.toString() : "");
    setTempMaxPrice(preset.max ? preset.max.toString() : "");
  }, []);

  // Handle input change with validation
  const handlePriceInput = (value, type) => {
    // Allow only numbers and decimals
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    
    if (type === "min") {
      setTempMinPrice(sanitizedValue);
    } else {
      setTempMaxPrice(sanitizedValue);
    }
    
    // If user is typing custom values, switch to custom preset
    if (sanitizedValue && selectedPreset !== "custom") {
      setSelectedPreset("custom");
      setShowCustomRange(true);
    }
  };

  // Handle apply button click
  const handleApply = () => {
    const min = tempMinPrice ? parseFloat(tempMinPrice) : null;
    const max = tempMaxPrice ? parseFloat(tempMaxPrice) : null;
    
    // Validate inputs
    if (min !== null && min < 0) {
      alert(t("filters.modals.price.validation.minNegative"));
      return;
    }
    
    if (max !== null && max < 0) {
      alert(t("filters.modals.price.validation.maxNegative"));
      return;
    }
    
    if (min !== null && max !== null && min > max) {
      alert(t("filters.modals.price.validation.minGreaterThanMax"));
      return;
    }
    
    // Update context state with the current currency
    updatePriceRange(min, max, selectedCurrency);
    
    // Update URL parameters
    updateUrlWithFilters(min, max, selectedCurrency);
    
    onClose();
  };

  // Handle clear button click
  const handleClear = () => {
    setTempMinPrice("");
    setTempMaxPrice("");
    setSelectedPreset(null);
    setShowCustomRange(false);
    clearPriceFilter();
    
    // Clear URL parameters
    updateUrlWithFilters(null, null, null);
    
    onClose();
  };

  // Update URL with filter parameters
  const updateUrlWithFilters = (min, max, currency) => {
    const newParams = new URLSearchParams();
    
    // Keep existing parameters except price-related ones
    for (const [key, value] of searchParams.entries()) {
      if (value && value !== "undefined" && value !== "" && 
          !["minPrice", "maxPrice", "priceCurrency", "price"].includes(key)) {
        newParams.set(key, value);
      }
    }
    
    // Add new price parameters if they exist
    if (min !== null && min !== undefined) {
      newParams.set("minPrice", min.toString());
    }
    
    if (max !== null && max !== undefined) {
      newParams.set("maxPrice", max.toString());
    }
    
    if (currency) {
      newParams.set("priceCurrency", currency.charCode);
    }
    
    setSearchParams(newParams, { replace: true });
  };

  // Format price for display in input placeholder
  const formatPlaceholder = (amount) => {
    if (!selectedCurrency || !amount) return "";
    return formatCurrency(amount, selectedCurrency);
  };

  // Only render when open
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999 }}>
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[95vh] flex flex-col overflow-hidden relative z-[99999]"
        style={{ zIndex: 999999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">{t("filters.modals.price.title")}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t("filters.modals.price.actions.close")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Price Presets */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {dynamicPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-3 sm:p-4 text-left border rounded-lg transition-all ${
                    selectedPreset === preset.id
                      ? "border-brand-purple bg-brand-purple/10 ring-2 ring-brand-purple/20"
                      : "border-gray-300 hover:border-brand-purple hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base">
                    {preset.label}
                  </div>
                  {!preset.isCustom && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {preset.currency} {formatPlaceholder(preset.max) || "No limit"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Price Range Inputs */}
          {showCustomRange && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Minimum Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("filters.modals.price.min")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMinPrice}
                      onChange={(e) => handlePriceInput(e.target.value, "min")}
                      placeholder={t("filters.modals.price.placeholder.min")}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    {selectedCurrency && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol(selectedCurrency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Maximum Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("filters.modals.price.max")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempMaxPrice}
                      onChange={(e) => handlePriceInput(e.target.value, "max")}
                      placeholder={t("filters.modals.price.placeholder.max")}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                    />
                    {selectedCurrency && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol(selectedCurrency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Range Display */}
              {(tempMinPrice || tempMaxPrice) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {t("filters.modals.price.range")}: {" "}
                    <span className="font-medium">
                      {tempMinPrice && tempMaxPrice
                        ? `${formatPlaceholder(parseFloat(tempMinPrice))} - ${formatPlaceholder(parseFloat(tempMaxPrice))}`
                        : tempMinPrice
                        ? `${formatPlaceholder(parseFloat(tempMinPrice))}+`
                        : t("filters.modals.price.upToFormat", { amount: formatPlaceholder(parseFloat(tempMaxPrice)) })
                      } {selectedCurrency && getCurrencySymbol(selectedCurrency)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Current Filter Display */}
          {hasActivePriceFilter && !showCustomRange && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                {t("filters.modals.price.current")}: <span className="font-medium">{getFormattedPriceRange()}</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button 
            onClick={handleClear}
            className="btn-ghost btn-size-md text-accent-highlight"
          >
            {t("filters.modals.price.actions.clear")}
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="btn-outline btn-size-md"
            >
              {t("filters.modals.price.actions.cancel")}
            </button>
            <button 
              onClick={handleApply}
              className="btn-primary btn-size-md"
            >
              {t("filters.modals.price.actions.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document root level
  return createPortal(modalContent, document.body);
}
