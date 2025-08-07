import React from 'react';

/**
 * Icon Button Component
 * Specialized button for icon-only or icon + text combinations
 * Mobile-friendly with proper touch targets
 */
const IconButton = ({ 
  children, 
  icon: Icon,
  iconPosition = 'left',
  variant = 'primary', 
  size = 'md', 
  rounded = false,
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  
  // Base styles with proper touch targets for mobile
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variants - mobile-first with minimum 44px touch target
  const sizeStyles = {
    sm: rounded ? 'w-8 h-8 p-1.5' : 'px-2 py-1.5 text-sm gap-1.5 min-h-[44px] sm:min-h-auto sm:px-3 sm:py-2',
    md: rounded ? 'w-10 h-10 p-2' : 'px-3 py-2 text-sm gap-2 min-h-[44px] sm:px-4 sm:py-2.5 sm:text-base',
    lg: rounded ? 'w-12 h-12 p-2.5' : 'px-4 py-2.5 text-base gap-2.5 min-h-[44px] sm:px-6 sm:py-3 sm:text-lg'
  };
  
  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary shadow-sm hover:shadow-md',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary shadow-sm hover:shadow-md',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm hover:shadow-md',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 shadow-sm hover:shadow-md',
    error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-sm hover:shadow-md',
    info: 'bg-info-600 text-white hover:bg-info-700 focus:ring-info-500 shadow-sm hover:shadow-md',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    neutral: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md'
  };
  
  // Border radius
  const borderRadius = rounded ? 'rounded-full' : 'rounded-lg';
  
  // Loading spinner
  const LoadingSpinner = () => (
    <svg className={`animate-spin ${iconSizes[size]}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
  
  // Combine all styles
  const buttonClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    borderRadius,
    className
  ].filter(Boolean).join(' ');
  
  // Render icon based on position
  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (Icon) return <Icon className={iconSizes[size]} />;
    return null;
  };
  
  return (
    <button
      className={buttonClassName}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

export default IconButton;
