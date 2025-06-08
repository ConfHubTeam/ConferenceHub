/**
 * Canvas drawing utilities for creating custom map markers
 */

/**
 * Draw the marker shape (hexagon with pointer) on canvas
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {number} baseWidth - Width of the marker
 * @param {number} baseHeight - Height of the marker
 * @param {number} borderRadius - Border radius for rounded corners
 */
export const drawMarkerShape = (context, baseWidth, baseHeight, borderRadius) => {
  // Draw marker shape (more rectangular than hexagon for larger price values)
  const hexHeight = baseHeight * 0.75; // Increased from 0.72
  const hexWidth = baseWidth * 0.95; // Increased from 0.9
  const startX = (baseWidth - hexWidth) / 2;
  const startY = 0;
  const pointHeight = baseHeight - hexHeight;
  
  // Add shadow
  context.shadowColor = "rgba(0, 0, 0, 0.3)";
  context.shadowBlur = 4;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;
  
  // Create hexagon path
  context.beginPath();
  // Top left corner
  context.moveTo(startX + borderRadius, startY);
  // Top side
  context.lineTo(startX + hexWidth - borderRadius, startY);
  // Top right corner
  context.arcTo(startX + hexWidth, startY, startX + hexWidth, startY + borderRadius, borderRadius);
  // Right side
  context.lineTo(startX + hexWidth, startY + hexHeight - borderRadius);
  // Bottom right corner
  context.arcTo(startX + hexWidth, startY + hexHeight, startX + hexWidth - borderRadius, startY + hexHeight, borderRadius);
  // Bottom side to pointer start
  context.lineTo(startX + (hexWidth * 0.55), startY + hexHeight);
  // Pointer
  context.lineTo(baseWidth / 2, baseHeight);
  context.lineTo(startX + (hexWidth * 0.45), startY + hexHeight);
  // Bottom side from pointer end
  context.lineTo(startX + borderRadius, startY + hexHeight);
  // Bottom left corner
  context.arcTo(startX, startY + hexHeight, startX, startY + hexHeight - borderRadius, borderRadius);
  // Left side
  context.lineTo(startX, startY + borderRadius);
  // Top left corner
  context.arcTo(startX, startY, startX + borderRadius, startY, borderRadius);
  
  // Fill with gradient
  const gradient = context.createLinearGradient(0, 0, 0, hexHeight);
  gradient.addColorStop(0, "#ff385c");
  gradient.addColorStop(1, "#e31c5f");
  context.fillStyle = gradient;
  context.fill();
  
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
  const hexHeight = baseHeight * 0.75; // Same as in drawMarkerShape
  const hexWidth = baseWidth * 0.95; // Same as in drawMarkerShape
  
  // Text preparations
  context.fillStyle = "white";
  context.textAlign = "center";
  context.textBaseline = "middle";
  
  // Handle long texts (like large UZS amounts)
  // Start with default font size and reduce if needed
  let dynamicFontSize = fontSize;
  context.font = `bold ${dynamicFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  
  let textWidth = context.measureText(formattedPrice).width;
  let maxWidth = hexWidth * 0.9; // Max width = 90% of shape width
  
  // Reduce font size if text is too wide
  if (textWidth > maxWidth) {
    // More aggressive font size reduction for very long text
    let reductionStep = textWidth > maxWidth * 1.5 ? 1.0 : 0.5;
    
    while (textWidth > maxWidth && dynamicFontSize > 7) {
      dynamicFontSize -= reductionStep;
      context.font = `bold ${dynamicFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
      textWidth = context.measureText(formattedPrice).width;
    }
  }
  
  // Draw the text with possibly reduced font size
  context.fillText(formattedPrice, baseWidth / 2, hexHeight / 2);
};
