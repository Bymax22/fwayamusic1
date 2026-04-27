"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  FaPlay,
  FaPause,
  FaSearch,
  FaHome,
  FaMusic,
  FaUser,
  FaCompass,
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaMicrophone,
  FaBookOpen,
  FaHeadphones
} from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import MobileMenu from "./MobileMenu";

export default function GuestWelcome() {
  const [activeTab, setActiveTab] = useState<string>("for-you");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data state
  const [quickPicks, setQuickPicks] = useState([]);
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [trendingNow, setTrendingNow] = useState([]);
  const [topCharts, setTopCharts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation state for Discover text
  const [isDiscoverAnimating, setIsDiscoverAnimating] = useState(false);

  const quickRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Audio player hook
  const { playTrack, isPlaying } = useAudioPlayer();

  // Fetch homepage data from backend
  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Fetch homepage sections (featured songs, trending, beats, top charts)
        const homepageResponse = await fetch(`${API_BASE}/api/v1/media/homepage-sections`);
        if (!homepageResponse.ok) throw new Error('Failed to fetch homepage data');
        const homepageData = await homepageResponse.json();

        // Set quick picks from featured songs
        if (homepageData.featuredSongs && Array.isArray(homepageData.featuredSongs)) {
          const processedSongs = homepageData.featuredSongs.map((song: any) => ({
            ...song,
            url: song.url ? `${API_BASE}${song.url}` : song.url,
            coverArt: song.coverArt ? `${API_BASE}${song.coverArt}` : song.coverArt
          }));
          setQuickPicks(processedSongs);
        }

        // Set trending songs
        if (homepageData.trendingSongs && Array.isArray(homepageData.trendingSongs)) {
          const processedSongs = homepageData.trendingSongs.map((song: any) => ({
            ...song,
            url: song.url ? `${API_BASE}${song.url}` : song.url,
            coverArt: song.coverArt ? `${API_BASE}${song.coverArt}` : song.coverArt
          }));
          setTrendingNow(processedSongs);
        }

        // Set top charts
        if (homepageData.topCharts && Array.isArray(homepageData.topCharts)) {
          const processedSongs = homepageData.topCharts.map((song: any) => ({
            ...song,
            url: song.url ? `${API_BASE}${song.url}` : song.url,
            coverArt: song.coverArt ? `${API_BASE}${song.coverArt}` : song.coverArt
          }));
          setTopCharts(processedSongs);
        }

        // Set featured albums from beats
        if (homepageData.beats && Array.isArray(homepageData.beats)) {
          const processedAlbums = homepageData.beats.map((album: any) => ({
            ...album,
            url: album.url ? `${API_BASE}${album.url}` : album.url,
            coverArt: album.coverArt ? `${API_BASE}${album.coverArt}` : album.coverArt
          }));
          setFeaturedAlbums(processedAlbums);
        }

        // Fetch featured artists
        const artistsResponse = await fetch(`${API_BASE}/api/v1/artists`);
        if (!artistsResponse.ok) throw new Error('Failed to fetch artists');
        const artistsData = await artistsResponse.json();
        const artistsArray = Array.isArray(artistsData) ? artistsData : artistsData.artists || [];
        const processedArtists = artistsArray.map((artist: any) => ({
          ...artist,
          avatar: artist.avatar ? `${API_BASE}${artist.avatar}` : artist.avatar
        }));
        setFeaturedArtists(processedArtists);

        // Fetch playlists
        const playlistsResponse = await fetch(`${API_BASE}/api/v1/playlist`);
        if (!playlistsResponse.ok) throw new Error('Failed to fetch playlists');
        const playlistsData = await playlistsResponse.json();
        const playlistsArray = Array.isArray(playlistsData) ? playlistsData : playlistsData.playlists || [];
        const processedPlaylists = playlistsArray.map((playlist: any) => ({
          ...playlist,
          coverArt: playlist.coverArt ? `${API_BASE}${playlist.coverArt}` : playlist.coverArt
        }));
        setPlaylists(processedPlaylists);

      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const heroImages = [
    "/breadcumb3.jpg",
    "/featured5.jpg",
    "/featured6.jpg",
  ];

  const heroContent = [
    {
      title: "Lost in the Echo (Killsonik Remix)",
      subtitle: "Linkin Park — Recharged",
      primaryButton: "Play",
      secondaryButton: "Save"
    },
    {
      title: "Electric Dreams",
      subtitle: "The Midnight — Infinite",
      primaryButton: "Listen Now",
      secondaryButton: "Add to Playlist"
    },
    {
      title: "Midnight Skies",
      subtitle: "Owl City — Ocean Eyes",
      primaryButton: "Stream",
      secondaryButton: "Download"
    }
  ];

  // Auto-rotate hero images with sliding animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsSliding(true);
      // Wait for slide animation to complete before changing image
      setTimeout(() => {
        setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
        setIsSliding(false);
      }, 1200); // Slightly slower slide duration
    }, 4000); // Total cycle time
    return () => clearInterval(interval);
  }, []);

  // Periodic animation for Discover text: animate for 30s, stop for 60s, repeat
  React.useEffect(() => {
    const cycle = () => {
      setIsDiscoverAnimating(true);
      setTimeout(() => setIsDiscoverAnimating(false), 30000); // 30s animate
      setTimeout(cycle, 90000); // repeat after 90s total
    };
    cycle();
  }, []);

  const scroll = (ref: any, dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: dir === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };


  return (
    <>
      <div className="h-screen w-full overflow-x-hidden px-0 py-3 bg-black relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/fwaya lp-01.png" alt="Loading" width={60} height={60} className="animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE ================= */}
          <div className="lg:hidden pb-24 px-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`text-white text-lg font-semibold ${isDiscoverAnimating ? 'animate-pulse' : ''}`}>
                {isPlaying ? (
                  'Discover'.split('').map((letter, i) => (
                    <span
                      key={i}
                      className="inline-block animate-bounce"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s',
                        animationIterationCount: 'infinite'
                      }}
                    >
                      {letter}
                    </span>
                  ))
                ) : (
                  'Fwaya'
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                  Get App
                </button>
                <button className="rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400">
                  Premium
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-3 text-white/80">
                <FaSearch className="text-white/60" />
                <input
                  type="search"
                  placeholder="Search music, artists, playlists"
                  className="bg-transparent outline-none text-sm text-white placeholder:text-white/40 w-full"
                />
              </div>
            </div>

        {/* HERO SECTION - Minimal modern mobile hero */}
        <div className="relative h-[150px] rounded-3xl overflow-hidden mb-3 pt-5">
          <div className="absolute inset-0">
            <Image
              src={heroImages[heroImageIndex]}
              alt="Hero banner"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-black/35"></div>
          <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-purple-600/70 to-transparent"></div>

          <div className="relative z-10 flex flex-col justify-between h-full pb-5">
            <div className="space-y-3">
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { name: "For You", key: "for-you" },
            { name: "New Releases", key: "new-releases" },
            { name: "Playlists", key: "playlists" },
            { name: "Trending", key: "trending" },
            { name: "Artists", key: "artists" },
            { name: "Albums", key: "albums" },
            { name: "Top Charts", key: "top-charts" },
            { name: "News", key: "news" },
            { name: "Podcasts", key: "podcasts" }
          ].map((tab, i) => (
            <button
              key={i}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key ? "bg-purple-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'for-you' && (
          <>
            {/* Quick Picks (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Quick Picks for You</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickPicks.slice(0, 6).map((item: any, i: number) => (
                  <div 
                    key={i} 
                    className="w-32 flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.user?.displayName || item.user?.username || 'Unknown',
                      imageUrl: item.artCoverUrl,
                      audioUrl: item.audioUrl,
                      duration: item.duration
                    })}
                  >
                    <div className="rounded-2xl overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow mb-2">
                      <div className="aspect-square relative">
                        {item.artCoverUrl ? (
                          <Image
                            src={item.artCoverUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        )}
                      </div>
                    </div>
                    <div className="px-1">
                      <p className="text-xs font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Artists (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Featured Artists</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <div key={i} className="flex-shrink-0 text-center cursor-pointer">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-lg hover:shadow-xl transition-shadow"
                      style={{
                        backgroundImage: artist.avatarUrl ? `url(${artist.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!artist.avatarUrl && (
                        <span className="text-white font-bold text-lg">
                          {artist.username?.substring(0, 2).toUpperCase() || 'A'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate text-white mb-1">{artist.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{artist.followers?.length || '0'} followers</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Now (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Trending Now</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {trendingNow.slice(0, 6).map((item: any, i: number) => (
                  <div 
                    key={i} 
                    className="w-32 flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.user?.displayName || item.user?.username || 'Unknown',
                      imageUrl: item.artCoverUrl,
                      audioUrl: item.audioUrl,
                      duration: item.duration
                    })}
                  >
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow mb-2">
                      <div className="aspect-square relative overflow-hidden bg-black/10">
                        {item.artCoverUrl ? (
                          <Image
                            src={item.artCoverUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        )}
                      </div>
                    </div>
                    <div className="px-1">
                      <div className="flex items-center justify-between text-[9px] text-white/90 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[9px]" />
                          <span>{item.playCount?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRegHeart className="text-[9px]" />
                          <span>{item.likeCount?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Albums (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Featured Albums</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-[#0a0a0d]">
                    <div 
                      className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500"
                      style={{
                        backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="p-3 bg-black/20">
                      <p className="text-sm font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{item.mediasCount || Math.floor(Math.random() * 20) + 5} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Charts (mobile styled) */}
            <div className="mt-3">
              <h3 className="font-semibold mb-3">Top Charts</h3>
              <div className="space-y-3">
                {topCharts.slice(0, 6).map((track: any, i: number) => (
                  <div key={track.id || i} className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-400 w-5 text-sm">{i + 1}</span>
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-black flex-shrink-0 relative">
                        {track.artCoverUrl ? (
                          <Image
                            src={track.artCoverUrl}
                            alt={track.title || 'Track art'}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{track.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{track.user?.displayName || track.user?.username || 'Unknown'} — {track.genre || 'Track'}</p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => playTrack({
                          id: track.id,
                          title: track.title,
                          artist: track.user?.displayName || track.user?.username || 'Unknown',
                          imageUrl: track.artCoverUrl,
                          audioUrl: track.audioUrl,
                          duration: track.duration
                        })}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <FaPlay className="text-white text-xs ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Playlists (mobile) */}
            <div className="mt-3 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Suggested Playlists</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[120px] bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0">
                    <div 
                      className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2"
                      style={{
                        backgroundImage: item.coverUrl ? `url(${item.coverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <p className="text-xs font-semibold truncate">{item.name || item.title}</p>
                    <p className="text-xs text-gray-400">{item.mediasCount || 0} tracks</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'new-releases' && (
          <>
            {/* Trending Now (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Trending Now</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {trendingNow.slice(0, 6).map((item: any, i: number) => (
                  <div 
                    key={i} 
                    className="w-32 flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.user?.displayName || item.user?.username || 'Unknown',
                      imageUrl: item.artCoverUrl,
                      audioUrl: item.audioUrl,
                      duration: item.duration
                    })}
                  >
                    <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow mb-2">
                      <div 
                        className="aspect-square bg-black"
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    <div className="px-1">
                      <div className="flex items-center justify-between text-[9px] text-white/90 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[9px]" />
                          <span>{item.playCount?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRegHeart className="text-[9px]" />
                          <span>{item.likeCount?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Albums (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Featured Albums</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-[#0a0a0d]">
                    <div 
                      className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500"
                      style={{
                        backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="p-3 bg-black/20">
                      <p className="text-sm font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{item.mediasCount || Math.floor(Math.random() * 20) + 5} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Charts (mobile styled) */}
            <div className="mt-3">
              <h3 className="font-semibold mb-3">Top Charts</h3>
              <div className="space-y-3">
                {topCharts.slice(0, 6).map((track: any, i: number) => (
                  <div key={track.id || i} className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-400 w-5 text-sm">{i + 1}</span>
                      <div 
                        className="w-10 h-10 rounded-md bg-black flex-shrink-0"
                        style={{
                          backgroundImage: track.artCoverUrl ? `url(${track.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{track.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{track.user?.displayName || track.user?.username || 'Unknown'} — {track.genre || 'Track'}</p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => playTrack({
                          id: track.id,
                          title: track.title,
                          artist: track.user?.displayName || track.user?.username || 'Unknown',
                          imageUrl: track.artCoverUrl,
                          audioUrl: track.audioUrl,
                          duration: track.duration
                        })}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <FaPlay className="text-white text-xs ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'playlists' && (
          <>
            {/* Suggested Playlists (mobile) */}
            <div className="mt-3 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Suggested Playlists</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[120px] bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0">
                    <div 
                      className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2"
                      style={{
                        backgroundImage: item.coverUrl ? `url(${item.coverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <p className="text-xs font-semibold truncate">{item.name || item.title}</p>
                    <p className="text-xs text-gray-400">{item.mediasCount || 0} tracks</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'trending' && (
          <>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Trending Now</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {trendingNow.slice(0, 6).map((item: any, i: number) => (
                  <div 
                    key={i} 
                    className="w-32 flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack({
                      id: item.id,
                      title: item.title,
                      artist: item.user?.displayName || item.user?.username || 'Unknown',
                      imageUrl: item.artCoverUrl,
                      audioUrl: item.audioUrl,
                      duration: item.duration
                    })}
                  >
                    <div className="rounded-2xl overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow mb-2">
                      <div 
                        className="aspect-square bg-black"
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    <div className="px-1">
                      <p className="text-xs font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'artists' && (
          <>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Artists</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <div key={i} className="flex-shrink-0 text-center cursor-pointer">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-lg hover:shadow-xl transition-shadow"
                      style={{
                        backgroundImage: artist.avatarUrl ? `url(${artist.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!artist.avatarUrl && (
                        <span className="text-white font-bold text-lg">
                          {artist.username?.substring(0, 2).toUpperCase() || 'A'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate text-white mb-1">{artist.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{artist.followers?.length || '0'} followers</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'albums' && (
          <>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Albums</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-[#0a0a0d]">
                    <div className="relative">
                      <div 
                        className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500"
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    <div className="p-3 bg-black/20">
                      <p className="text-sm font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'top-charts' && (
          <>
            <div className="mt-3">
              <h3 className="font-semibold mb-3">Top Charts</h3>
              <div className="space-y-3">
                {topCharts.slice(0, 6).map((track: any, i: number) => (
                  <div key={track.id || i} className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-400 w-5 text-sm">{i + 1}</span>
                      <div 
                        className="w-10 h-10 rounded-md bg-black flex-shrink-0"
                        style={{
                          backgroundImage: track.artCoverUrl ? `url(${track.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{track.title}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{track.user?.displayName || track.user?.username || 'Unknown'} — {track.genre || 'Track'}</p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => playTrack({
                          id: track.id,
                          title: track.title,
                          artist: track.user?.displayName || track.user?.username || 'Unknown',
                          imageUrl: track.artCoverUrl,
                          audioUrl: track.audioUrl,
                          duration: track.duration
                        })}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <FaPlay className="text-white text-xs ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'news' && (
          <>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Latest News</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="space-y-3">
                {featuredArtists.slice(0, 4).map((artist: any, i: number) => (
                  <div key={i} className="rounded-3xl bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full bg-black flex-shrink-0"
                        style={{
                          backgroundImage: artist.avatarUrl ? `url(${artist.avatarUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{artist.name || artist.username || 'Unknown Artist'}</p>
                        <p className="text-xs text-gray-400">Latest update from your favorite artists</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'podcasts' && (
          <>
            {/* Featured Artists (as Podcasts placeholder) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Featured Podcasts</h3>
                <span className="text-xs text-gray-400">See All {'>'}</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <div key={i} className="flex-shrink-0 text-center cursor-pointer">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-lg hover:shadow-xl transition-shadow"
                      style={{
                        backgroundImage: artist.avatarUrl ? `url(${artist.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!artist.avatarUrl && (
                        <span className="text-white font-bold text-lg">
                          {artist.username?.substring(0, 2).toUpperCase() || 'A'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate text-white mb-1">{artist.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{artist.followers?.length || '0'} followers</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:flex h-full gap-3 items-stretch">

        {/* SIDEBAR */}
        <div className="w-60 h-full min-h-0 overflow-y-auto scrollbar-modern bg-[#080812]/60 backdrop-blur p-6 flex flex-col rounded-2xl">
         

          {[
            { name: "Home", icon: FaHome },
            { name: "Browse", icon: FaCompass },
            { name: "Search", icon: FaSearch },
            { name: "Library", icon: FaBookOpen },
            { name: "Playlists", icon: FaList },
            { name: "Albums", icon: FaMusic },
            { name: "Artists", icon: FaUser },
            { name: "Podcasts", icon: FaMicrophone }
          ].map((item, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-lg mb-2 text-sm font-medium flex items-center gap-3 ${
                i === 0
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              }`}
            >
              <item.icon className="text-base" />
              {item.name}
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div className="flex-1 h-full min-h-0 px-4 py-6 overflow-y-auto scrollbar-modern rounded-2xl bg-[#080812]/60">


          {/* ===== HERO ===== */}
          <div className="relative rounded-3xl mb-10 overflow-hidden h-80">
            <div className="absolute inset-0">
              <Image
                src={heroImages[heroImageIndex]}
                alt="Hero banner"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/35" />

            {/* Purple overlay on the left side */}
            <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-purple-600/80 to-transparent" />

            <div className="relative p-8 flex justify-between items-center h-full">
              <div className="max-w-xl z-10">
                <h2 className="text-4xl font-bold mb-2 text-white">
                  {heroContent[heroImageIndex].title}
                </h2>
                <p className="text-lg text-white/90 mb-6">
                  {heroContent[heroImageIndex].subtitle}
                </p>

                <div className="flex gap-4">
                  <button className="bg-white text-black px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium hover:bg-gray-100 transition-colors">
                    <FaPlay /> {heroContent[heroImageIndex].primaryButton}
                  </button>
                  <button className="bg-white/20 px-6 py-3 rounded-full text-sm text-white border border-white/30 hover:bg-white/30 transition-colors">
                    {heroContent[heroImageIndex].secondaryButton}
                  </button>
                </div>
              </div>

              <div className={`relative w-48 h-48 rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-1000 ease-out ${isSliding ? 'translate-x-12 opacity-50 scale-95' : 'translate-x-0 opacity-100 scale-100'}`}>
                <Image
                  src={heroImages[heroImageIndex]}
                  alt="Hero overlay"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* ===== QUICK PICKS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Quick Picks for You
              </h3>

              <div className="flex gap-1">
                <button
                  onClick={() => scroll(quickRef, "left")}
                  className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <FaChevronLeft className="text-sm" />
                </button>
                <button
                  onClick={() => scroll(quickRef, "right")}
                  className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            </div>

            {/* GRID LAYOUT - ALL 6 CARDS VISIBLE */}
            <div className="grid grid-cols-6 gap-3">
              {quickPicks.slice(0, 6).map((item: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* IMAGE */}
                  <div
                    className="aspect-[4/5] bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-medium truncate text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.user?.displayName || item.user?.username || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== FEATURED ALBUMS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Featured Albums
              </h3>

              <div className="flex gap-1">
                <button
                  onClick={() => scroll(quickRef, "left")}
                  className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <FaChevronLeft className="text-sm" />
                </button>
                <button
                  onClick={() => scroll(quickRef, "right")}
                  className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            </div>

            {/* GRID LAYOUT - ALL 5 ALBUMS FIT EXACTLY */}
            <div className="grid grid-cols-5 gap-3">
              {featuredAlbums.slice(0, 5).map((album: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* ALBUM COVER */}
                  <div
                    className="aspect-[4/5] bg-black rounded-lg group-hover:scale-105 transition-transform"
                    style={{
                      backgroundImage: album.artCoverUrl ? `url(${album.artCoverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-semibold truncate text-white mb-0.5">
                      {album.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {album.user?.displayName || album.user?.username || 'Unknown Artist'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {album.createdAt ? new Date(album.createdAt).getFullYear() : new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== FEATURED ARTISTS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Featured Artists
              </h3>
            </div>

            {/* GRID LAYOUT - 6 ARTISTS */}
            <div className="grid grid-cols-6 gap-3">
              {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                <div
                  key={i}
                  className="text-center cursor-pointer hover:bg-white/5 rounded-xl p-3 transition-colors"
                >
                  {/* ARTIST IMAGE */}
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-2"
                    style={{
                      backgroundImage: artist.avatarUrl ? `url(${artist.avatarUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>

                  {/* ARTIST INFO */}
                  <p className="text-sm font-semibold truncate mb-1">
                    {artist.displayName || artist.username || artist.artistName || 'Unknown Artist'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {artist.followers ? `${artist.followers.length} followers` : '0 followers'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ===== TRENDING NOW ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Trending Now
              </h3>
            </div>

            {/* GRID LAYOUT - 6 ITEMS LIKE QUICK PICKS */}
            <div className="grid grid-cols-6 gap-3">
              {trendingNow.slice(0, 6).map((track: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* IMAGE */}
                  <div
                    className="aspect-[4/5] bg-gradient-to-br from-purple-500 to-pink-500 group-hover:scale-105 transition-transform"
                    style={{
                      backgroundImage: track.artCoverUrl ? `url(${track.artCoverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-medium truncate text-white">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {track.user?.displayName || track.user?.username || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== SUGGESTED PLAYLISTS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Suggested Playlists
              </h3>
              <div className="flex gap-1">
                <button className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center">
                  <FaChevronLeft className="text-sm" />
                </button>
                <button className="w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center">
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            </div>

            {/* GRID LAYOUT - 5 PLAYLISTS */}
            <div className="grid grid-cols-5 gap-3">
              {playlists.slice(0, 5).map((playlist: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* PLAYLIST COVER */}
                  <div
                    className="aspect-[4/5] bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-105 transition-transform"
                    style={{
                      backgroundImage: playlist.coverUrl ? `url(${playlist.coverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-semibold truncate text-white mb-0.5">
                      {playlist.name || playlist.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {playlist.mediasCount || 0} tracks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== TOP CHARTS + GENRES ===== */}
          <div className="flex gap-8">

            {/* TOP CHARTS */}
            <div className="flex-1 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">
                  Top Charts
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {topCharts.slice(0, 5).map((track: any, index: number) => (
                  <div
                    key={track.id || index}
                    className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">{index + 1}</span>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0"
                      style={{
                        backgroundImage: track.artCoverUrl ? `url(${track.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {track.user?.displayName || track.user?.username || 'Unknown Artist'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </div>
                  </div>
                ))}
              </div>

              {/* SEPARATOR - positioned to the right of top charts */}
              <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10"></div>
            </div>

            {/* GENRES */}
            <div className="w-48">
              <h3 className="mb-4 font-semibold text-lg">
                Genres
              </h3>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Pop", color: "bg-purple-600" },
                  { label: "Electronic", color: "bg-white/10" },
                  { label: "Hip-Hop", color: "bg-white/10" },
                  { label: "Rock", color: "bg-white/10" },
                  { label: "Chill", color: "bg-white/10" },
                  { label: "Zed", color: "bg-white/10" }
                ].map((g, i) => (
                  <button
                    key={i}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${g.color} hover:opacity-90 transition-opacity`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-64 h-full min-h-0 overflow-y-auto scrollbar-modern bg-[#080812]/60 backdrop-blur p-6 rounded-2xl">
          <h3 className="mb-6 font-semibold text-lg">Now Playing</h3>

          {/* Current Track */}
          <div className="mb-6">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4" />
            <h4 className="font-semibold text-base mb-1">Lost in the Echo</h4>
            <p className="text-sm text-gray-400 mb-4">Linkin Park — Recharged</p>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-1 mb-2">
              <div className="bg-purple-500 h-1 rounded-full w-1/3"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>1:45</span>
              <span>3:45</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <FaChevronLeft className="text-sm" />
            </button>
            <button className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center">
              <FaPause className="text-lg" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <FaChevronRight className="text-sm" />
            </button>
          </div>

          {/* Up Next */}
          <div>
            <h4 className="font-semibold mb-4">Up Next</h4>
            <div className="space-y-3">
              {[
                { title: "Midnight Skies", artist: "Owl City" },
                { title: "Electric Dreams", artist: "The Midnight" },
                { title: "The Rock Revival", artist: "Various Artists" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                  </div>
                  <span className="text-xs text-gray-400">3:45</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}