import { useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import BackgroundCarousel from "../components/BackgroundCarousel";
import LandingHeader from "../components/LandingHeader";
import SearchFilter from "../components/SearchFilter";
import "../styles/landing.css";

// Configuration for event space images
const SPACE_IMAGES = [
  "https://images.unsplash.com/photo-1582192730841-2a682d7375f9?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Conference setup with presenter
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Audience in event space
  "https://images.unsplash.com/photo-1607952885616-557c53a641c0?q=80&w=1626&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"  // Modern event hall setup
];

/**
 * Landing Page Component
 * Follows SOLID principles - Dependency Inversion and Open/Closed Principle
 * Enhanced with custom styling and better UX
 */
export default function LandingPage() {
  const { user, isReady } = useContext(UserContext);
  const navigate = useNavigate();

  // Loading state with enhanced styling
  if (!isReady) {
    return (
      <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-brand-orange to-brand-purple">
        <div className="loading-gradient rounded-full h-16 w-16 relative">
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
        <p className="text-white mt-4 text-lg font-medium">Loading GetSpace...</p>
      </div>
    );
  }

  /**
   * Handle search submission with enhanced UX
   * @param {Object} searchData - Search parameters including date/time data
   */
  const handleSearch = (searchData) => {
    const { dates, startTime, endTime, price, attendance, size } = searchData;
    
    // Build URL parameters
    const params = new URLSearchParams();
    if (dates) params.set('dates', dates);
    if (startTime) params.set('startTime', startTime);  
    if (endTime) params.set('endTime', endTime);
    if (price && price !== 'Any price') params.set('price', price);
    if (attendance) params.set('attendance', attendance);
    if (size) params.set('size', size);
    
    navigate(`/places?${params.toString()}`);
  };

  return (
    <div className="h-screen relative flex flex-col overflow-hidden smooth-scroll">
      {/* Background Carousel with Enhanced Styling */}
      <BackgroundCarousel 
        images={SPACE_IMAGES}
        interval={5000}
        overlayColor="from-brand-orange/10 via-purple-900/15 to-brand-purple/20"
        filterStyle="sepia(5%) saturate(115%) hue-rotate(5deg) brightness(0.95)"
      />

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <LandingHeader user={user} />

      {/* Main Content - Restructured layout */}
      <main className="relative z-40 flex-1 flex flex-col px-6 max-w-7xl mx-auto w-full">
        {/* Large print for mobile - Appears before filter on mobile */}
        <div className="relative z-50 mt-10 mb-6 md:hidden">
          <h1 
            id="mobile-hero-heading"
            className="hero-title font-bold text-white mb-2 leading-none tracking-tight slide-up-animation"
            style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            Find a space.
          </h1>
          <h2 
            className="hero-title font-bold text-white leading-none tracking-tight mb-4 slide-up-animation delay-200"
            style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            Fulfill your vision.
          </h2>
        </div>
        
        {/* Search Section */}
        <section aria-label="Search for spaces" className="relative z-50 mt-4 lg:mt-12 mb-4">
          <div className="bg-transparent zoom-out-animation">
            <SearchFilter 
              onSearch={handleSearch}
              placeholder={{
                when: "Anytime",
                price: "Any price",
                attendance: "Number of attendees",
                size: "Conference size"
              }}
              initialValues={{
                when: "",
                price: "",
                attendance: "",
                size: ""
              }}
              className=""
            />
          </div>
        </section>
      </main>

      {/* Background footer covering 30% of the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] z-20 bg-gradient-to-t from-black/80 via-brand-purple/50 to-transparent"></div>
      
      {/* Large print on bottom left - Hidden on mobile */}
      <div className="absolute bottom-16 left-8 z-40 hidden md:block">
        <h1 
          id="hero-heading"
          className="hero-title font-bold text-white mb-4 leading-none tracking-tight slide-up-animation"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          Find a space.
        </h1>
        <h2 
          className="hero-title font-bold text-white leading-none tracking-tight slide-up-animation delay-200"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          Fulfill your vision.
        </h2>
      </div>
      
    </div>
  );
}
