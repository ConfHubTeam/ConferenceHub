import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TutorialPage = () => {
  const navigate = useNavigate();
  const { t, ready } = useTranslation("tutorial");
  const [visibleBlocks, setVisibleBlocks] = useState(new Set());
  const blockRefs = useRef([]);
  const observerRef = useRef(null);

  // Enhanced Intersection Observer for sequential scroll animations
  useEffect(() => {
    if (!ready) return;

    // Clear any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const blockIndex = parseInt(entry.target.dataset.blockIndex);
            if (!isNaN(blockIndex)) {
              // Add the block to visible set when it comes into view
              setVisibleBlocks((prev) => new Set([...prev, blockIndex]));
            }
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before the element is fully in view
      }
    );

    // Wait for refs to be set, then observe all elements
    const observeTimer = setTimeout(() => {
      blockRefs.current.forEach((ref) => {
        if (ref && observerRef.current) {
          observerRef.current.observe(ref);
        }
      });
    }, 100);

    return () => {
      clearTimeout(observeTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [ready]);

  // Show loading state if translations are not ready
  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#1A2233] text-xl font-montserrat">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Back Button - always visible and sticky */}
      <div className="fixed top-20 left-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-lg hover:shadow-xl text-[#1A2233] font-semibold text-base transition-all duration-300 hover:scale-105 border border-gray-100 backdrop-blur-sm"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {t("navigation.back")}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 px-4">
        {/* Hero Content */}
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img
              src="/getSpace_logo.png"
              alt="GetSpace"
              className="h-12 md:h-16 lg:h-20 w-auto object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(15%) sepia(25%) saturate(1200%) hue-rotate(210deg) brightness(94%) contrast(96%)",
              }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1A2233] mb-4 font-montserrat">
            {t("page.title")}
          </h1>
          <h2 className="text-xl md:text-2xl text-[#1A2233] mb-2 font-montserrat font-medium max-w-4xl mx-auto leading-relaxed">
            {t("page.subtitle")}
          </h2>
        </div>
      </div>

      {/* Navy divider line */}
      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="w-96 h-1 bg-[#1A2233] mx-auto rounded-full"></div>
        </div>
      </div>

      {/* Tutorial Videos Section */}
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Client Tutorial */}
          <div
            ref={(el) => (blockRefs.current[0] = el)}
            data-block-index={0}
            className={`transform transition-all duration-1000 ease-out ${
              visibleBlocks.has(0)
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-20 opacity-0 scale-95"
            }`}
          >
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#1A2233] mb-6 text-center font-montserrat">
                {t("page.clientTutorial.title")}
              </h3>
              <p className="text-base md:text-lg text-[#2C3650] leading-relaxed font-montserrat text-center mb-8 px-2 md:px-0">
                {t("page.clientTutorial.description")}
              </p>

              {/* YouTube Video Embed */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/-1MLyAhxUNI?${new URLSearchParams({
                    autoplay: '0',
                    rel: '0',
                    modestbranding: '1',
                    playsinline: '1',
                    enablejsapi: '1',
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                    widget_referrer: typeof window !== 'undefined' ? window.location.href : '',
                    iv_load_policy: '3',
                    fs: '1',
                    controls: '1',
                    disablekb: '0'
                  }).toString()}`}
                  title="Client Tutorial - How to Find and Book Spaces"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Host Tutorial */}
          <div
            ref={(el) => (blockRefs.current[1] = el)}
            data-block-index={1}
            className={`transform transition-all duration-1000 ease-out ${
              visibleBlocks.has(1)
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-20 opacity-0 scale-95"
            }`}
          >
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-[#1A2233] mb-6 text-center font-montserrat">
                {t("page.hostTutorial.title")}
              </h3>
              <p className="text-base md:text-lg text-[#2C3650] leading-relaxed font-montserrat text-center mb-8 px-2 md:px-0">
                {t("page.hostTutorial.description")}
              </p>

              {/* YouTube Video Embed */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/ET8TuBnBldI?${new URLSearchParams({
                    autoplay: '0',
                    rel: '0',
                    modestbranding: '1',
                    playsinline: '1',
                    enablejsapi: '1',
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                    widget_referrer: typeof window !== 'undefined' ? window.location.href : '',
                    iv_load_policy: '3',
                    fs: '1',
                    controls: '1',
                    disablekb: '0'
                  }).toString()}`}
                  title="Host Tutorial - How to List Your Space"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Additional Features Info */}
          <div
            ref={(el) => (blockRefs.current[2] = el)}
            data-block-index={2}
            className={`transform transition-all duration-1000 ease-out ${
              visibleBlocks.has(2)
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-20 opacity-0 scale-95"
            }`}
          >
            <div className="bg-gradient-to-br from-[#1A2233] to-[#2C3650] rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center font-montserrat">
                {t("page.features.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 font-montserrat">
                    {t("page.features.search.title")}
                  </h4>
                  <p className="text-white/90 text-sm leading-relaxed font-montserrat">
                    {t("page.features.search.description")}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">📅</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 font-montserrat">
                    {t("page.features.booking.title")}
                  </h4>
                  <p className="text-white/90 text-sm leading-relaxed font-montserrat">
                    {t("page.features.booking.description")}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 font-montserrat">
                    {t("page.features.payment.title")}
                  </h4>
                  <p className="text-white/90 text-sm leading-relaxed font-montserrat">
                    {t("page.features.payment.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="py-16 px-4 bg-[#1A2233]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-300 font-montserrat">
            {t("page.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
