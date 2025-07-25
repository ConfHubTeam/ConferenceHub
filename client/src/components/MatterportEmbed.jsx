import React, { useState, useEffect, useRef } from "react";

export default function MatterportEmbed({ url, title, className = "", isFullscreen = false, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  // Extract model ID from Matterport URL
  const extractModelId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]m=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const modelId = extractModelId(url);
  
  // Create embed URL with proper parameters
  const embedUrl = modelId 
    ? `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1&ts=1`
    : null;

  useEffect(() => {
    if (!embedUrl) {
      setError("Invalid Matterport URL");
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load 3D tour");
  };

  // Handle escape key for fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      const handleEscape = (event) => {
        if (event.key === 'Escape' && onClose) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isFullscreen, onClose]);

  if (!embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-gray-500">Invalid 3D tour link</p>
        </div>
      </div>
    );
  }

  const wrapperClass = isFullscreen 
    ? "fixed inset-0 z-[9999] bg-black"
    : `relative ${className}`;

  const iframeClass = isFullscreen
    ? "w-full h-full"
    : "w-full h-full rounded-lg";

  return (
    <div className={wrapperClass}>
      {/* Fullscreen overlay controls */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              <span className="font-medium">3D Virtual Tour</span>
              {title && <span className="text-gray-300">• {title}</span>}
            </div>
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm">Close (ESC)</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading 3D tour...
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
          <div className="text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-red-400 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-red-500 font-medium mb-2">Failed to load 3D tour</p>
            <p className="text-gray-500 text-sm">Please check the Matterport link and try again</p>
          </div>
        </div>
      )}

      {/* Matterport iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={`3D Virtual Tour${title ? ` - ${title}` : ''}`}
        className={iframeClass}
        frameBorder="0"
        allowFullScreen
        allow="xr-spatial-tracking; gyroscope; accelerometer"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ 
          minHeight: isFullscreen ? '100vh' : '400px',
          border: 'none'
        }}
      />
    </div>
  );
}
