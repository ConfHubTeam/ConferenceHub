// Translation-aware form components
export { default as TranslatedInput } from "./TranslatedInput";
export { default as TranslatedSelect } from "./TranslatedSelect";
export { default as TranslatedTextarea } from "./TranslatedTextarea";
export { default as TranslatedButton } from "./TranslatedButton";

// Re-export hooks for convenience
export { useEnhancedTranslation } from "../../i18n/hooks/useEnhancedTranslation";
export { useTranslatedValidation } from "../../i18n/hooks/useTranslatedValidation";

// Re-export HOC
export { withTranslation, TranslationProvider, TranslationErrorBoundary } from "../../i18n/hoc/withTranslation";
