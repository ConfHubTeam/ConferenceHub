import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function PerkSelections({selectedPerks, setPerks}) {
  const { t } = useTranslation(['places', 'search', 'common']);
  // State to track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState({});

  // Toggle group expansion
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  function handleCheckClick(event) {
    const {checked, name} = event.target;
    if (checked) {
      setPerks([...selectedPerks, name]); 
    } else {
      setPerks([...selectedPerks.filter(selectedName => selectedName !== name)]);
    }
  }

    // Perk groups with their icons and options
  const perkGroups = [
    {
      name: t('search:filters.modals.perks.categories.Audio_Equipment'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      ),
      options: [
        { name: "speakerMic", label: t('search:filters.modals.perks.items.speakerMic') },
        { name: "backupMic", label: t('search:filters.modals.perks.items.backupMic') },
        { name: "speaker", label: t('search:filters.modals.perks.items.speaker') },
        { name: "mixer", label: t('search:filters.modals.perks.items.mixer') },
        { name: "soundControl", label: t('search:filters.modals.perks.items.soundControl') },
        { name: "amplifier", label: t('search:filters.modals.perks.items.amplifier') },
        { name: "acoustic", label: t('search:filters.modals.perks.items.acoustic') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Visual_Equipment'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      options: [
        { name: "projector", label: t('search:filters.modals.perks.items.projector') },
        { name: "ledScreen", label: t('search:filters.modals.perks.items.ledScreen') },
        { name: "projectorScreen", label: t('search:filters.modals.perks.items.projectorScreen') },
        { name: "hdmiCable", label: t('search:filters.modals.perks.items.hdmiCable') },
        { name: "vgaCable", label: t('search:filters.modals.perks.items.vgaCable') },
        { name: "adapters", label: t('search:filters.modals.perks.items.adapters') },
        { name: "clicker", label: t('search:filters.modals.perks.items.clicker') },
        { name: "laserPointer", label: t('search:filters.modals.perks.items.laserPointer') },
        { name: "stageLighting", label: t('search:filters.modals.perks.items.stageLighting') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Technical_Equipment'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
      ),
      options: [
        { name: "laptop", label: t('search:filters.modals.perks.items.laptop') },
        { name: "desktop", label: t('search:filters.modals.perks.items.desktop') },
        { name: "extensionCords", label: t('search:filters.modals.perks.items.extensionCords') },
        { name: "chargers", label: t('search:filters.modals.perks.items.chargers') },
        { name: "wiredInternet", label: t('search:filters.modals.perks.items.wiredInternet') },
        { name: "wifi", label: t('search:filters.modals.perks.items.wifi') },
        { name: "router", label: t('search:filters.modals.perks.items.router') },
        { name: "wifiAccessPoint", label: t('search:filters.modals.perks.items.wifiAccessPoint') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Furniture'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      options: [
        { name: "speakerPodium", label: t('search:filters.modals.perks.items.speakerPodium') },
        { name: "speakerTable", label: t('search:filters.modals.perks.items.speakerTable') },
        { name: "speakerChair", label: t('search:filters.modals.perks.items.speakerChair') },
        { name: "participantChairs", label: t('search:filters.modals.perks.items.participantChairs') },
        { name: "participantDesks", label: t('search:filters.modals.perks.items.participantDesks') },
        { name: "bottledWater", label: t('search:filters.modals.perks.items.bottledWater') },
        { name: "waterCooler", label: t('search:filters.modals.perks.items.waterCooler') },
        { name: "cups", label: t('search:filters.modals.perks.items.cups') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Miscellaneous'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      options: [
        { name: "nameTags", label: t('search:filters.modals.perks.items.nameTags') },
        { name: "flipChart", label: t('search:filters.modals.perks.items.flipChart') },
        { name: "markers", label: t('search:filters.modals.perks.items.markers') },
        { name: "paper", label: t('search:filters.modals.perks.items.paper') },
        { name: "airConditioner", label: t('search:filters.modals.perks.items.airConditioner') },
        { name: "ventilation", label: t('search:filters.modals.perks.items.ventilation') },
        { name: "signage", label: t('search:filters.modals.perks.items.signage') },
        { name: "registrationDesk", label: t('search:filters.modals.perks.items.registrationDesk') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Safety'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      options: [
        { name: "fireExtinguisher", label: t('search:filters.modals.perks.items.fireExtinguisher') },
        { name: "firstAidKit", label: t('search:filters.modals.perks.items.firstAidKit') },
        { name: "evacuationSigns", label: t('search:filters.modals.perks.items.evacuationSigns') }
      ]
    },
    {
      name: t('search:filters.modals.perks.categories.Services'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
        </svg>
      ),
      options: [
        { name: "catering", label: t('search:filters.modals.perks.items.catering') },
        { name: "coffee", label: t('search:filters.modals.perks.items.coffee') },
        { name: "parking", label: t('search:filters.modals.perks.items.parking') }
      ]
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-2">
      {perkGroups.map((group) => (
        <div 
          key={group.name} 
          className="border rounded-xl overflow-hidden shadow-sm"
        >
          {/* Group Header - Always visible */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleGroup(group.name);
            }} 
            className="w-full p-4 bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-primary">
                {group.icon}
              </div>
              <span className="font-medium">{group.name}</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className={`w-5 h-5 transition-transform ${expandedGroups[group.name] ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          {/* Dropdown Content - Only visible when expanded */}
          {expandedGroups[group.name] && (
            <div className="bg-gray-50 divide-y divide-gray-100">
              {group.options.map((option) => (
                <label 
                  key={option.name} 
                  className="flex items-center p-3 pl-14 hover:bg-gray-100 cursor-pointer"
                >
                  <input 
                    type="checkbox"
                    name={option.name}
                    checked={selectedPerks.includes(option.name)}
                    onChange={handleCheckClick}
                    className="mr-3 h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
