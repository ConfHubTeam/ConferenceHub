import { useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import BackgroundCarousel from "../components/BackgroundCarousel";
import LandingHeader from "../components/LandingHeader";
import SearchFilter from "../components/SearchFilter";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";
import "../styles/landing.css";

// Configuration for professional conference and business event space images
// Using local images from landingpage directory for better performance and consistency
const SPACE_IMAGES = [
  "/images/landingpage/1.jpg", // Professional business conference setting
  "/images/landingpage/2.jpeg", // Modern coworking business center
  "/images/landingpage/3.jpg", // Executive meeting space
  "/images/landingpage/4.jpg", // Contemporary workspace
  "/images/landingpage/5.png", // Modern rendered workspace view
  "/images/landingpage/6.jpg", // Professional podcast/meeting setup
  "/images/landingpage/7.jpg" // Business meeting environment
];

/**
 * Landing Page Component with Robust Translation
 * Follows SOLID principles - Dependency Inversion and Open/Closed Principle
 * Enhanced with custom styling and better UX
 */
function LandingPageBase() {
  const { user, isReady } = useContext(UserContext);
  const navigate = useNavigate();
  const { t, ready } = useTranslation(["landing", "common"]);

  // Loading state with enhanced styling
  if (!isReady || !ready) {
    return (
      <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-accent-primary to-navy-900">
        <div className="loading-gradient rounded-full h-16 w-16 relative">
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
        <p className="text-white mt-4 text-lg font-medium">
          {ready ? t("landing:hero.loading") : "Loading GetSpace..."}
        </p>
      </div>
    );
  }

  /**
   * Handle search submission with enhanced UX
   * @param {Object} searchData - Search parameters including date/time data
   */
  const handleSearch = (searchData) => {
    const { dates, startTime, endTime, price, attendees, size } = searchData;
    
    // Build URL parameters
    const params = new URLSearchParams();
    if (dates) params.set('dates', dates);
    if (startTime) params.set('startTime', startTime);  
    if (endTime) params.set('endTime', endTime);
    if (price && price !== 'Any price') params.set('price', price);
    if (attendees) params.set('attendees', attendees);
    if (size) params.set('size', size);
    
    navigate(`/places?${params.toString()}`);
  };

  return (
    <div className="h-screen relative flex flex-col overflow-hidden smooth-scroll">
      {/* Background Carousel with Enhanced Styling */}
      <BackgroundCarousel 
        images={SPACE_IMAGES}
        interval={6000}
        overlayColor="from-accent-primary/15 via-navy-700/20 to-navy-900/25"
        filterStyle="sepia(8%) saturate(110%) hue-rotate(210deg) brightness(0.88) contrast(1.1)"
      />

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent-highlight/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-navy-700/10 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
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
            {t("landing:hero.title_line_1")}
          </h1>
          <h2 
            className="hero-title font-bold text-white leading-none tracking-tight mb-4 slide-up-animation delay-200"
            style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            {t("landing:hero.title_line_2")}
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
                attendees: "Add attendees",
                size: "Any size"
              }}
              initialValues={{
                when: "",
                price: "",
                attendees: "",
                size: ""
              }}
              className=""
            />
          </div>
        </section>
      </main>

      {/* Background footer covering 30% of the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] z-20 bg-gradient-to-t from-navy-900/80 via-navy-800/50 to-transparent"></div>
      
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
          {t("landing:hero.title_line_1")}
        </h1>
        <h2 
          className="hero-title font-bold text-white leading-none tracking-tight slide-up-animation delay-200"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          {t("landing:hero.title_line_2")}
        </h2>
      </div>
      
    </div>
  );
}

// Enhanced LandingPage with route-based translation loading
export default withTranslationLoading(LandingPageBase, {
  namespaces: ["landing", "common", "navigation"],
  preloadNamespaces: ["places", "search"],
  loadingComponent: ({ children, ...props }) => (
    <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-accent-primary to-navy-900">
      <div className="loading-gradient rounded-full h-16 w-16 relative">
        <div className="absolute inset-2 bg-white rounded-full animate-pulse"></div>
      </div>
      <p className="text-white mt-4 text-lg font-medium animate-pulse">Loading GetSpace...</p>
    </div>
  ),
  errorComponent: ({ error, retry, ...props }) => (
    <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-accent-primary to-navy-900">
      <div className="text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Translation Error</h2>
        <p className="mb-4">Failed to load translations</p>
        <button 
          onClick={retry}
          className="bg-white text-accent-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
});
