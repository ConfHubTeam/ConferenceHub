export default function ReviewSortFilter({ sortBy, onSortChange }) {
  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest rated" },
    { value: "lowest", label: "Lowest rated" }
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
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
