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
    <div className="h-screen relative flex flex-col overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1626107095942-6f05cfbb97ab?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="fixed inset-0 bg-black/30"></div>
        
        {/* Gradient overlay to blend with your brand colors */}
        <div className="fixed inset-0 bg-gradient-to-br from-brand-orange/20 via-orange-400/15 to-brand-purple/20"></div>
        
        {/* Additional glassmorphism overlay */}
        <div className="fixed inset-0 backdrop-blur-[0.5px]"></div>
      </div>

      {/* Background decorative elements */}
      <div className="fixed inset-0 z-5">
        <div className="fixed top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="fixed top-40 right-20 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl"></div>
        <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-brand-orange/30 rounded-full blur-3xl"></div>
      </div>

      {/* Professional Header with Logo */}
      <header className="relative z-20 w-full">
        <div className="flex justify-center pt-6 sm:pt-8 md:pt-10 lg:pt-12">
          <div className="relative group">
            {/* Subtle glow effect */}
            <div className="absolute -inset-3 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            {/* Logo container with professional glassmorphism */}
            <div className="relative bg-white/25 backdrop-blur-xl rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 shadow-2xl border border-white/40 hover:border-white/50 transition-all duration-300 hover:scale-[1.02]">
              {/* Inner subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 rounded-2xl"></div>
              
              <img 
                src="/getSpace_logo.png" 
                alt="GetSpace" 
                className="relative z-10 h-6 sm:h-7 md:h-8 lg:h-9 w-auto object-contain filter drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 md:py-8 min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-center">
          <div className="text-center w-full space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
            {/* Main Heading */}
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Conference Space
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed px-1 sm:px-2">
              Book professional conference rooms and meeting spaces for your next event or business gathering
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row gap-1.5 sm:gap-2 md:gap-3 justify-center items-center max-w-md mx-auto">
              <Link
                to="/places"
                className="group relative overflow-hidden backdrop-blur-md border border-white/30 text-white px-2.5 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-md sm:rounded-lg md:rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 shadow-xl hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-white/20 via-white/30 to-white/20 hover:from-white/30 hover:via-white/40 hover:to-white/30 w-full sm:w-auto min-w-[100px] sm:min-w-[120px] flex-1 sm:flex-initial"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Explore Spaces</span>
                <ChevronRightIcon className="w-2.5 sm:w-3 md:w-4 h-2.5 sm:h-3 md:h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              
              <Link
                to="/login"
                className="group relative overflow-hidden backdrop-blur-md border border-white/30 text-white px-2.5 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-md sm:rounded-lg md:rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 bg-gradient-to-r from-white/20 via-white/30 to-white/20 hover:from-white/30 hover:via-white/40 hover:to-white/30 w-full sm:w-auto min-w-[100px] sm:min-w-[120px] flex-1 sm:flex-initial"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Become a Host</span>
              </Link>
            </div>

            {/* Feature Cards - Mobile: 2 columns, Larger screens: 3 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <PresentationChartBarIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">Premium Venues</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Professional conference spaces</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <UserGroupIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">Expert Support</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Dedicated host support</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <CalendarIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">Flexible Booking</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Book by hour or day</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <WifiIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">High-Speed WiFi</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Reliable internet</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <CameraIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">AV Equipment</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Professional audio-visual</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-sm sm:rounded-md md:rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-white/15 transition-all duration-300 shadow-xl hover:scale-105">
                <StarIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-white mb-0.5 sm:mb-1 mx-auto" />
                <h3 className="text-white font-semibold text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mb-0.5">5-Star Service</h3>
                <p className="text-white/80 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">Exceptional service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
