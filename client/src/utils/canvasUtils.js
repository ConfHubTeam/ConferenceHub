/**
 * Canvas drawing utilities for creating custom map markers
 */

/**
 * Draw the marker shape (rounded rectangle without pin) on canvas
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {number} baseWidth - Width of the marker
 * @param {number} baseHeight - Height of the marker
 * @param {number} borderRadius - Border radius for rounded corners
 * @param {boolean} isHighlighted - Whether the marker is highlighted
 * @param {boolean} isHovered - Whether the marker is being hovered
 */
export const drawMarkerShape = (context, baseWidth, baseHeight, borderRadius, isHighlighted = false, isHovered = false) => {
  // Calculate marker dimensions (full height without pointer)
  const markerWidth = baseWidth * 0.95;
  const markerHeight = baseHeight * 0.9; // Use more of the available height
  const startX = (baseWidth - markerWidth) / 2;
  const startY = (baseHeight - markerHeight) / 2;
  
  // Enhanced shadow based on state - using Tailwind shadow approach
  if (isHovered || isHighlighted) {
    context.shadowColor = "rgba(0, 0, 0, 0.15)"; // Tailwind shadow-lg equivalent
    context.shadowBlur = isHighlighted ? 12 : 8;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = isHighlighted ? 4 : 2;
  } else {
    context.shadowColor = "rgba(0, 0, 0, 0.1)"; // Tailwind shadow-md equivalent
    context.shadowBlur = 4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;
  }
  
  // Create rounded rectangle path
  context.beginPath();
  context.roundRect(startX, startY, markerWidth, markerHeight, borderRadius);
  
  // Create gradient using Tailwind color palette - navy blue family
  const gradient = context.createLinearGradient(0, startY, 0, startY + markerHeight);
  
  if (isHighlighted) {
    // Selected state - Tailwind blue-600 to blue-800 gradient
    gradient.addColorStop(0, "#2563eb"); // blue-600
    gradient.addColorStop(0.5, "#1d4ed8"); // blue-700
    gradient.addColorStop(1, "#1e40af"); // blue-800
  } else if (isHovered) {
    // Hover state - Tailwind blue-500 to blue-700 gradient (lighter)
    gradient.addColorStop(0, "#3b82f6"); // blue-500
    gradient.addColorStop(0.5, "#2563eb"); // blue-600
    gradient.addColorStop(1, "#1d4ed8"); // blue-700
  } else {
    // Default state - Tailwind blue-700 to blue-900 gradient
    gradient.addColorStop(0, "#1d4ed8"); // blue-700
    gradient.addColorStop(0.5, "#1e40af"); // blue-800
    gradient.addColorStop(1, "#1e3a8a"); // blue-900
  }
  
  context.fillStyle = gradient;
  context.fill();
  
  // Border enhancement using Tailwind colors
  if (isHighlighted) {
    context.strokeStyle = "#1e40af"; // blue-800
    context.lineWidth = 2;
  } else if (isHovered) {
    context.strokeStyle = "#2563eb"; // blue-600
    context.lineWidth = 1.5;
  } else {
    context.strokeStyle = "#1e3a8a"; // blue-900
    context.lineWidth = 1;
  }
  context.stroke();
  
  // Reset shadow for text
  context.shadowColor = "transparent";
};

/**
 * Draw price text on the marker
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {string} formattedPrice - The formatted price text to display
 * @param {number} baseWidth - Width of the marker
 * @param {number} baseHeight - Height of the marker
 * @param {number} fontSize - Initial font size
 */
export const drawPriceText = (context, formattedPrice, baseWidth, baseHeight, fontSize) => {
  const markerHeight = baseHeight * 0.9; // Same as in drawMarkerShape
  const markerWidth = baseWidth * 0.95; // Same as in drawMarkerShape
  
  // Text configuration for high contrast and readability
  context.fillStyle = "white";
  context.textAlign = "center";
  context.textBaseline = "middle";
  
  // Dynamic font sizing for optimal readability
  let dynamicFontSize = fontSize;
  context.font = `bold ${dynamicFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  
  let textWidth = context.measureText(formattedPrice).width;
  const maxWidth = markerWidth * 0.85; // More conservative padding for better UX
  
  // Optimize font size for text width
  if (textWidth > maxWidth) {
    const reductionStep = textWidth > maxWidth * 1.5 ? 1.0 : 0.5;
    
    while (textWidth > maxWidth && dynamicFontSize > 8) {
      dynamicFontSize -= reductionStep;
      context.font = `bold ${dynamicFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
      textWidth = context.measureText(formattedPrice).width;
    }
  }
  
  // Add text shadow for better legibility on white background
  context.shadowColor = "rgba(0, 0, 0, 0.1)";
  context.shadowBlur = 2;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1;
  
  // Draw the price text centered on the marker
  context.fillText(formattedPrice, baseWidth / 2, baseHeight / 2);
  
  // Reset shadow
  context.shadowColor = "transparent";
};
