/**
 * Custom cluster renderer for Google Maps MarkerClusterer
 * Creates cluster icons that match the website's main theme color (#f38129)
 */

/**
 * Create a custom cluster icon with main theme color
 * @param {number} count - Number of markers in the cluster
 * @param {string} size - Size category ('small', 'medium', 'large')
 * @returns {string} Data URL of the cluster icon
 */
export const createClusterIcon = (count, size = 'medium') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Device pixel ratio for high DPI screens
  const dpr = window.devicePixelRatio || 1;
  
  // Size configurations based on cluster size for optimal UX
  const sizeConfigs = {
    small: {
      width: 42,
      height: 42,
      fontSize: 12,
      borderRadius: 21
    },
    medium: {
      width: 52,
      height: 52,
      fontSize: 14,
      borderRadius: 26
    },
    large: {
      width: 62,
      height: 62,
      fontSize: 16,
      borderRadius: 31
    }
  };
  
  const config = sizeConfigs[size] || sizeConfigs.medium;
  const { width, height, fontSize, borderRadius } = config;
  
  // Set canvas dimensions accounting for device pixel ratio
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // Scale all drawing operations by the device pixel ratio
  context.scale(dpr, dpr);
  
  // Set canvas CSS dimensions to maintain visual size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Apply anti-aliasing for smooth rendering
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  // Add subtle shadow for depth perception
  context.shadowColor = 'rgba(0, 0, 0, 0.25)';
  context.shadowBlur = 6;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 3;
  
  // Draw perfect circle
  context.beginPath();
  context.arc(width / 2, height / 2, borderRadius, 0, 2 * Math.PI);
  
  // Fill with gradient using main theme colors
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, borderRadius
  );
  gradient.addColorStop(0, '#f59e5e'); // Lighter center for visual depth
  gradient.addColorStop(0.5, '#f38129'); // Main theme color
  gradient.addColorStop(1, '#d66d1c'); // Darker edge for definition
  
  context.fillStyle = gradient;
  context.fill();
  
  // Add subtle border for enhanced visual definition
  context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  context.lineWidth = 1.5;
  context.stroke();
  
  // Reset shadow for text rendering
  context.shadowColor = 'transparent';
  
  // Draw count text with optimal readability
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  
  // Add text shadow for enhanced legibility
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 1;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1;
  
  // Draw the count text
  context.fillText(count.toString(), width / 2, height / 2);
  
  // Convert canvas to image URL with maximum quality
  return canvas.toDataURL('image/png', 1.0);
};

/**
 * Custom cluster renderer object for MarkerClusterer
 */
export const customClusterRenderer = {
  /**
   * Render method called by MarkerClusterer for each cluster
   * @param {object} cluster - Cluster object from MarkerClusterer
   * @param {object} stats - Statistics about the cluster
   * @returns {google.maps.Marker} Custom cluster marker
   */
  render: (cluster, stats) => {
    const count = cluster.count;
    const position = cluster.position;
    
    // Determine size based on count
    let size = 'small';
    if (count >= 100) {
      size = 'large';
    } else if (count >= 10) {
      size = 'medium';
    }
    
    // Create custom icon
    const iconUrl = createClusterIcon(count, size);
    
    // Size configurations for Google Maps
    const sizeConfigs = {
      small: { width: 40, height: 40 },
      medium: { width: 50, height: 50 },
      large: { width: 60, height: 60 }
    };
    
    const sizeConfig = sizeConfigs[size];
    
    // Create and return the cluster marker
    const marker = new window.google.maps.Marker({
      position,
      icon: {
        url: iconUrl,
        scaledSize: new window.google.maps.Size(sizeConfig.width, sizeConfig.height),
        anchor: new window.google.maps.Point(sizeConfig.width / 2, sizeConfig.height / 2)
      },
      zIndex: 10000 + count, // Higher count clusters appear on top
      title: `${count} locations`
    });
    
    return marker;
  }
};

/**
 * Get cluster options with custom renderer
 * @returns {object} Options object for MarkerClusterer
 */
export const getClusterOptions = () => {
  return {
    gridSize: 60,
    maxZoom: 15,
    zoomOnClick: true,
    averageCenter: true,
    minimumClusterSize: 2,
    renderer: customClusterRenderer
  };
};
