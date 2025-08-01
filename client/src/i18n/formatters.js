import i18n from "./config";

/**
 * Custom formatters for i18next
 * Uses the new formatter API (i18next >= 21.3.0)
 */

// Custom uppercase formatter
i18n.services.formatter.add('uppercase', (value, lng, options) => {
  return value.toUpperCase();
});

// Custom lowercase formatter
i18n.services.formatter.add('lowercase', (value, lng, options) => {
  return value.toLowerCase();
});

// Custom currency formatter with locale-specific currencies
i18n.services.formatter.add('currency', (value, lng, options) => {
  const locale = lng === "uz" ? "uz-UZ" : lng === "ru" ? "ru-RU" : "en-US";
  const currency = options.currency || (lng === "uz" ? "UZS" : lng === "ru" ? "RUB" : "USD");
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
});

// Custom percentage formatter
i18n.services.formatter.add('percentage', (value, lng, options) => {
  const locale = lng === 'uz' ? 'uz-UZ' : lng === 'ru' ? 'ru-RU' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options
  }).format(value / 100);
});

// Custom compact number formatter (e.g., 1.2K, 1.5M)
i18n.services.formatter.add('compact', (value, lng, options) => {
  const locale = lng === 'uz' ? 'uz-UZ' : lng === 'ru' ? 'ru-RU' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    ...options
  }).format(value);
});

// Custom ordinal formatter (1st, 2nd, 3rd, etc.)
i18n.services.formatter.add('ordinal', (value, lng, options) => {
  const locale = lng === 'uz' ? 'uz-UZ' : 'en-US';
  
  // Uzbek doesn't have built-in ordinal support, so we'll use a simple approach
  if (lng === 'uz') {
    return `${value}-chi`;
  }
  
  const pr = new Intl.PluralRules(locale, { type: 'ordinal' });
  const suffixes = new Map([
    ['one', 'st'],
    ['two', 'nd'],
    ['few', 'rd'],
    ['other', 'th'],
  ]);
  
  const rule = pr.select(value);
  const suffix = suffixes.get(rule);
  return `${value}${suffix}`;
});

// Custom distance formatter (for showing distances in km/m)
i18n.services.formatter.add('distance', (value, lng, options) => {
  const unit = options?.unit || 'km';
  const locale = lng === 'uz' ? 'uz-UZ' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: unit,
    unitDisplay: 'short',
    maximumFractionDigits: 1,
    ...options
  }).format(value);
});

// Custom duration formatter (for showing time durations)
i18n.services.formatter.add('duration', (value, lng, options) => {
  const unit = options?.unit || 'hour';
  const locale = lng === 'uz' ? 'uz-UZ' : 'en-US';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: unit,
      unitDisplay: 'long',
      ...options
    }).format(value);
  } catch (error) {
    // Fallback for unsupported units
    const unitMap = {
      'hour': lng === 'uz' ? 'soat' : 'hour',
      'minute': lng === 'uz' ? 'daqiqa' : 'minute',
      'day': lng === 'uz' ? 'kun' : 'day',
      'week': lng === 'uz' ? 'hafta' : 'week',
      'month': lng === 'uz' ? 'oy' : 'month',
      'year': lng === 'uz' ? 'yil' : 'year'
    };
    
    const unitText = unitMap[unit] || unit;
    return `${value} ${unitText}${value !== 1 && lng === 'en' ? 's' : ''}`;
  }
});

// Custom rating formatter (for showing star ratings)
i18n.services.formatter.add('rating', (value, lng, options) => {
  const stars = '★'.repeat(Math.floor(value)) + '☆'.repeat(5 - Math.floor(value));
  const locale = lng === 'uz' ? 'uz-UZ' : 'en-US';
  const formattedValue = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
  
  return `${stars} ${formattedValue}`;
});

// Custom phone number formatter
i18n.services.formatter.add('phone', (value, lng, options) => {
  // Simple phone formatting - in production you'd use a proper phone library
  const cleaned = value.toString().replace(/\D/g, '');
  
  if (cleaned.startsWith('998')) {
    // Uzbek phone number format: +998 XX XXX XX XX
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  } else if (cleaned.length === 10) {
    // US phone number format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return value;
});

export default i18n;
