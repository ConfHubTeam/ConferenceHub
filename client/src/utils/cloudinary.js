import { Cloudinary } from '@cloudinary/url-gen';
import api from './api';

// Create a Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: 'dxb10mtcp'
  }
});

/**
 * Get proper Cloudinary image URL
 * @param {string|object} photo - Photo object from database or string URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized Cloudinary URL
 */
export const getCloudinaryImageUrl = (photo, options = {}) => {
  if (!photo) return '';
  
  // Try to parse the photo if it's a JSON string
  let photoObj = photo;
  if (typeof photo === 'string') {
    try {
      // Check if the string starts with '{' and ends with '}' indicating it might be JSON
      if (photo.trim().startsWith('{') && photo.trim().endsWith('}')) {
        photoObj = JSON.parse(photo);
      }
    } catch (e) {
      // If parsing fails, continue with original string
      console.log('Failed to parse JSON string:', e);
    }
  }
  
  // Case 1: If it's a cloudinary object with url property (after potential parsing)
  if (typeof photoObj === 'object' && photoObj.url) {
    return photoObj.url;
  }

  // Case 2: If it's a string that already looks like a full Cloudinary URL
  if (typeof photoObj === 'string' && photoObj.includes('cloudinary.com')) {
    return photoObj;
  }

  // Case 3: If it's a local file path, use the base URL from our API config
  if (typeof photoObj === 'string') {
    // Get the base URL without the api prefix
    const baseUrl = import.meta.env.PROD ? 
      window.location.origin : // In production, use the origin
      (import.meta.env.VITE_API_URL || 'http://localhost:4000'); // In dev, use env or default
    
    return `${baseUrl}/uploads/${photoObj}`;
  }

  return '';
};

/**
 * Component to display Cloudinary image with advanced optimizations
 * @param {string|object} photo - Photo object from database or string URL
 * @param {string} alt - Alt text for the image
 * @param {object} transformations - Cloudinary transformations to apply
 * @param {object} imgProps - Additional props for the img element
 * @returns {JSX.Element} - Optimized image element
 */
export const getOptimizedImage = (photo, options = {}) => {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  const url = getCloudinaryImageUrl(photo);
  
  // If no URL or it's a local URL, just return it
  if (!url || url.startsWith('http://localhost')) {
    return url;
  }

  // For Cloudinary URLs, try to add optimizations
  try {
    // Extract the public ID from the URL
    // Example: https://res.cloudinary.com/dxb10mtcp/image/upload/v1650123456/conferencehub/image1.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      // Get everything after 'upload/'
      const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
      // Remove version if present
      const publicId = publicIdWithVersion.replace(/v\d+\//, '');
      
      // Create a new Cloudinary image with the public ID
      const image = cld.image(publicId);
      
      // Apply transformations based on options
      if (width) image.resize(`w_${width}`);
      if (height) image.resize(`h_${height}`);
      if (quality) image.quality(quality);
      if (format) image.format(format);
      
      return image.toURL();
    }
  } catch (error) {
    console.error('Error optimizing Cloudinary image:', error);
  }
  
  // If anything fails, return the original URL
  return url;
};

export default cld;