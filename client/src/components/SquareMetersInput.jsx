import { useState } from "react";

const SquareMetersInput = ({ squareMeters, setSquareMeters }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (e) => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Parse the value as a float, or set it to empty string if input is empty
    if (value === "") {
      setSquareMeters("");
    } else {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        setSquareMeters(parsedValue);
      }
    }
  };

  return (
    <div className="w-full">
      <label className={`block text-sm font-medium mb-1 text-base`}>
        Conference Size (m²)
      </label>
      <div className="relative">
        <input
          type="text"
          value={squareMeters === null || squareMeters === "" ? "" : squareMeters}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter room size"
          className="w-full px-3 py-2 border"
        />
      </div>
    </div>
  );
};

export default SquareMetersInput;
