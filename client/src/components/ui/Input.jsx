import React from 'react';

/**
 * Standardized Input Component
 * Following SOLID principles with consistent styling
 * Mobile-first responsive design with validation states
 */
const Input = ({ 
  label,
  error,
  success,
  type = 'text',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  id,
  ...props 
}) => {
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Base styles - mobile-first approach
  const baseStyles = 'border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variants
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // State styles using new design system colors
  const getStateStyles = () => {
    if (error) {
      return 'border-error-500 bg-error-50 text-error-900 focus:ring-error-500 focus:border-error-500';
    }
    if (success) {
      return 'border-success-500 bg-success-50 text-success-900 focus:ring-success-500 focus:border-success-500';
    }
    return 'border-border-light bg-bg-card text-text-primary focus:ring-accent-primary focus:border-accent-primary hover:border-border-default';
  };
  
  // Full width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Combine all styles
  const inputClassName = [
    baseStyles,
    sizeStyles[size],
    getStateStyles(),
    widthStyles,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        disabled={disabled}
        className={inputClassName}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
      
      {success && !error && (
        <p className="mt-1 text-sm text-success-600">
          {success}
        </p>
      )}
    </div>
  );
};

export default Input;
