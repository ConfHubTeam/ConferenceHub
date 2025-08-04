import { useTranslation } from "../i18n/hooks/useTranslation";

export default function ReviewSortFilter({ sortBy, onSortChange }) {
  const { t } = useTranslation("reviews");
  
  const sortOptions = [
    { value: "newest", label: t("sorting.newest") },
    { value: "oldest", label: t("sorting.oldest") },
    { value: "highest", label: t("sorting.highest") },
    { value: "lowest", label: t("sorting.lowest") }
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">{t("sorting.label")}</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
