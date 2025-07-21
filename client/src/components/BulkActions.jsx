/**
 * Bulk Actions Component
 * US-R006: Bulk actions for review management
 * Follows SOLID principles with single responsibility for bulk operations UI
 * Implements DRY principles with reusable action buttons
 */
export default function BulkActions({ selectedCount, onBulkAction, loading }) {
  
  // Bulk action handler (DRY principle)
  const handleBulkAction = (action) => {
    if (selectedCount === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedCount} selected review(s)?`;
    if (window.confirm(confirmMessage)) {
      onBulkAction(action);
    }
  };

  // Don't render if no selections
  if (selectedCount === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center text-gray-600">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Select reviews to perform bulk actions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-blue-900">
              {selectedCount} review{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Delete Button */}
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {loading ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
