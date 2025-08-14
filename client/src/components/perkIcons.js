// Centralized mapping of perk keys to react-icons components
// Extend this as needed for new perks
import React from "react";
import { FiWifi, FiCoffee } from "react-icons/fi";
import { MdOutlineLocalParking, MdOutlineScreenShare, MdOutlineAcUnit, MdOutlineFastfood, MdOutlineFireExtinguisher, MdOutlineEvStation, MdOutlineRouter, MdOutlineWaterDrop, MdOutlineTableBar, MdOutlineDesktopWindows, MdOutlineCable, MdOutlineSettingsInputHdmi, MdOutlineSettingsInputComponent, MdOutlineGraphicEq, MdOutlineSpeaker, MdOutlineBackup, MdOutlineEqualizer, MdOutlineVolumeUp, MdOutlineLaptop, MdOutlinePower, MdOutlineLan, MdOutlineTableRestaurant, MdOutlineAssignment, MdOutlineLocalDrink, MdOutlineLabel, MdOutlineStickyNote2, MdOutlineAir, MdOutlineDirections, MdOutlineAppRegistration, MdSpeaker } from "react-icons/md";
import { LuProjector } from "react-icons/lu";
import { FaChair, FaPlug, FaChalkboardTeacher, FaRegLightbulb, FaRegKeyboard, FaMicrophoneAlt, FaVolumeUp, FaRegFileAlt, FaRegClipboard, FaRegAddressCard, FaRegObjectGroup, FaRegDotCircle, FaFirstAid, FaMapSigns, FaMarker } from "react-icons/fa";
import { BsCup } from "react-icons/bs";
import { GiPodiumWinner } from "react-icons/gi";
import { LuMousePointerClick } from "react-icons/lu";
import { HiOutlineDesktopComputer } from "react-icons/hi";
import { BsFillPersonFill } from "react-icons/bs";

export const perkIcons = {
  // General/Tech
  wifi: FiWifi,
  parking: MdOutlineLocalParking,
  ledScreen: MdOutlineScreenShare,
  projector: LuProjector,
  speakerMicrophone: MdSpeaker, // Speaker microphone
  airConditioner: MdOutlineAcUnit,
  coffee: FiCoffee,
  catering: MdOutlineFastfood,
  desktop: HiOutlineDesktopComputer,
  extensionCords: FaPlug,
  speakerChair: FaChair,
  flipChart: FaChalkboardTeacher,
  stageLighting: FaRegLightbulb,
  keyboard: FaRegKeyboard,
  participantChairs: BsFillPersonFill,

  // Safety
  fireExtinguisher: MdOutlineFireExtinguisher, // Fire extinguisher
  firstAidKit: FaFirstAid, // First aid kit
  evacuationSigns: FaMapSigns, // Evacuation signs
  markers: FaMarker, // Markers

  // Visual/AV
  hdmiCable: MdOutlineSettingsInputHdmi, // HDMI cable
  projectorScreen: MdOutlineCable, // Projector screen (cable as screen)
  vgaCable: MdOutlineSettingsInputComponent, // VGA cable
  adapters: MdOutlineSettingsInputComponent, // Adapters and converters
  laserPointer: LuMousePointerClick, // Laser pointer
  clicker: FaRegDotCircle, // Presentation clicker (fallback)

  // Audio
  mixer: MdOutlineGraphicEq, // Mixer
  speaker: MdOutlineSpeaker, // Speaker
  backupMic: FaMicrophoneAlt, // Backup microphone
  soundControl: MdOutlineEqualizer, // Sound control panel
  acoustic: FaRegObjectGroup, // Room acoustic treatment
  amplifier: MdOutlineVolumeUp, // Amplifier

  // Technical Equipment
  laptop: MdOutlineLaptop, // Laptop
  chargers: MdOutlinePower, // Chargers
  wiredInternet: MdOutlineLan, // Wired internet
  router: MdOutlineRouter, // Router
  wifiAccessPoint: MdOutlineRouter, // Wi-Fi access point

  // Furniture
  speakerPodium: GiPodiumWinner, // Speaker podium
  speakerTable: MdOutlineTableBar, // Table for speakers
  participantDesks: MdOutlineTableRestaurant, // Desk for participants

  // Water & Misc
  bottledWater: MdOutlineLocalDrink, // Water 0.5L
  waterCooler: MdOutlineWaterDrop, // Water from cooler
  cups: BsCup, // Cups (fallback)
  nameTags: MdOutlineLabel, // Name tags

  // Office Supplies
  paper: FaRegFileAlt, // Paper
  ventilation: MdOutlineAir, // Ventilation system
  signage: MdOutlineDirections, // Directional signage
  registrationDesk: MdOutlineAppRegistration, // Registration desk
};

export function getPerkIcon(perkKey) {
  const Icon = perkIcons[perkKey];
  if (!Icon) return null;
  // This function must be called inside a React component render
  return React.createElement(Icon, { className: "w-6 h-6" });
}
