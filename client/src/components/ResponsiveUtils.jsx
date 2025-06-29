import { useState, useEffect } from "react";

/**
 * Mobile Responsive Hook
 * Follows SOLID principles - Single Responsibility for responsive behavior
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop
  };
};

/**
 * Responsive Hero Text Component
 * Dynamically adjusts text size based on screen size
 */
export const ResponsiveHeroText = ({ children, className = "" }) => {
  const { isMobile, isTablet } = useResponsive();

  const getTextSize = () => {
    if (isMobile) return "text-5xl";
    if (isTablet) return "text-7xl";
    return "text-8xl lg:text-9xl";
  };

  return (
    <h1 className={`${getTextSize()} font-bold text-white leading-none tracking-tight ${className}`}>
      {children}
    </h1>
  );
};

/**
 * Responsive Container Component
 * Adjusts padding and spacing based on screen size
 */
export const ResponsiveContainer = ({ children, className = "" }) => {
  const { isMobile, isTablet } = useResponsive();

  const getPadding = () => {
    if (isMobile) return "px-4 py-4";
    if (isTablet) return "px-6 py-6";
    return "px-8 py-8";
  };

  return (
    <div className={`${getPadding()} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile Navigation Component
 * Shows mobile-specific navigation when needed
 */
export const MobileNavigation = ({ isOpen, onToggle, onClose }) => {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="md:hidden text-white hover:text-brand-orange focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2"
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white hover:text-brand-orange"
              aria-label="Close mobile menu"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <nav className="flex flex-col items-center space-y-6 text-white text-xl">
              <a href="/places" className="hover:text-brand-orange transition-colors" onClick={onClose}>
                List Your Space
              </a>
              <a href="/login" className="hover:text-brand-orange transition-colors" onClick={onClose}>
                Log In
              </a>
              <a 
                href="/register" 
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Sign Up
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
