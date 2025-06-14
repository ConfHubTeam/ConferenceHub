import React from "react";

/**
 * WeekdayBlocker Component
 * 
 * This component handles the weekday blocking functionality,
 * displaying checkboxes for each weekday and managing the blocked weekday state.
 */
const WeekdayBlocker = ({ blockedWeekdays, setBlockedWeekdays }) => {
  // Array of weekday names in short form
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /**
   * Handle checkbox change for weekday blocking
   * @param {boolean} isChecked - Whether the checkbox is checked
   * @param {number} index - The index of the weekday (0 = Sunday, 1 = Monday, etc.)
   */
  const handleWeekdayToggle = (isChecked, index) => {
    if (isChecked) {
      setBlockedWeekdays(prev => [...prev, index]);
    } else {
      setBlockedWeekdays(prev => prev.filter(d => d !== index));
    }
  };

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Block Weekdays:</h4>
      <div className="flex flex-wrap gap-2">
        {weekdays.map((day, index) => (
          <label key={day} className="flex items-center gap-1 p-2 border rounded-lg">
            <input
              type="checkbox"
              checked={blockedWeekdays.includes(index)}
              onChange={(e) => handleWeekdayToggle(e.target.checked, index)}
              className="w-4 h-4 accent-blue-600"
            />
            <span>{day}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default WeekdayBlocker;
