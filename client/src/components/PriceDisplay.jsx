import { formatPriceWithSymbol } from "../utils/currencyUtils";
import useCurrencyConversion from "../hooks/useCurrencyConversion";
import { useCurrency } from "../contexts/CurrencyContext";

/**
 * PriceDisplay Component
 * Displays a price with the correct currency symbol based on the selected global currency
 * Automatically handles currency conversion
 * 
 * @param {Object} props Component props
 * @param {number} props.price The numeric price value
 * @param {Object} props.currency The original currency object of the price
 * @param {string} props.suffix Optional suffix text (e.g. "/ hour")
 * @param {boolean} props.bold Whether to display the price in bold (default: true)
 * @param {string} props.className Additional CSS classes
 * @param {string} props.priceClassName CSS class for price element
 * @param {string} props.suffixClassName CSS class for suffix element
 * @param {boolean} props.showOriginalPrice Whether to show original price on hover (default: false)
 * @param {boolean} props.disableConversion If true, always shows the original price without conversion
 */
export default function PriceDisplay({
  price,
  currency,
  suffix = null,
  bold = true,
  className = "",
  priceClassName = "",
  suffixClassName = "",
  showOriginalPrice = false,
  disableConversion = false
}) {
  const { selectedCurrency } = useCurrency();
  
  // Get converted price if conversion is enabled
  const { 
    convertedAmount, 
    isLoading, 
    originalAmount,
    originalCurrency
  } = !disableConversion 
    ? useCurrencyConversion(price, currency) 
    : { convertedAmount: price, isLoading: false, originalAmount: price, originalCurrency: currency };
  
  // Use the actual price to display
  const displayPrice = disableConversion ? price : convertedAmount;
  const displayCurrency = disableConversion ? currency : selectedCurrency;
  
  // Default display if no currency is provided
  if (!displayCurrency) {
    const defaultFormatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      style: 'currency',
      currency: 'USD'
    }).format(displayPrice);
    
    return (
      <span className={`${className}`}>
        <span className={`${bold ? "font-bold" : ""} ${priceClassName}`}>
          {isLoading ? "..." : defaultFormatted}
        </span>
        {suffix && <span className={`text-gray-500 font-normal text-xs ${suffixClassName}`}>{suffix}</span>}
      </span>
    );
  }
  
  // Format with the correct currency
  const formattedPrice = formatPriceWithSymbol(displayPrice, displayCurrency);

  return (
    <span className={`${className}`}>
      {isLoading ? (
        <span className={`${bold ? "font-bold" : ""} ${priceClassName} animate-pulse`}>
          Loading...
        </span>
      ) : (
        <span 
          className={`${bold ? "font-bold" : ""} ${priceClassName}`}
          title={showOriginalPrice && !disableConversion && originalCurrency?.charCode !== selectedCurrency?.charCode
            ? `Original: ${formatPriceWithSymbol(originalAmount, originalCurrency)}`
            : undefined}
        >
          {formattedPrice}
        </span>
      )}
      {suffix && <span className={`text-gray-500 font-normal text-xs ${suffixClassName}`}>{suffix}</span>}
    </span>
  );
}
