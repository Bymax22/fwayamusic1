"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  HiPlay,
  HiPause,
  HiCog,
  HiMusicNote,
  HiHome,
  HiSearch,
  HiHeart,
  HiClock,
  HiUser,
  HiPlus,
  HiDownload,
  HiOutlineFire,
  HiOutlineTrendingUp,
  HiOutlineMicrophone,
  HiOutlineViewList,
  HiOutlineDeviceMobile,
  HiOutlineChartBar
} from "react-icons/hi";
import { FaRandom, FaPalette, FaStar, FaPodcast, FaVolumeUp, FaBroadcastTower } from "react-icons/fa";
import { MdExplore, MdLibraryMusic, MdEqualizer } from "react-icons/md";

const Sidebar = ({ sidebarExpanded }: { sidebarExpanded: boolean }) => {
  const [currentSong] = useState({
    title: "CEO Wandi",
    artist: "Fwaya Music",
    cover: "/covers/wt3.jpg",
    progress: 35,
    volume: 70
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizer, setVisualizer] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisualizer(Array.from({ length: 20 }, () => Math.floor(Math.random() * 100)));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Custom icon wrapper with red color
  const Icon = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#e51f48]">{children}</span>
  );

  // Main navigation items
  const mainMenuItems = [
    { title: "Home", icon: <Icon><HiHome size={18} /></Icon>, href: "/" },
    { title: "Search", icon: <Icon><HiSearch size={18} /></Icon>, href: "/search" },
    { title: "Explore", icon: <Icon><MdExplore size={18} /></Icon>, href: "/explore" },
    { title: "Library", icon: <Icon><MdLibraryMusic size={18} /></Icon>, href: "/library" },
  ];

  // Music control items
  const musicMenuItems = [
    { title: "Create Playlist", icon: <Icon><HiPlus size={18} /></Icon>, href: "/create-playlist" },
    { title: "Liked Songs", icon: <Icon><HiHeart size={18} /></Icon>, href: "/liked-songs" },
    { title: "Your Episodes", icon: <Icon><FaPodcast size={16} /></Icon>, href: "/your-episodes" },
    { title: "Recently Played", icon: <Icon><HiClock size={18} /></Icon>, href: "/recently-played" },
    { title: "Queue", icon: <Icon><HiOutlineViewList size={18} /></Icon>, href: "/queue" },
    { title: "Downloads", icon: <Icon><HiDownload size={18} /></Icon>, href: "/download" },
  ];

  // Discover sections
  const discoverMenuItems = [
    { title: "Top Charts", icon: <Icon><HiOutlineTrendingUp size={18} /></Icon>, href: "/top-charts" },
    { title: "New Releases", icon: <Icon><HiMusicNote size={18} /></Icon>, href: "/new-releases" },
    { title: "Popular", icon: <Icon><HiOutlineFire size={18} /></Icon>, href: "/popular" },
    { title: "Artists", icon: <Icon><HiOutlineMicrophone size={18} /></Icon>, href: "/artists" },
    { title: "Radio", icon: <Icon><FaBroadcastTower size={16} /></Icon>, href: "/radio" },
    { title: "Genres", icon: <Icon><HiOutlineChartBar size={18} /></Icon>, href: "/genres" },
  ];

  // Settings items
  const settingsMenuItems = [
    { title: "Shuffle", icon: <Icon><FaRandom size={16} /></Icon>, href: "/shuffle" },
    { title: "Equalizer", icon: <Icon><MdEqualizer size={18} /></Icon>, href: "/equalizer" },
    { title: "Mood", icon: <Icon><FaPalette size={16} /></Icon>, href: "/mood" },
    { title: "VIP", icon: <Icon><FaStar size={16} /></Icon>, href: "/vip" },
    { title: "Connect Device", icon: <Icon><HiOutlineDeviceMobile size={18} /></Icon>, href: "/connect-device" },
    { title: "Settings", icon: <Icon><HiCog size={18} /></Icon>, href: "/settings" },
    { title: "Profile", icon: <Icon><HiUser size={18} /></Icon>, href: "/profile" },
  ];

  return (
    <div
      className={`hidden md:block fixed top-0 left-0 h-screen bg-[#0f2d3d] border-r border-[#1e293b] shadow-lg z-30 overflow-y-auto pt-16 transition-all duration-300
        ${sidebarExpanded ? "w-56" : "w-16"} lg:w-56`}
    >
      <div className="flex flex-col h-[calc(100vh-4rem)] p-2 space-y-2">
        {/* Main Navigation */}
        <div className="flex flex-col space-y-0.5">
          {mainMenuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-start p-2 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1a5a72] transition-all group mobile-text-sm"
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {sidebarExpanded && (
                <span className="ml-2 truncate text-left mobile-text-sm">{item.title}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="border-t border-[#1e293b] my-1"></div>

        {/* Music Library */}
        <div className="flex flex-col space-y-0.5">
          {sidebarExpanded && (
            <h3 className="text-xs uppercase text-[#64748b] px-2 mb-1 mobile-text-xs">
              Your Library
            </h3>
          )}
          {musicMenuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-start p-2 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1a5a72] transition-all group mobile-text-sm"
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {sidebarExpanded && (
                <span className="ml-2 truncate text-left mobile-text-sm">{item.title}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="border-t border-[#1e293b] my-1"></div>

        {/* Discover Section */}
        <div className="flex flex-col space-y-0.5">
          {sidebarExpanded && (
            <h3 className="text-xs uppercase text-[#64748b] px-2 mb-1 mobile-text-xs">
              Discover
            </h3>
          )}
          {discoverMenuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-start p-2 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1a5a72] transition-all group mobile-text-sm"
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {sidebarExpanded && (
                <span className="ml-2 truncate text-left mobile-text-sm">{item.title}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* Now Playing Section - Enhanced */}
        {sidebarExpanded && (
          <div className="p-2 rounded-lg bg-[#1a5a72] bg-opacity-30 mb-2">
            <div className="flex items-center">
              <Image
                src={currentSong.cover}
                alt={currentSong.title}
                width={40}
                height={40}
                className="w-10 h-10 rounded-md object-cover"
              />
              <div className="ml-2 overflow-hidden">
                <p className="text-xs font-medium truncate mobile-text-xs">{currentSong.title}</p>
                <p className="text-xs text-[#64748b] truncate mobile-text-xs">{currentSong.artist}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-1.5 w-full bg-[#0a3747] rounded-full h-1">
              <div
                className="bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] h-1 rounded-full"
                style={{ width: `${currentSong.progress}%` }}
              />
            </div>

            {/* Visualizer */}
            <div className="mt-1.5 flex items-end justify-center h-6 gap-0.5">
              {visualizer.map((height, index) => (
                <div
                  key={index}
                  style={{ height: `${height}%` }}
                  className="w-0.5 bg-gradient-to-t from-[#e51f48] to-[#ff4d6d] rounded-full transition-all duration-300"
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center mt-1.5 gap-1.5">
              <button
                className="flex-1 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] p-1 rounded flex justify-center items-center text-xs hover:opacity-90 transition-all mobile-text-xs"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <HiPause size={14} className="text-white" />
                ) : (
                  <HiPlay size={14} className="text-white" />
                )}
                <span className="ml-1 text-white mobile-text-xs">
                  {isPlaying ? "Pause" : "Play"}
                </span>
              </button>

              <button className="p-1 text-[#e51f48] hover:text-[#ff4d6d]">
                <FaVolumeUp size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="flex flex-col space-y-0.5">
          {sidebarExpanded && (
            <h3 className="text-xs uppercase text-[#64748b] px-2 mb-1 mobile-text-xs">
              Settings
            </h3>
          )}
          {settingsMenuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-start p-2 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1a5a72] transition-all group mobile-text-sm"
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {sidebarExpanded && (
                <span className="ml-2 truncate text-left mobile-text-sm">{item.title}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;