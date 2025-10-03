import { useTranslation } from "react-i18next";

/**
 * RestrictedCategoriesCard Component
 * 
 * Displays restricted/not allowed categories for event venues.
 * Follows SOLID principles:
 * - Single Responsibility: Only displays restricted categories
 * - Open/Closed: Can be extended without modification
 * - Dependency Inversion: Depends on translation abstraction
 * 
 * Follows DRY principle by being reusable across different pages.
 * 
 * @param {string} className - Optional additional CSS classes
 * @returns {JSX.Element} Restricted categories warning card
 */
export default function RestrictedCategoriesCard({ className = "" }) {
  const { t, i18n } = useTranslation(["forms"]);

  const title = t("forms:restrictedCategories.title", "Restricted Categories");
  const subtitle = t(
    "forms:restrictedCategories.subtitle",
    "We specialize in business, educational and cultural events. To maintain professional format, we do not provide halls for events related to:"
  );
  
  // Get categories - use i18n.store to directly access the translation object
  const currentLang = i18n.language || 'en';
  let categories;
  
  try {
    // Try to get the categories array directly from the resource bundle
    const resourceBundle = i18n.getResourceBundle(currentLang, 'forms');
    categories = resourceBundle?.restrictedCategories?.categories;
  } catch (e) {
    console.error("Error loading categories:", e);
    categories = null;
  }

  // Fallback categories (only used if translation completely fails)
  const fallbackCategories = [
    "Cryptocurrency, forex and trading",
    "Network marketing (MLM)",
    "Religious organizations and missionary activities",
    "Betting, casinos and other gambling",
    "18+ topics and intimate sphere",
    "Promotion of alcohol, tobacco or similar products",
    "Weapons, violence or discrimination",
    "Discos, night parties and club-party formats",
    "Illegal and suspicious activities",
  ];

  // Check if categories is valid array
  const categoriesList = 
    Array.isArray(categories) && categories.length > 0 && typeof categories[0] === 'string'
      ? categories
      : fallbackCategories;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-accent-primary bg-gradient-to-br from-navy-50 to-navy-100 shadow-lg p-6 ${className}`}
    >
      {/* Attention-grabbing top banner */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary via-accent-highlight to-accent-primary"></div>
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div className="relative">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 bg-accent-primary opacity-20 rounded-full animate-ping"></div>
            <svg
              className="h-10 w-10 text-accent-primary relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="#f1f5f9"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-navy-900 mb-2 flex items-center gap-2">
            <span className="inline-block bg-accent-primary text-white rounded-lg px-3 py-1 text-base font-bold shadow-md">
              ⚠️ {title}
            </span>
          </h3>
          <div className="text-navy-800 text-sm mb-3 font-semibold leading-relaxed">
            {subtitle}
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-navy-700 font-medium">
            {categoriesList.map((category, index) => (
              <li key={index} className="leading-relaxed">{category}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="absolute right-0 top-0 h-16 w-16 bg-navy-100 rounded-bl-full opacity-60 blur-2xl pointer-events-none" />
    </div>
  );
}
