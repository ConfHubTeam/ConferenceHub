import React, { useState } from "react";

/**
 * PlacePerks Component
 * 
 * Displays the perks/amenities of a conference room grouped by categories
 * with compact, modern UI/UX styling and expandable sections.
 */
function PlacePerks({ perks }) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  if (!perks || perks.length === 0) {
    return null;
  }

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Perk groups with their icons and options (matching PerkSelections.jsx)
  const perkGroups = [
    {
      name: "Audio Equipment",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      ),
      color: "red",
      options: [
        { name: "speakerMic", label: "Speaker microphone" },
        { name: "backupMic", label: "Backup microphone" },
        { name: "speaker", label: "Speaker" },
        { name: "mixer", label: "Mixer" },
        { name: "soundControl", label: "Sound control panel" },
        { name: "amplifier", label: "Amplifier" },
        { name: "acoustic", label: "Room acoustic treatment" }
      ]
    },
    {
      name: "Visual Equipment",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: "blue",
      options: [
        { name: "projector", label: "Projector" },
        { name: "ledScreen", label: "LED screen" },
        { name: "projectorScreen", label: "Projector screen" },
        { name: "hdmiCable", label: "HDMI cable" },
        { name: "vgaCable", label: "VGA cable" },
        { name: "adapters", label: "Adapters and converters" },
        { name: "clicker", label: "Presentation clicker" },
        { name: "laserPointer", label: "Laser pointer" },
        { name: "stageLighting", label: "Stage lighting" }
      ]
    },
    {
      name: "Technical Equipment",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25z" />
        </svg>
      ),
      color: "green",
      options: [
        { name: "laptop", label: "Laptop" },
        { name: "desktop", label: "Desktop computer" },
        { name: "extensionCords", label: "Extension cords" },
        { name: "chargers", label: "Chargers" },
        { name: "wiredInternet", label: "Wired internet" },
        { name: "wifi", label: "Wi-Fi" },
        { name: "router", label: "Router" },
        { name: "wifiAccessPoint", label: "Wi-Fi access point" }
      ]
    },
    {
      name: "Furniture",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: "purple",
      options: [
        { name: "speakerPodium", label: "Speaker podium" },
        { name: "speakerTable", label: "Table for speakers" },
        { name: "speakerChair", label: "Chair for speakers" },
        { name: "participantChairs", label: "Chairs for participants" },
        { name: "participantDesks", label: "Desk for participants" },
        { name: "bottledWater", label: "Water 0.5L" },
        { name: "waterCooler", label: "Water from cooler" },
        { name: "cups", label: "Cups" }
      ]
    },
    {
      name: "Miscellaneous",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      color: "orange",
      options: [
        { name: "nameTags", label: "Name tags" },
        { name: "flipChart", label: "Flip chart" },
        { name: "markers", label: "Markers" },
        { name: "paper", label: "Paper" },
        { name: "airConditioner", label: "Air conditioner" },
        { name: "ventilation", label: "Ventilation system" },
        { name: "signage", label: "Directional signage" },
        { name: "registrationDesk", label: "Registration desk" }
      ]
    },
    {
      name: "Safety",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      color: "emerald",
      options: [
        { name: "fireExtinguisher", label: "Fire extinguisher" },
        { name: "firstAidKit", label: "First aid kit" },
        { name: "emergencyExit", label: "Emergency exit" },
        { name: "smokeDetector", label: "Smoke detector" },
        { name: "securityCamera", label: "Security camera" }
      ]
    },
    {
      name: "Services",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
        </svg>
      ),
      color: "pink",
      options: [
        { name: "catering", label: "Catering Available" },
        { name: "coffee", label: "Coffee Service" },
        { name: "parking", label: "On-site Parking" }
      ]
    }
  ];

  // Map perks to their respective groups
  const categorizedPerks = perkGroups.map(group => {
    const groupPerks = group.options.filter(option => 
      perks.some(perk => {
        const perkName = typeof perk === 'string' ? perk.toLowerCase() : perk;
        return perkName === option.name.toLowerCase();
      })
    );
    
    return groupPerks.length > 0 ? { ...group, perks: groupPerks } : null;
  }).filter(Boolean);

  // Handle perks that don't belong to any category
  const categorizedPerkNames = new Set();
  categorizedPerks.forEach(group => {
    group.perks.forEach(perk => {
      categorizedPerkNames.add(perk.name.toLowerCase());
    });
  });

  const uncategorizedPerks = perks.filter(perk => {
    const perkName = typeof perk === 'string' ? perk.toLowerCase() : perk;
    return !categorizedPerkNames.has(perkName);
  });

  const getColorClasses = (color) => {
    const colorMap = {
      red: {
        bg: "from-red-50 to-rose-50",
        border: "border-red-200",
        text: "text-red-900",
        icon: "text-red-600",
        badge: "bg-red-100 text-red-800"
      },
      blue: {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-200",
        text: "text-blue-900",
        icon: "text-blue-600",
        badge: "bg-blue-100 text-blue-800"
      },
      green: {
        bg: "from-green-50 to-emerald-50",
        border: "border-green-200",
        text: "text-green-900",
        icon: "text-green-600",
        badge: "bg-green-100 text-green-800"
      },
      purple: {
        bg: "from-purple-50 to-violet-50",
        border: "border-purple-200",
        text: "text-purple-900",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-800"
      },
      orange: {
        bg: "from-orange-50 to-amber-50",
        border: "border-orange-200",
        text: "text-orange-900",
        icon: "text-orange-600",
        badge: "bg-orange-100 text-orange-800"
      },
      emerald: {
        bg: "from-emerald-50 to-teal-50",
        border: "border-emerald-200",
        text: "text-emerald-900",
        icon: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-800"
      },
      pink: {
        bg: "from-pink-50 to-rose-50",
        border: "border-pink-200",
        text: "text-pink-900",
        icon: "text-pink-600",
        badge: "bg-pink-100 text-pink-800"
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  if (categorizedPerks.length === 0 && uncategorizedPerks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-purple-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        Amenities & Features
        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
          {perks.length} total
        </span>
      </h2>
      
      <div className="space-y-3">
        {categorizedPerks.map((group) => {
          const colors = getColorClasses(group.color);
          const isExpanded = expandedGroups.has(group.name);
          const displayPerks = isExpanded ? group.perks : group.perks.slice(0, 3);
          
          return (
            <div key={group.name} className={`border ${colors.border} rounded-lg overflow-hidden hover:shadow-sm transition-shadow`}>
              {/* Compact Category Header */}
              <div 
                className={`flex items-center justify-between p-3 bg-gradient-to-r ${colors.bg} cursor-pointer hover:bg-opacity-80 transition-all`}
                onClick={() => toggleGroup(group.name)}
              >
                <div className="flex items-center gap-2">
                  <div className={colors.icon}>
                    {group.icon}
                  </div>
                  <h3 className={`font-medium ${colors.text} text-sm`}>
                    {group.name}
                  </h3>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                    {group.perks.length}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Show first few perks inline */}
                  <div className="hidden sm:flex gap-1 max-w-xs">
                    {group.perks.slice(0, 2).map((perk, idx) => (
                      <span key={idx} className="text-xs text-gray-600 bg-white bg-opacity-70 px-2 py-1 rounded">
                        {perk.label.length > 15 ? perk.label.substring(0, 15) + "..." : perk.label}
                      </span>
                    ))}
                    {group.perks.length > 2 && (
                      <span className="text-xs text-gray-500">+{group.perks.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  {group.perks.length > 3 && (
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanded Perks List */}
              {(isExpanded || group.perks.length <= 3) && (
                <div className="p-3 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {displayPerks.map((perk, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 p-1.5 text-xs bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.icon.includes('red') ? 'bg-red-400' : 
                          colors.icon.includes('blue') ? 'bg-blue-400' :
                          colors.icon.includes('green') ? 'bg-green-400' :
                          colors.icon.includes('purple') ? 'bg-purple-400' :
                          colors.icon.includes('orange') ? 'bg-orange-400' :
                          colors.icon.includes('emerald') ? 'bg-emerald-400' :
                          colors.icon.includes('pink') ? 'bg-pink-400' : 'bg-gray-400'}`}></div>
                        <span className="font-medium text-gray-700 leading-tight">
                          {perk.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {!isExpanded && group.perks.length > 3 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(group.name);
                      }}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      +{group.perks.length - 3} more...
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Compact Uncategorized perks */}
        {uncategorizedPerks.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium text-gray-900 text-sm">Additional Features</h3>
                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                  {uncategorizedPerks.length}
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-white">
              <div className="flex flex-wrap gap-1.5">
                {uncategorizedPerks.map((perk, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 transition-colors"
                  >
                    {typeof perk === 'string' ? perk.charAt(0).toUpperCase() + perk.slice(1) : String(perk)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlacePerks;
