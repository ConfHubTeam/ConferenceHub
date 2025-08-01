import { useState, useRef, useEffect } from "react";
import CloudinaryImage from "./CloudinaryImage";
import YouTubeEmbed from "./YouTubeEmbed";
import MatterportEmbed from "./MatterportEmbed";

export default function PhotoGallery({placeDetail}) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);
  const hasYoutubeVideo = !!placeDetail.youtubeLink;
  const hasMatterport = !!placeDetail.matterportLink;
  
  // Compute total slide count (photos + video + 3D if present)
  let totalSlides = placeDetail.photos.length;
  if (hasMatterport) totalSlides += 1;
  if (hasYoutubeVideo) totalSlides += 1;
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-scroll to the selected slide when fullscreen gallery opens
  useEffect(() => {
    if (showAllPhotos && scrollRef.current) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          const { current } = scrollRef;
          const scrollAmount = current.offsetWidth * currentSlide;
          
          current.scrollTo({
            left: scrollAmount,
            behavior: 'instant' // Use instant for initial positioning
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showAllPhotos]);
  
  // Separate useEffect to handle scroll synchronization
  useEffect(() => {
    if (showAllPhotos && scrollRef.current) {
      const handleScroll = () => {
        if (scrollRef.current) {
          const { scrollLeft, offsetWidth } = scrollRef.current;
          const newSlide = Math.round(scrollLeft / offsetWidth);
          if (newSlide !== currentSlide) {
            setCurrentSlide(newSlide);
          }
        }
      };
      
      const current = scrollRef.current;
      current.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        current.removeEventListener('scroll', handleScroll);
      };
    }
  }, [showAllPhotos, currentSlide]);
  
  // Function to scroll to next or previous image/video
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' 
        ? current.scrollLeft - current.offsetWidth 
        : current.scrollLeft + current.offsetWidth;
      
      current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Don't manually update currentSlide - let the scroll event listener handle it
    }
  };
  
  // Function to directly jump to a specific slide
  const goToSlide = (index) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.offsetWidth * index;
      
      current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Don't manually update currentSlide - let the scroll event listener handle it
    }
  };

  // Full screen gallery view
  if (showAllPhotos) {
    return (
      <div className="bg-black fixed inset-0 min-h-screen z-[70]">
        <div className="bg-black p-2 md:p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <h2 className="text-white text-base md:text-2xl truncate max-w-[70%]">
              {placeDetail.title}
            </h2>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="flex cursor-pointer gap-1 py-1 px-2 items-center rounded-xl bg-white text-xs md:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 md:w-5 md:h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {isMobile ? 'Close' : 'Close photos'}
            </button>
          </div>
          
          {/* Gallery Navigation */}
          <div className="flex items-center justify-center relative flex-1 w-full">
            {totalSlides > 1 && (
              <button 
                onClick={() => scroll('left')}
                disabled={currentSlide === 0}
                className={`absolute left-0 md:left-2 z-10 p-1 md:p-2 rounded-full bg-white/30 hover:bg-white/50 transition ${
                  currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            
            {/* Main image/video container */}
            <div 
              ref={scrollRef} 
              className="flex overflow-x-auto snap-x snap-mandatory w-full h-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {/* Photos - first in order */}
              {placeDetail.photos?.map((photo, index) => (
                <div 
                  key={`photo-${index}`} 
                  className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center"
                >
                  <CloudinaryImage 
                    photo={photo} 
                    alt={`${placeDetail.title} - photo ${index+1}`} 
                    className="max-h-[80vh] max-w-full object-contain" 
                  />
                </div>
              ))}
              
              {/* 3D Matterport (if available) - second in order */}
              {hasMatterport && (
                <div 
                  className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center"
                >
                  <div className="w-full h-full max-h-[80vh] flex justify-center items-center">
                    <MatterportEmbed 
                      url={placeDetail.matterportLink} 
                      title={placeDetail.title}
                      className="w-full max-w-4xl h-full"
                    />
                  </div>
                </div>
              )}
              
              {/* YouTube Video (if available) - last in order */}
              {hasYoutubeVideo && (
                <div 
                  className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center"
                >
                  <div className="w-full h-full max-h-[80vh] flex justify-center items-center">
                    <YouTubeEmbed 
                      url={placeDetail.youtubeLink} 
                      title={placeDetail.title}
                      className="w-full max-w-4xl"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {totalSlides > 1 && (
              <button 
                onClick={() => scroll('right')}
                disabled={currentSlide === totalSlides - 1}
                className={`absolute right-0 md:right-2 z-10 p-1 md:p-2 rounded-full bg-white/30 hover:bg-white/50 transition ${
                  currentSlide === totalSlides - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Dots navigation */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-1 md:gap-2 mt-2 md:mt-4">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                    index === currentSlide ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
          
          {/* Slide indicator */}
          <div className="text-white text-center mt-1 md:mt-2 text-sm md:text-base">
            {currentSlide + 1} / {totalSlides}
          </div>
        </div>
      </div>
    );
  }

  // Regular view with thumbnail preview
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Main photo/video layout */}
      {(placeDetail.photos?.length > 0 || hasMatterport || hasYoutubeVideo) ? (
        <div className="flex flex-col">
          {/* Main image - always show the first photo if available */}
          <div className="w-full h-[250px] sm:h-[300px] md:h-[450px] overflow-hidden">
            {placeDetail.photos?.length > 0 ? (
              <CloudinaryImage
                photo={placeDetail.photos[0]}
                alt={placeDetail.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => {setShowAllPhotos(true); setCurrentSlide(0);}}
              />
            ) : hasMatterport ? (
              <MatterportEmbed
                url={placeDetail.matterportLink}
                title={placeDetail.title}
                className="w-full h-full"
              />
            ) : hasYoutubeVideo ? (
              <YouTubeEmbed
                url={placeDetail.youtubeLink}
                title={placeDetail.title}
                className="w-full h-full"
              />
            ) : null}
          </div>
          
          {/* Scrollable thumbnails for additional media */}
          {totalSlides > 1 && (
            <div className="relative mt-2">
              <div className="flex overflow-x-auto gap-2 py-2 px-1 snap-x scrollbar-hide">
                {/* Photo thumbnails */}
                {placeDetail.photos.map((photo, index) => (
                  <div 
                    key={`photo-${index}`} 
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 cursor-pointer snap-start rounded-lg overflow-hidden ${
                      index === currentSlide ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {setShowAllPhotos(true); setCurrentSlide(index);}}
                  >
                    <CloudinaryImage
                      photo={photo}
                      alt={`${placeDetail.title} thumbnail ${index+1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                
                {/* 3D Matterport thumbnail (if available) */}
                {hasMatterport && (
                  <div 
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 cursor-pointer snap-start rounded-lg overflow-hidden relative ${
                      currentSlide === placeDetail.photos.length ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {setShowAllPhotos(true); setCurrentSlide(placeDetail.photos.length);}}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-white text-xs font-medium text-center bg-black/40 rounded px-1">3D</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* YouTube video thumbnail (if available) */}
                {hasYoutubeVideo && (
                  <div 
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 cursor-pointer snap-start rounded-lg overflow-hidden relative ${
                      currentSlide === (placeDetail.photos.length + (hasMatterport ? 1 : 0)) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {setShowAllPhotos(true); setCurrentSlide(placeDetail.photos.length + (hasMatterport ? 1 : 0));}}
                  >
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 text-white">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-white text-xs font-semibold text-center bg-black/40 rounded px-1 py-0.5">
                          Video
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Left/right scroll buttons for thumbnails - hidden on small mobile */}
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-r-lg shadow hover:bg-white hidden sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  const container = e.target.closest('.relative').querySelector('.flex');
                  container.scrollBy({left: -100, behavior: 'smooth'});
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-l-lg shadow hover:bg-white hidden sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  const container = e.target.closest('.relative').querySelector('.flex');
                  container.scrollBy({left: 100, behavior: 'smooth'});
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-xl">
          <span className="text-gray-500">No photos or videos available</span>
        </div>
      )}
      
      {/* Show all photos button */}
      <button
        className="flex gap-1 absolute top-2 right-2 py-1 px-2 md:py-2 md:px-4 bg-white/80 shadow-md shadow-gray-500 rounded-lg hover:bg-white transition text-xs md:text-base z-10"
        onClick={() => {setShowAllPhotos(true); setCurrentSlide(0);}}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 md:w-6 md:h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        {isMobile ? 'Media' : 'Show all media'}
      </button>
    </div>
  );
}