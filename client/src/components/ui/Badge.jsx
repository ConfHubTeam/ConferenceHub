import React from 'react';

/**
 * Standardized Badge Component
 * Following SOLID principles for status indication
 * Consistent with new design system colors
 */
const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) => {
  
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md border transition-all duration-200';
  
  // Size variants
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  // Variant styles with new design system colors
  const variantStyles = {
    default: 'bg-bg-secondary text-text-primary border-border-light',
    success: 'bg-success-100 text-success-700 border-success-200',
    warning: 'bg-warning-100 text-warning-700 border-warning-200', 
    error: 'bg-error-100 text-error-700 border-error-200',
    info: 'bg-info-100 text-info-700 border-info-200',
    accent: 'bg-accent-primary text-white border-accent-primary',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    // Status badges using semantic colors
    confirmed: 'bg-success-100 text-success-700 border-success-200',
    pending: 'bg-warning-100 text-warning-700 border-warning-200',
    cancelled: 'bg-error-100 text-error-700 border-error-200',
    processing: 'bg-info-100 text-info-700 border-info-200'
  };
  
  // Combine all styles
  const badgeClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span
      className={badgeClassName}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
