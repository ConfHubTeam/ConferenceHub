import React from 'react';

/**
 * Standardized Card Component
 * Following SOLID principles - Single Responsibility for card layouts
 * Open/Closed - Extensible through variants without modification
 * Mobile-first responsive design
 */
const Card = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  hover = true,
  className = '',
  ...props 
}) => {
  
  // Base styles - consistent foundation
  const baseStyles = 'rounded-lg transition-all duration-200';
  
  // Size variants following spacing system
  const sizeStyles = {
    sm: 'spacing-card p-3 sm:p-4',
    md: 'spacing-card',
    lg: 'spacing-content'
  };
  
  // Variant styles with new design system colors
  const variantStyles = {
    default: 'bg-bg-card border border-border-light',
    elevated: 'bg-bg-card shadow-ui border border-border-light',
    success: 'bg-success-50 border border-success-200',
    warning: 'bg-warning-50 border border-warning-200', 
    error: 'bg-error-50 border border-error-200',
    info: 'bg-info-50 border border-info-200',
    accent: 'bg-accent-primary text-white border border-accent-primary',
    neutral: 'bg-bg-secondary border border-border-light'
  };
  
  // Hover styles
  const hoverStyles = hover ? {
    default: 'hover:border-border-default hover:shadow-sm',
    elevated: 'hover:shadow-lg hover:border-accent-primary/20',
    success: 'hover:border-success-300',
    warning: 'hover:border-warning-300',
    error: 'hover:border-error-300', 
    info: 'hover:border-info-300',
    accent: 'hover:bg-accent-hover',
    neutral: 'hover:border-border-default'
  } : {};
  
  // Combine all styles
  const cardClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    hover && hoverStyles[variant],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={cardClassName}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
