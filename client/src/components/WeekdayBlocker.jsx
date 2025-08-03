import React from "react";
import { useTranslation } from "react-i18next";

/**
 * WeekdayBlocker Component
 * 
 * This component handles the weekday blocking functionality,
 * displaying checkboxes for each weekday and managing the blocked weekday state.
 */
const WeekdayBlocker = ({ blockedWeekdays, setBlockedWeekdays }) => {
  const { t } = useTranslation("places");

  // Array of weekday names in short form with translation keys
  const weekdays = [
    { key: "sun", index: 0 },
    { key: "mon", index: 1 },
    { key: "tue", index: 2 },
    { key: "wed", index: 3 },
    { key: "thu", index: 4 },
    { key: "fri", index: 5 },
    { key: "sat", index: 6 }
  ];

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
      <h4 className="text-sm font-medium text-gray-700 mb-2">{t("form.scheduleAvailability.blockWeekdays")}</h4>
      <div className="flex flex-wrap gap-2">
        {weekdays.map((day) => (
          <label key={day.key} className="flex items-center gap-1 p-2 border rounded-lg">
            <input
              type="checkbox"
              checked={blockedWeekdays.includes(day.index)}
              onChange={(e) => handleWeekdayToggle(e.target.checked, day.index)}
              className="w-4 h-4 accent-blue-600"
            />
            <span>{t(`form.scheduleAvailability.weekdays.${day.key}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default WeekdayBlocker;
