import React from 'react';

/**
 * Standardized Avatar Component
 * Following SOLID principles with consistent styling
 * Handles image, initials, and fallback states
 */
const Avatar = ({ 
  src,
  alt,
  initials,
  size = 'md',
  variant = 'circular',
  className = '',
  ...props 
}) => {
  
  // Size variants
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };
  
  // Variant styles
  const variantStyles = {
    circular: 'rounded-full',
    square: 'rounded-lg',
    rounded: 'rounded-md'
  };
  
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium bg-accent-primary text-white border-2 border-border-light overflow-hidden';
  
  // Combine styles
  const avatarClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  ].filter(Boolean).join(' ');
  
  // Generate initials from name if not provided
  const getInitials = () => {
    if (initials) return initials;
    if (alt) {
      return alt
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return '??';
  };
  
  return (
    <div className={avatarClassName} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image on error, show initials fallback
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span className="select-none">
          {getInitials()}
        </span>
      )}
    </div>
  );
};

export default Avatar;
