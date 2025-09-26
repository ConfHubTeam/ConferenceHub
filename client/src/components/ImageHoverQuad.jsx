import { useState, useEffect, useRef } from "react";
import CloudinaryImage from "./CloudinaryImage";

export default function ImageHoverQuad({ photos, title, className = "" }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Track mobile viewport
  useEffect(() => {
    const handler = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Handle touch events for swiping
  const handleTouchStart = (e) => {
    if (!isMobile || photos.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isMobile || photos.length <= 1) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile || photos.length <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev + 1) % photos.length);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    }
  };

  // Handle no photos case
  if (!photos || photos.length === 0) {
    return (
      <div className={`relative aspect-[4/3] overflow-hidden ${className}`}>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  // If only one photo, show single image without hover effect
  if (photos.length === 1) {
    return (
      <div className={`relative aspect-[4/3] overflow-hidden ${className}`}>
        <CloudinaryImage
          photo={photos[0]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  // Mobile: Show swipeable single images
  if (isMobile && photos.length > 1) {
    return (
      <div 
        className={`relative aspect-[4/3] overflow-hidden ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CloudinaryImage
          photo={photos[currentImageIndex]}
          alt={`${title} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300 ease-out"
        />
        
        {/* Image indicator dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Two images: split vertically (top/bottom)
  if (photos.length === 2) {
    return (
      <div 
        className={`relative aspect-[4/3] overflow-hidden ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full relative">
          {/* Single main image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <CloudinaryImage
              photo={photos[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Two images split vertically */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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
      </div>
    );
  }

  // Three images: top row split, bottom full
  if (photos.length === 3) {
    return (
      <div 
        className={`relative aspect-[4/3] overflow-hidden ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full h-full relative">
          {/* Single main image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <CloudinaryImage
              photo={photos[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Three images layout: top split, bottom full */}
          <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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
      </div>
    );
  }

  // Four or more images: 2x2 quad layout
  const displayPhotos = photos.slice(0, 4);

  return (
    <div 
      className={`relative aspect-[4/3] overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full h-full relative">
        {/* Single main image */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <CloudinaryImage
            photo={photos[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Quad layout - 2x2 grid */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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
      </div>
    </div>
  );
}
