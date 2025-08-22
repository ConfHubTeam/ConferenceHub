import { useState } from "react";
import CloudinaryImage from "./CloudinaryImage";

export default function ImageHoverQuadSquare({ photos, title, className = "" }) {
  const [isHovered, setIsHovered] = useState(false);

  // If only one photo or no photos, just show the single image without quad effect
  if (!photos || photos.length <= 1) {
    return (
      <div className={`aspect-square overflow-hidden relative ${className}`}>
        {photos?.length > 0 ? (
          <CloudinaryImage
            photo={photos[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    );
  }

  // Get up to 4 photos for the quad display
  const displayPhotos = photos.slice(0, 4);

  return (
    <div 
      className={`aspect-square overflow-hidden relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full h-full relative">
        {/* Single main image - always present */}
        <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <CloudinaryImage
            photo={photos[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Quad layout - fades in on hover */}
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
        
        {/* Gradient overlay for IndexPage style */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    </div>
  );
}
