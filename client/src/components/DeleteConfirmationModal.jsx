import { useState } from "react";

/**
 * Reusable delete confirmation modal component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onDelete - Function to call when the delete is confirmed
 * @param {string} props.title - Title of the modal (e.g., "Delete Conference Room")
 * @param {Object} props.itemToDelete - The item being deleted
 * @param {Array} props.itemDetails - Array of details to show about the item [{ label: "Title", value: "Room name" }]
 * @param {Array} props.consequences - Array of consequences of deletion ["All bookings will be deleted", etc.]
 * @param {boolean} props.deleteInProgress - Whether deletion is in progress
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onDelete,
  title = "Delete Confirmation",
  itemToDelete,
  itemDetails = [],
  consequences = [],
  deleteInProgress = false,
}) {
  const [confirmationText, setConfirmationText] = useState("");
  
  if (!isOpen) return null;

  // Check if delete button should be enabled
  const isDeleteEnabled = confirmationText.toUpperCase() === "DELETE" && !deleteInProgress;

  // Handle actual deletion
  const handleDelete = () => {
    if (!isDeleteEnabled) return;
    onDelete();
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setConfirmationText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-red-600">{title} - Confirmation Required</h3>
        
        {/* Item details section */}
        {itemDetails.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="flex flex-col gap-1">
              {itemDetails.map((detail, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-gray-600 font-semibold w-20">{detail.label}:</span>
                  <span>{typeof detail.value === "string" ? detail.value : detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <p className="font-semibold text-red-600 mb-2">Warning: This action cannot be undone!</p>
          
          {consequences.length > 0 && (
            <>
              <p className="mb-4">The following data will be permanently deleted:</p>
              <ul className="list-disc ml-6 mb-4 text-sm text-gray-600">
                {consequences.map((consequence, index) => (
                  <li key={index}>{consequence}</li>
                ))}
              </ul>
            </>
          )}
          
          {/* Type DELETE to confirm section */}
          <div className="mt-4 border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE" to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE in all caps"
              autoComplete="off"
            />
            <div className="text-sm mt-1 text-gray-500">
              This helps prevent accidental deletions
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-end">
          <button 
            onClick={cancelDelete}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={deleteInProgress}
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            className={`px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              isDeleteEnabled 
                ? "bg-red-600 hover:bg-red-700 cursor-pointer" 
                : "bg-red-300 cursor-not-allowed"
            }`}
            disabled={!isDeleteEnabled || deleteInProgress}
          >
            {deleteInProgress ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
