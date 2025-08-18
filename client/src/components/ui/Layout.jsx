import React from 'react';

/**
 * Layout wrapper components following SOLID principles
 * Single responsibility for consistent page and section layouts
 * Mobile-first responsive design with 8px grid system
 */

// Main page layout wrapper
export const PageLayout = ({ 
  children, 
  className = '',
  backgroundVariant = 'primary',
  ...props 
}) => {
  const backgroundStyles = {
    primary: 'bg-bg-primary',
    secondary: 'bg-bg-secondary', 
    card: 'bg-bg-card'
  };
  
  return (
    <div 
      className={`min-h-screen ${backgroundStyles[backgroundVariant]} ${className}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto spacing-container">
        {children}
      </div>
    </div>
  );
};

// Section layout wrapper
export const SectionLayout = ({ 
  children, 
  className = '',
  spacing = true,
  ...props 
}) => {
  const spacingClass = spacing ? 'spacing-section' : '';
  
  return (
    <section 
      className={`${spacingClass} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};

// Content area wrapper
export const ContentLayout = ({ 
  children, 
  className = '',
  variant = 'default',
  ...props 
}) => {
  const variantStyles = {
    default: 'spacing-content',
    card: 'spacing-card',
    compact: 'p-4',
    spacious: 'p-8 lg:p-12'
  };
  
  return (
    <div 
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Grid layout wrapper
export const GridLayout = ({ 
  children, 
  columns = 'auto',
  gap = '4',
  className = '',
  ...props 
}) => {
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };
  
  return (
    <div 
      className={`grid ${columnStyles[columns]} gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Flex layout wrapper
export const FlexLayout = ({ 
  children, 
  direction = 'row',
  justify = 'start',
  align = 'start',
  gap = '4',
  wrap = false,
  className = '',
  ...props 
}) => {
  const directionClass = direction === 'column' ? 'flex-col' : 'flex-row';
  const justifyClass = `justify-${justify}`;
  const alignClass = `items-${align}`;
  const gapClass = `gap-${gap}`;
  const wrapClass = wrap ? 'flex-wrap' : '';
  
  return (
    <div 
      className={`flex ${directionClass} ${justifyClass} ${alignClass} ${gapClass} ${wrapClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stack layout (vertical spacing)
export const StackLayout = ({ 
  children, 
  spacing = '4',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`space-y-${spacing} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
