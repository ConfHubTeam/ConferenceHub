import React, { useEffect } from 'react';

/**
 * Standardized Modal Component
 * Following SOLID principles with consistent styling
 * Accessibility-first design with keyboard navigation
 */
const Modal = ({ 
  isOpen,
  onClose,
  title,
  children, 
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  ...props 
}) => {
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Size variants
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className={`relative bg-bg-card rounded-lg shadow-ui border border-border-light w-full ${sizeStyles[size]} max-h-[90vh] overflow-hidden animate-fadeIn ${className}`}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
            {title && (
              <h2 className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-secondary"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
