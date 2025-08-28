/**
 * Custom cluster renderer for Google Maps MarkerClusterer
 * Creates cluster icons that match the website's primary navy blue theme
 */

/**
 * Create a custom cluster icon with primary navy blue theme
 * @param {number} count - Number of markers in the cluster
 * @param {string} size - Size category ('small', 'medium', 'large')
 * @param {boolean} isHovered - Whether the cluster is being hovered
 * @returns {string} Data URL of the cluster icon
 */
import { getUiScaleFactor } from './markerSizeUtils';

export const createClusterIcon = (count, size = 'medium', isHovered = false) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Device pixel ratio for high DPI screens
  const dpr = window.devicePixelRatio || 1;
  
  // Size configurations based on cluster size for optimal UX - smaller and more rounded
  const sizeConfigs = {
    small: {
      width: 30,
      height: 30,
      fontSize: 10,
      borderRadius: 15
    },
    medium: {
      width: 36,
      height: 36,
      fontSize: 11,
      borderRadius: 18
    },
    large: {
      width: 42,
      height: 42,
      fontSize: 12,
      borderRadius: 21
    }
  };
  
  const uiScale = getUiScaleFactor();
  const base = sizeConfigs[size] || sizeConfigs.medium;
  const config = {
    width: Math.round(base.width * uiScale),
    height: Math.round(base.height * uiScale),
    fontSize: Math.round(base.fontSize * uiScale),
    borderRadius: Math.round(base.borderRadius * uiScale)
  };
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
  
  // Enhanced shadow for hover state - using Tailwind shadow approach
  if (isHovered) {
    context.shadowColor = 'rgba(0, 0, 0, 0.15)'; // Tailwind shadow-lg equivalent
    context.shadowBlur = 8;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 3;
  } else {
    context.shadowColor = 'rgba(0, 0, 0, 0.1)'; // Tailwind shadow-md equivalent
    context.shadowBlur = 4;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 2;
  }
  
  // Draw perfect circle
  context.beginPath();
  context.arc(width / 2, height / 2, borderRadius, 0, 2 * Math.PI);
  
  // Fill with gradient using Tailwind color palette - navy blue family
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, borderRadius
  );
  
  if (isHovered) {
    // Hover state - Tailwind blue-500 to blue-700 gradient (lighter)
    gradient.addColorStop(0, '#3b82f6'); // blue-500
    gradient.addColorStop(0.5, '#2563eb'); // blue-600
    gradient.addColorStop(1, '#1d4ed8'); // blue-700
  } else {
    // Default state - Tailwind blue-700 to blue-900 gradient
    gradient.addColorStop(0, '#1d4ed8'); // blue-700
    gradient.addColorStop(0.5, '#1e40af'); // blue-800
    gradient.addColorStop(1, '#1e3a8a'); // blue-900
  }
  
  context.fillStyle = gradient;
  context.fill();
  
  // Border enhancement using Tailwind colors
  if (isHovered) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // More prominent border on hover
    context.lineWidth = 2;
  } else {
    context.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Subtle border
    context.lineWidth = 1.5;
  }
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
    
    // Size configurations for Google Maps - smaller sizes
    const sizeConfigs = {
      small: { width: 34, height: 34 },
      medium: { width: 42, height: 42 },
      large: { width: 50, height: 50 }
    };
    
    const sizeConfig = {
      width: Math.round((sizeConfigs[size] || sizeConfigs.medium).width * uiScale),
      height: Math.round((sizeConfigs[size] || sizeConfigs.medium).height * uiScale)
    };
    
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

    // Add hover events to cluster marker for immediate visual feedback
    marker.addListener("mouseover", () => {
      const hoveredIconUrl = createClusterIcon(count, size, true);
      marker.setIcon({
        url: hoveredIconUrl,
        scaledSize: new window.google.maps.Size(sizeConfig.width, sizeConfig.height),
        anchor: new window.google.maps.Point(sizeConfig.width / 2, sizeConfig.height / 2)
      });
      marker.setZIndex(10000 + count + 1000); // Bring to front on hover
    });

    marker.addListener("mouseout", () => {
      const normalIconUrl = createClusterIcon(count, size, false);
      marker.setIcon({
        url: normalIconUrl,
        scaledSize: new window.google.maps.Size(sizeConfig.width, sizeConfig.height),
        anchor: new window.google.maps.Point(sizeConfig.width / 2, sizeConfig.height / 2)
      });
      marker.setZIndex(10000 + count); // Reset z-index
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
