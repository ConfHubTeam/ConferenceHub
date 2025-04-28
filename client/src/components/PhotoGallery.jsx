import { useState, useRef, useEffect } from "react";
import CloudinaryImage from "./CloudinaryImage";

export default function PhotoGallery({placeDetail}) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Function to scroll to next or previous image
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
      
      // Update current slide indicator
      const newSlide = direction === 'left' 
        ? Math.max(0, currentSlide - 1)
        : Math.min(placeDetail.photos.length - 1, currentSlide + 1);
      setCurrentSlide(newSlide);
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
      
      setCurrentSlide(index);
    }
  };

  // Full screen gallery view
  if (showAllPhotos) {
    return (
      <div className="bg-black fixed inset-0 min-h-screen z-50">
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
            {placeDetail.photos?.length > 1 && (
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
            
            {/* Main image container */}
            <div 
              ref={scrollRef} 
              className="flex overflow-x-auto snap-x snap-mandatory w-full h-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {placeDetail.photos?.map((photo, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center"
                >
                  <CloudinaryImage 
                    photo={photo} 
                    alt={`${placeDetail.title} - photo ${index+1}`} 
                    className="max-h-[80vh] max-w-full object-contain" 
                  />
                </div>
              ))}
            </div>
            
            {placeDetail.photos?.length > 1 && (
              <button 
                onClick={() => scroll('right')}
                disabled={currentSlide === placeDetail.photos.length - 1}
                className={`absolute right-0 md:right-2 z-10 p-1 md:p-2 rounded-full bg-white/30 hover:bg-white/50 transition ${
                  currentSlide === placeDetail.photos.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Dots navigation */}
          {placeDetail.photos?.length > 1 && (
            <div className="flex justify-center gap-1 md:gap-2 mt-2 md:mt-4">
              {placeDetail.photos.map((_, index) => (
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
          
          {/* Photo counter */}
          <div className="text-white text-center mt-1 md:mt-2 text-sm md:text-base">
            {currentSlide + 1} / {placeDetail.photos?.length}
          </div>
        </div>
      </div>
    );
  }

  // Regular view with thumbnail preview
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Main photo layout */}
      {placeDetail.photos?.length > 0 ? (
        <div className="flex flex-col">
          {/* Main image - always larger */}
          <div className="w-full h-[250px] sm:h-[300px] md:h-[450px] overflow-hidden">
            <CloudinaryImage
              photo={placeDetail.photos[0]}
              alt={placeDetail.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {setShowAllPhotos(true); setCurrentSlide(0);}}
            />
          </div>
          
          {/* Scrollable thumbnails for additional photos */}
          {placeDetail.photos?.length > 1 && (
            <div className="relative mt-2">
              <div className="flex overflow-x-auto gap-2 py-2 px-1 snap-x scrollbar-hide">
                {placeDetail.photos.map((photo, index) => (
                  <div 
                    key={index} 
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
          <span className="text-gray-500">No photos available</span>
        </div>
      )}
      
      {/* Show all photos button */}
      <button
        className="flex gap-1 absolute top-2 right-2 py-1 px-2 md:py-2 md:px-4 bg-white/80 shadow-md shadow-gray-500 rounded-lg hover:bg-white transition text-xs md:text-base"
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
        {isMobile ? 'Photos' : 'Show all photos'}
      </button>
    </div>
  );
}