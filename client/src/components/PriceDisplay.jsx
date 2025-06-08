import { formatPriceWithSymbol } from "../utils/currencyUtils";

/**
 * PriceDisplay Component
 * Displays a price with the correct currency symbol based on the currency object
 * 
 * @param {Object} props Component props
 * @param {number} props.price The numeric price value
 * @param {Object} props.currency The currency object with charCode property
 * @param {string} props.suffix Optional suffix text (e.g. "/ hour")
 * @param {boolean} props.bold Whether to display the price in bold (default: true)
 * @param {string} props.className Additional CSS classes
 * @param {string} props.priceClassName CSS class for price element
 * @param {string} props.suffixClassName CSS class for suffix element
 */
export default function PriceDisplay({
  price,
  currency,
  suffix = null,
  bold = true,
  className = "",
  priceClassName = "",
  suffixClassName = ""
}) {
  // Default display if no currency is provided
  if (!currency) {
    const defaultFormatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      style: 'currency',
      currency: 'USD'
    }).format(price);
    
    return (
      <span className={`${className}`}>
        <span className={`${bold ? "font-bold" : ""} ${priceClassName}`}>
          {defaultFormatted}
        </span>
        {suffix && <span className={`text-gray-500 font-normal text-xs ${suffixClassName}`}>{suffix}</span>}
      </span>
    );
  }
  
  // Format with the correct currency
  const formattedPrice = formatPriceWithSymbol(price, currency);

  return (
    <span className={`${className}`}>
      <span className={`${bold ? "font-bold" : ""} ${priceClassName}`}>
        {formattedPrice}
      </span>
      {suffix && <span className={`text-gray-500 font-normal text-xs ${suffixClassName}`}>{suffix}</span>}
    </span>
  );
}
