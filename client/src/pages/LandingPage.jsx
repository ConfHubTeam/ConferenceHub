import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { ChevronRightIcon, StarIcon, UserGroupIcon, CalendarIcon, PresentationChartBarIcon, WifiIcon, CameraIcon } from "@heroicons/react/24/outline";

export default function LandingPage() {
  const { user, isReady } = useContext(UserContext);
  const navigate = useNavigate();

  // Redirect authenticated users to the main places page
  useEffect(() => {
    if (isReady && user) {
      navigate("/");
    }
  }, [user, isReady, navigate]);

  // Show loading while checking authentication
  if (!isReady) {
    return (
      <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Don't render the landing page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('public/conference_background.jpg')"
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Gradient overlay to blend with your brand colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 via-orange-400/15 to-brand-purple/20"></div>
        
        {/* Additional glassmorphism overlay */}
        <div className="absolute inset-0 backdrop-blur-[0.5px]"></div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 z-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-brand-orange/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header with Logo */}
      <header className="relative z-20 p-4 md:p-6">
        <div className="flex justify-center">
          <div className="relative group">
            {/* Glow effect behind logo */}
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/20 via-white/30 to-purple-400/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Main logo container */}
            <div className="relative bg-gradient-to-br from-white/15 via-white/20 to-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-5 shadow-2xl border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-300/10 via-transparent to-purple-300/10 rounded-2xl"></div>
              
              <img 
                src="/getSpace_logo.png" 
                alt="GetSpace" 
                className="relative z-10 h-12 md:h-16 lg:h-18 w-auto object-contain filter drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 lg:px-8 py-1">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 md:mb-4 leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Conference Space
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xs sm:text-base md:text-lg lg:text-xl text-white/90 mb-2 sm:mb-3 md:mb-6 max-w-2xl mx-auto leading-relaxed px-1 sm:px-2">
              Book professional conference rooms and meeting spaces for your next event or business gathering
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center items-center mb-4 sm:mb-4 md:mb-8 max-w-md mx-auto">
              <Link
                to="/places"
                className="group relative overflow-hidden backdrop-blur-md border border-white/30 text-white px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center gap-1 sm:gap-2 shadow-xl hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-white/20 via-white/30 to-white/20 hover:from-white/30 hover:via-white/40 hover:to-white/30 flex-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Explore Spaces</span>
                <ChevronRightIcon className="w-3 sm:w-4 h-3 sm:h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              
              <Link
                to="/login"
                className="group relative overflow-hidden backdrop-blur-md border border-white/30 text-white px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-white/20 via-white/30 to-white/20 hover:from-white/30 hover:via-white/40 hover:to-white/30 flex-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Become a Host</span>
              </Link>
            </div>

            {/* Feature Cards - Mobile: 2 columns, Larger screens: 3 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <PresentationChartBarIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">Premium Venues</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Professional conference spaces</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <UserGroupIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">Expert Support</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Dedicated host support</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <CalendarIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">Flexible Booking</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Book by hour or day</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <WifiIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">High-Speed WiFi</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Reliable internet</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <CameraIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">AV Equipment</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Professional audio-visual</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 lg:p-4 hover:bg-white/15 transition-all duration-300 shadow-xl">
                <StarIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[10px] sm:text-xs lg:text-base mb-0.5 sm:mb-1">5-Star Service</h3>
                <p className="text-white/80 text-[8px] sm:text-xs lg:text-sm leading-tight">Exceptional service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
