import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AboutPage = () => {
  const navigate = useNavigate();
  const { t, ready } = useTranslation("about");
  const [visibleBlocks, setVisibleBlocks] = useState(new Set());
  const blockRefs = useRef([]);
  const observerRef = useRef(null);

  const featureColors = [
    "from-blue-500 to-blue-600", 
    "from-green-500 to-green-600", 
    "from-yellow-500 to-yellow-600"
  ];
  const featureIcons = ["🏢", "📱", "⚙️"];
  
  // Get features and body blocks safely with fallback
  const features = ready ? t("page.features", { returnObjects: true }) : [];
  const safeFeatures = Array.isArray(features) ? features : [];
  
  // Try different approaches to get body blocks
  let safeBodyBlocks = [];
  
  if (ready) {
    try {
      // First try: direct array access
      const bodyBlocks = t("page.bodyBlocks", { returnObjects: true });
      if (Array.isArray(bodyBlocks)) {
        safeBodyBlocks = bodyBlocks;
      } else {
        // Second try: access individual indices
        const blocks = [];
        for (let i = 0; i < 5; i++) { // Try up to 5 blocks
          const block = t(`page.bodyBlocks.${i}`, { defaultValue: null });
          if (block && block !== `page.bodyBlocks.${i}`) {
            blocks.push(block);
          } else {
            break;
          }
        }
        safeBodyBlocks = blocks;
      }
    } catch (error) {
      console.error("Error getting body blocks:", error);
      safeBodyBlocks = [];
    }
  }

  // Debug logging
  console.log("Ready:", ready);
  console.log("Safe body blocks:", safeBodyBlocks);
  console.log("Block count:", safeBodyBlocks.length);

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
              setVisibleBlocks(prev => new Set([...prev, blockIndex]));
            }
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before the element is fully in view
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
  }, [ready, safeBodyBlocks.length, safeFeatures.length]);

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
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          {t("navigation.back")}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 px-4">

        {/* Hero Content */}
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-[#1A2233] mb-6 font-montserrat leading-tight">
            GetSpace
          </h1>
          <h2 className="text-2xl md:text-3xl text-[#2C3650] mb-2 font-montserrat font-medium max-w-4xl mx-auto leading-relaxed">
            {t("page.subtitle")}
          </h2>
        </div>
      </div>

      {/* Content Blocks Section */}
      <div className="py-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Navy divider line - twice as long and very close to hero section */}
          <div className="w-96 h-1 bg-[#1A2233] mx-auto mb-16 rounded-full"></div>
          
          <div className="space-y-16">
            {safeBodyBlocks.length > 0 ? safeBodyBlocks.map((block, index) => {
              const getImages = (idx) => {
                const imageGroups = [
                                      // Paragraph 1: Venues and spaces
                    [
                      {
                        src: "https://plus.unsplash.com/premium_photo-1661879435429-a396d927c686?w=150&h=150&fit=crop&crop=center&auto=format&q=80",
                        alt: "Modern meeting room design concept"
                      },
                      {
                        src: "https://plus.unsplash.com/premium_photo-1680807988328-7ba28ad24d9f?w=150&h=150&fit=crop&crop=center&auto=format&q=80",
                        alt: "Large auditorium with rows of blue chairs"
                      },
                      {
                        src: "https://plus.unsplash.com/premium_photo-1664391631217-d53431f0effd?w=150&h=150&fit=crop&crop=center&auto=format&q=80",
                        alt: "Large banquet hall with tables and chairs"
                      }
                    ],
                  // Paragraph 2: Search and booking
                  [
                    {
                      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Digital search interface"
                    },
                    {
                      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Online booking system"
                    },
                    {
                      src: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Mobile app interface"
                    }
                  ],
                  // Paragraph 3: Mission and freedom
                  [
                    {
                      src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Team collaboration"
                    },
                    {
                      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Creative workspace"
                    },
                    {
                      src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                      alt: "Celebration event"
                    }
                  ]
                ];
                return imageGroups[idx] || imageGroups[0];
              };

              return (
                <div
                  key={index}
                  ref={el => blockRefs.current[index] = el}
                  data-block-index={index}
                  className={`transform transition-all duration-1000 ease-out ${
                    visibleBlocks.has(index) 
                      ? 'translate-y-0 opacity-100 scale-100' 
                      : 'translate-y-20 opacity-0 scale-95'
                  }`}
                >
                  <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                    {/* Three centered rounded images */}
                    <div className="flex justify-center gap-6 md:gap-8 lg:gap-12 mb-6 md:mb-8">
                      {getImages(index).map((image, imgIdx) => (
                        <div key={imgIdx} className="transform hover:scale-110 transition-transform duration-300">
                          <img 
                            src={image.src}
                            alt={image.alt}
                            className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover shadow-lg border-2 border-gray-100"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-base md:text-lg lg:text-xl text-[#2C3650] leading-relaxed font-montserrat text-center px-2 md:px-0">
                      {block}
                    </p>
                  </div>
                </div>
              );
            }) : (
            /* Direct fallback blocks with animation */
            <>
              {[0, 1, 2].map((index) => {
                const getImages = (idx) => {
                  const imageGroups = [
                    // Paragraph 1: Venues and spaces
                    [
                      {
                        src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Professional conference room"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Modern meeting space"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Photo studio"
                      }
                    ],
                    // Paragraph 2: Search and booking
                    [
                      {
                        src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Digital search interface"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Online booking system"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Mobile app interface"
                      }
                    ],
                    // Paragraph 3: Mission and freedom
                    [
                      {
                        src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Team collaboration"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Creative workspace"
                      },
                      {
                        src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=120&h=120&fit=crop&crop=center&auto=format&q=80",
                        alt: "Celebration event"
                      }
                    ]
                  ];
                  return imageGroups[idx] || imageGroups[0];
                };

                return (
                  <div 
                    key={`fallback-${index}`}
                    ref={el => blockRefs.current[index] = el}
                    data-block-index={index}
                    className={`transform transition-all duration-1000 ease-out ${
                      visibleBlocks.has(index) 
                        ? 'translate-y-0 opacity-100 scale-100' 
                        : 'translate-y-20 opacity-0 scale-95'
                    }`}
                  >
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                      {/* Three centered rounded images */}
                      <div className="flex justify-center gap-6 md:gap-8 lg:gap-12 mb-6 md:mb-8">
                        {getImages(index).map((image, imgIdx) => (
                          <div key={imgIdx} className="transform hover:scale-110 transition-transform duration-300">
                            <img 
                              src={image.src}
                              alt={image.alt}
                              className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover shadow-lg border-2 border-gray-100"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-base md:text-lg lg:text-xl text-[#2C3650] leading-relaxed font-montserrat text-center px-2 md:px-0">
                        {index === 0 && (t("page.bodyBlocks.0") || "We have gathered the best venues in the city: from stylish conference halls and cozy offices to photo studios, podcast and interview studios, as well as unique locations for creative and business events. Want to hold a business meeting, organize a training, record a podcast, or have a photo shoot? You can find it all with us.")}
                        {index === 1 && (t("page.bodyBlocks.1") || "Convenient search filters, real photos, and up-to-date prices make the selection and booking process fast and transparent. You compare venues online and book in a few clicks — easily, safely, and without unnecessary calls.")}
                        {index === 2 && (t("page.bodyBlocks.2") || "The mission of GetSpace is to give people the freedom to find the perfect space for any moment in life: work, creativity, or celebration.")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {safeFeatures.map((feature, idx) => (
              <div 
                key={idx}
                ref={el => blockRefs.current[(safeBodyBlocks.length > 0 ? safeBodyBlocks.length : 3) + idx] = el}
                data-block-index={(safeBodyBlocks.length > 0 ? safeBodyBlocks.length : 3) + idx}
                className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-1000 transform hover:-translate-y-2 border border-gray-100 ${
                  visibleBlocks.has((safeBodyBlocks.length > 0 ? safeBodyBlocks.length : 3) + idx) 
                    ? 'translate-y-0 opacity-100 scale-100' 
                    : 'translate-y-16 opacity-0 scale-95'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${featureColors[idx]} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{featureIcons[idx]}</span>
                </div>
                <h4 className="text-xl font-bold text-[#1A2233] mb-4 text-center font-montserrat">
                  {feature.title}
                </h4>
                <p className="text-[#2C3650] text-center leading-relaxed font-montserrat">
                  {feature.description}
                </p>
              </div>
            ))}
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

export default AboutPage;
