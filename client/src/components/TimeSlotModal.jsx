import React from "react";
import { format, parseISO } from "date-fns";
import { formatHourTo12, generateTimeOptions } from "../utils/TimeUtils";

/**
 * TimeSlotModal Component
 * 
 * Modal for selecting time slots for booking a place
 */
export default function TimeSlotModal({
  isOpen,
  onClose,
  onConfirm,
  currentEditingDate,
  selectedStartTime,
  selectedEndTime,
  onStartTimeChange,
  onEndTimeChange,
  timeSlots,
  placeDetail,
  isEditMode
}) {
  if (!isOpen || !currentEditingDate) return null;

  const timeOptions = generateTimeOptions(timeSlots.start, timeSlots.end);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Set Time Slot
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900 font-medium text-sm">
            {format(parseISO(currentEditingDate), "EEEE, MMM d, yyyy")}
          </p>
        </div>

        {/* Minimum hours requirement info */}
        {placeDetail.minimumHours && placeDetail.minimumHours > 1 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">
                <strong>Minimum booking:</strong> {placeDetail.minimumHours} hour{placeDetail.minimumHours > 1 ? 's' : ''} required
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <select
                value={selectedStartTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select start time</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <select
                value={selectedEndTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedStartTime}
              >
                <option value="">Select end time</option>
                {timeOptions
                  .filter(option => {
                    if (!selectedStartTime) return true;
                    
                    // Get minimum hours requirement
                    const minimumHours = placeDetail.minimumHours || 1;
                    
                    // Calculate the minimum end time based on start time + minimum hours
                    const startHour = parseInt(selectedStartTime.split(':')[0], 10);
                    const minimumEndHour = startHour + minimumHours;
                    const endHour = parseInt(option.value.split(':')[0], 10);
                    
                    // End time must be greater than start time and meet minimum hours requirement
                    return endHour >= minimumEndHour;
                  })
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Available hours:</strong> {formatHourTo12(timeSlots.start)} - {formatHourTo12(timeSlots.end)}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedStartTime || !selectedEndTime}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isEditMode ? 'Update' : 'Add'} Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
