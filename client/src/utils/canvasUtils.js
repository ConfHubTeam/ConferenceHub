/**
 * Canvas drawing utilities for creating custom map markers
 */

/**
 * Draw the marker shape (rounded rectangle without pin) on canvas
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {number} baseWidth - Width of the marker
 * @param {number} baseHeight - Height of the marker
 * @param {number} borderRadius - Border radius for rounded corners
 */
export const drawMarkerShape = (context, baseWidth, baseHeight, borderRadius) => {
  // Calculate marker dimensions (full height without pointer)
  const markerWidth = baseWidth * 0.95;
  const markerHeight = baseHeight * 0.9; // Use more of the available height
  const startX = (baseWidth - markerWidth) / 2;
  const startY = (baseHeight - markerHeight) / 2;
  
  // Add subtle shadow for depth
  context.shadowColor = "rgba(0, 0, 0, 0.25)";
  context.shadowBlur = 6;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 3;
  
  // Create rounded rectangle path
  context.beginPath();
  context.roundRect(startX, startY, markerWidth, markerHeight, borderRadius);
  
  // Create gradient using theme colors
  const gradient = context.createLinearGradient(0, startY, 0, startY + markerHeight);
  gradient.addColorStop(0, "#f59e5e"); // Lighter orange
  gradient.addColorStop(0.5, "#f38129"); // Primary theme color
  gradient.addColorStop(1, "#d66d1c"); // Darker orange for depth
  
  context.fillStyle = gradient;
  context.fill();
  
  // Add subtle border for definition
  context.strokeStyle = "rgba(255, 255, 255, 0.4)";
  context.lineWidth = 1;
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
  
  // Add text shadow for better legibility
  context.shadowColor = "rgba(0, 0, 0, 0.3)";
  context.shadowBlur = 1;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1;
  
  // Draw the price text centered on the marker
  context.fillText(formattedPrice, baseWidth / 2, baseHeight / 2);
  
  // Reset shadow
  context.shadowColor = "transparent";
};
