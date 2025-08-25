import { useEffect, useState } from "react";
import CloudinaryImage from "./CloudinaryImage";

export default function ImageHoverQuadSquare({ photos, title, className = "", active = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchActive, setTouchActive] = useState(false);

  // Quad shows on hover (desktop) or when explicitly activated via touch on mobile
  const showQuad = isHovered || active || (isMobile && touchActive);

  // Sync hover state to active prop for smooth transitions when forced active
  useEffect(() => {
    if (active) {
      // briefly set hovered for consistent transition behavior
      setIsHovered(true);
    }
    // Don't force false to allow mouse leave to work naturally
  }, [active]);

  // Track mobile viewport to enable tap-to-toggle behavior
  useEffect(() => {
    const handler = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // On first tap on mobile, prevent navigation and show quad; subsequent tap navigates
  const handleClick = (e) => {
    if (!isMobile) return; // Desktop: allow normal link navigation
    if (!touchActive) {
      e.preventDefault();
      e.stopPropagation();
      setTouchActive(true);
    }
    // If already active, let the click bubble to navigate
  };

  // Handle no photos case
  if (!photos || photos.length === 0) {
    return (
      <div className={`aspect-square overflow-hidden relative ${className}`} onClick={handleClick}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    );
  }

  // If only one photo, show single image without hover effect
  if (photos.length === 1) {
    return (
      <div className={`aspect-square overflow-hidden relative ${className}`} onClick={handleClick}>
        <CloudinaryImage
          photo={photos[0]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    );
  }

  // Two images: split vertically (top/bottom)
  if (photos.length === 2) {
    return (
      <div 
        className={`aspect-square overflow-hidden relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="w-full h-full relative">
          {/* Single main image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-0' : 'opacity-100'}`}>
            <CloudinaryImage
              photo={photos[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Two images split vertically */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full h-full flex flex-col gap-0.5">
              <div className="relative overflow-hidden flex-1">
                <CloudinaryImage
                  photo={photos[0]}
                  alt={`${title} - Image 1`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </div>
              <div className="relative overflow-hidden flex-1">
                <CloudinaryImage
                  photo={photos[1]}
                  alt={`${title} - Image 2`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    );
  }

  // Three images: top row split, bottom full
  if (photos.length === 3) {
    return (
      <div 
        className={`aspect-square overflow-hidden relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="w-full h-full relative">
          {/* Single main image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-0' : 'opacity-100'}`}>
            <CloudinaryImage
              photo={photos[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Three images layout: top split, bottom full */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full h-full flex flex-col gap-0.5">
              {/* Top row: two images side by side */}
              <div className="flex flex-row gap-0.5 flex-1">
                <div className="relative overflow-hidden flex-1">
                  <CloudinaryImage
                    photo={photos[0]}
                    alt={`${title} - Image 1`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                </div>
                <div className="relative overflow-hidden flex-1">
                  <CloudinaryImage
                    photo={photos[1]}
                    alt={`${title} - Image 2`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                </div>
              </div>
              {/* Bottom row: one full image */}
              <div className="relative overflow-hidden flex-1">
                <CloudinaryImage
                  photo={photos[2]}
                  alt={`${title} - Image 3`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    );
  }

  // Four or more images: 2x2 quad layout
  const displayPhotos = photos.slice(0, 4);

  return (
    <div 
      className={`aspect-square overflow-hidden relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="w-full h-full relative">
  {/* Single main image */}
  <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-0' : 'opacity-100'}`}>
          <CloudinaryImage
            photo={photos[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        
  {/* Quad layout - 2x2 grid */}
  <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${showQuad ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className="relative overflow-hidden bg-white"
              >
                {displayPhotos[index] ? (
                  <CloudinaryImage
                    photo={displayPhotos[index]}
                    alt={`${title} - Image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                ) : (
                  // Empty white space for missing images
                  <div className="w-full h-full bg-white" />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    </div>
  );
}
