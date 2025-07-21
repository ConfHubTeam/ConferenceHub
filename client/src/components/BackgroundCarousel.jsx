import { useEffect, useState } from "react";

/**
 * Reusable Background Carousel Component
 * Follows SOLID principles - Single Responsibility for background image management
 */
export default function BackgroundCarousel({ 
  images, 
  interval = 5000, 
  overlayColor = "from-brand-orange/30 via-purple-900/40 to-brand-purple/50",
  filterStyle = "sepia(20%) saturate(120%) hue-rotate(15deg) brightness(0.8)",
  onImageChange
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const newIndex = (prev + 1) % images.length;
        if (onImageChange) {
          onImageChange(newIndex);
        }
        return newIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval, onImageChange]);

  if (!images || images.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-brand-orange to-brand-purple"></div>
    );
  }

  return (
    <>
      {/* Background Images */}
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className={`fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out z-0 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ 
            backgroundImage: `url(${image})`,
            filter: filterStyle
          }}
          role="img"
          aria-label={`Background image ${index + 1} of ${images.length}`}
        />
      ))}

      {/* Gradient Overlay */}
      <div className={`fixed inset-0 bg-gradient-to-br ${overlayColor} z-10`}></div>
      <div className="fixed inset-0 bg-black/20 z-10"></div>
    </>
  );
}
