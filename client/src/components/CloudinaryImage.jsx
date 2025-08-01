import React from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImageUrl } from '../utils/cloudinary';
import { useTranslation } from 'react-i18next';

/**
 * CloudinaryImage component for displaying optimized images
 * 
 * @param {Object} props - Component props
 * @param {string|Object} props.photo - Photo URL or object with url property
 * @param {string} [props.alt=""] - Alt text for the image
 * @param {Object} [props.className] - CSS classes to apply to the image
 * @param {Object} [props.imgStyle] - Inline styles to apply to the image
 * @param {Function} [props.onClick] - Click handler for the image
 * @returns {JSX.Element} - React component
 */
export default function CloudinaryImage({ 
  photo, 
  alt = "", 
  className = "", 
  imgStyle = {},
  onClick = null,
  ...rest
}) {
  const { t } = useTranslation('booking');
  
  // Get the URL from various photo formats
  const imageUrl = getCloudinaryImageUrl(photo);
  
  if (!imageUrl) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={imgStyle}
      >
        <span className="text-gray-400">{t('common.noImage')}</span>
      </div>
    );
  }

  // For Cloudinary URLs, use AdvancedImage for optimal delivery
  // For local URLs, use standard img tag
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={imgStyle}
      onClick={onClick}
      loading="lazy"
      {...rest}
    />
  );
}