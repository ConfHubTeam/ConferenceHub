/**
 * Custom cluster renderer for Google Maps MarkerClusterer
 * Creates cluster icons that match the website's reddish theme
 */

/**
 * Create a custom cluster icon with reddish theme
 * @param {number} count - Number of markers in the cluster
 * @param {string} size - Size category ('small', 'medium', 'large')
 * @returns {string} Data URL of the cluster icon
 */
export const createClusterIcon = (count, size = 'medium') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Device pixel ratio for high DPI screens
  const dpr = window.devicePixelRatio || 1;
  
  // Size configurations based on cluster size
  const sizeConfigs = {
    small: {
      width: 40,
      height: 40,
      fontSize: 12,
      borderRadius: 20
    },
    medium: {
      width: 50,
      height: 50,
      fontSize: 14,
      borderRadius: 25
    },
    large: {
      width: 60,
      height: 60,
      fontSize: 16,
      borderRadius: 30
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
  
  // Apply anti-aliasing
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  // Add shadow
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 4;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;
  
  // Draw circle
  context.beginPath();
  context.arc(width / 2, height / 2, borderRadius, 0, 2 * Math.PI);
  
  // Fill with gradient matching the website theme
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, borderRadius
  );
  gradient.addColorStop(0, '#ff5a73'); // Lighter center
  gradient.addColorStop(0.7, '#ff385c'); // Primary color
  gradient.addColorStop(1, '#e31c5f'); // Darker edge
  
  context.fillStyle = gradient;
  context.fill();
  
  // Add subtle inner border
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.lineWidth = 1;
  context.stroke();
  
  // Reset shadow for text
  context.shadowColor = 'transparent';
  
  // Draw count text
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  
  // Add text stroke for better readability
  context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  context.lineWidth = 0.5;
  context.strokeText(count.toString(), width / 2, height / 2);
  
  // Fill text
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
