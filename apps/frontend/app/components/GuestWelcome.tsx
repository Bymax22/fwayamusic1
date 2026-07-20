"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaPause,
  FaSearch,
  FaHome,
  FaMusic,
  FaUser,
  FaCompass,
  FaFilm,
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaMicrophone,
  FaBookOpen,
  FaHeadphones,
  FaComment,
  FaChevronDown,
  FaCog,
  FaSignOutAlt,
  FaStar
} from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "./MobileMenu";
import { createMediaSlug } from "@/lib/utils";

export default function GuestWelcome() {
  const [activeTab, setActiveTab] = useState<string>("for-you");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data state
  const [quickPicks, setQuickPicks] = useState<any[]>([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<any[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const [featuredProducers, setFeaturedProducers] = useState<any[]>([]);
  const [beats, setBeats] = useState<any[]>([]);
  const [trendingNow, setTrendingNow] = useState<any[]>([]);
  const [topCharts, setTopCharts] = useState<any[]>([]);
  const [musicVideos, setMusicVideos] = useState<any[]>([]);
  const [otherVideos, setOtherVideos] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const cacheKey = 'fwayaGuestWelcomeHomepageData';

  const loadCachedHomepageData = () => {
    if (typeof window === 'undefined') return false;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return false;

    try {
      const data = JSON.parse(cached);
      if (data && typeof data === 'object') {
        setQuickPicks(data.quickPicks || []);
        setFeaturedAlbums(data.featuredAlbums || []);
        setFeaturedArtists(data.featuredArtists || []);
        setFeaturedProducers(data.featuredProducers || []);
        setBeats(data.beats || []);
        setTrendingNow(data.trendingNow || []);
        setTopCharts(data.topCharts || []);
        setMusicVideos(data.musicVideos || []);
        setOtherVideos(data.otherVideos || []);
        setPlaylists(data.playlists || []);
        return true;
      }
    } catch (error) {
      console.warn('Failed to parse guest welcome cache:', error);
    }

    return false;
  };

  const saveCachedHomepageData = (data: any) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save guest welcome cache:', error);
    }
  };

  const getDashboardPath = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ARTIST':
        return '/for-artists';
      case 'RESELLER':
        return '/reseller-dashboard';
      case 'PRODUCER':
        return '/producer';
      case 'ADMIN':
      case 'MODERATOR':
        return '/admin';
      default:
        return '/';
    }
  };

  const handleUserMenuNavigation = (path: string) => {
    setShowUserMenu(false);
    router.push(path);
  };

  const handleUserLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/auth/logout');
  };

  // Animation state for Discover text
  const [isDiscoverAnimating, setIsDiscoverAnimating] = useState(false);

  const quickRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const resolveMediaUrl = (url?: string) => {
    if (!url) return undefined;
    return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`;
  };

  const getProducerDisplayName = (producer: any) => {
    return (
      producer.producerName ||
      producer.displayName ||
      producer.username ||
      producer.artistName ||
      producer.stageName ||
      'Unknown Producer'
    );
  };

  const getProducerFollowers = (producer: any) => {
    if (producer.producerFollowers != null) return producer.producerFollowers;
    if (typeof producer.followers === 'number') return producer.followers;
    if (Array.isArray(producer.followers)) return producer.followers.length;
    return 0;
  };

  const getProducerInitials = (producer: any) => {
    const name = getProducerDisplayName(producer).trim();
    return name
      .split(' ')
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('') || 'P';
  };

  const getMediaViews = (item: any) => item?.views ?? item?.playCount ?? 0;
  const getMediaComments = (item: any) =>
    typeof item?.commentCount === 'number'
      ? item.commentCount
      : Array.isArray(item?.comments)
      ? item.comments.length
      : 0;

  const getMediaLikes = (item: any) => {
    if (typeof item.likeCount === 'number') return item.likeCount;
    if (typeof item.likes === 'number') return item.likes;
    if (typeof item.likesCount === 'number') return item.likesCount;
    if (Array.isArray(item.likes)) return item.likes.length;
    if (Array.isArray(item.likedBy)) return item.likedBy.length;
    return 0;
  };

  const getArtistFollowers = (artist: any) => {
    if (typeof artist.followers === 'number') return artist.followers;
    if (Array.isArray(artist.followers)) return artist.followers.length;
    if (typeof artist.followersCount === 'number') return artist.followersCount;
    if (typeof artist.followersTotal === 'number') return artist.followersTotal;
    return 0;
  };

  const getTrackCount = (item: any) => {
    if (typeof item.mediasCount === 'number') return item.mediasCount;
    if (typeof item.trackCount === 'number') return item.trackCount;
    if (typeof item.tracksCount === 'number') return item.tracksCount;
    if (typeof item.track_count === 'number') return item.track_count;
    if (Array.isArray(item.tracks)) return item.tracks.length;
    return 0;
  };

  const getSectionHref = (section: string) => {
    switch (section) {
      case 'quickPicks':
        return '/browse';
      case 'musicVideos':
      case 'videos':
      case 'otherVideos':
        return '/videos';
      case 'featuredArtists':
        return '/artists';
      case 'featuredProducers':
        return '/artists?role=producer';
      case 'beats':
        return '/browse?section=beats';
      case 'trendingNow':
      case 'trending':
        return '/trending';
      case 'featuredAlbums':
        return '/albums';
      case 'newReleases':
        return '/new-releases';
      case 'suggestedPlaylists':
        return '/playlist';
      case 'topCharts':
        return '/top-charts';
      case 'news':
        return '/news';
      case 'podcasts':
        return '/your-episodes';
      default:
        return '/browse';
    }
  };

  const renderSeeAll = (section: string) => (
    <button
      type="button"
      onClick={() => router.push(getSectionHref(section))}
      className="text-xs text-purple-300 hover:text-white transition"
    >
      See All {'>'}
    </button>
  );

  // Helper: fetch with timeout
  const fetchJsonWithTimeout = async (input: RequestInfo, timeout = 8000, init?: RequestInit) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { signal: controller.signal, ...init });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  // Audio player hook
  const { playTrack, isPlaying } = useAudioPlayer();

  const featuredSongs = quickPicks;

  // Fetch homepage data from backend
  useEffect(() => {
    const fetchHomepageData = async (showLoader = true) => {
      try {
        if (showLoader) setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Fetch homepage sections (featured songs, trending, beats, top charts) via frontend proxy
        // Use timeout to avoid hanging the preloader
        let homepageResponse = await fetchJsonWithTimeout(`/api/media/homepage-sections`, 6000);
        if (!homepageResponse.ok) {
          console.warn('Homepage proxy failed, retrying direct backend call');
          homepageResponse = await fetchJsonWithTimeout(`${API_BASE}/api/v1/media/homepage-sections`, 8000);
        }
        if (!homepageResponse.ok) throw new Error('Failed to fetch homepage data');
        const homepageData = await homepageResponse.json();

        const processedQuickPicks = homepageData.featuredSongs && Array.isArray(homepageData.featuredSongs)
          ? homepageData.featuredSongs.map((song: any) => ({
              ...song,
              url: song.url ? resolveMediaUrl(song.url) : song.url,
              coverArt: song.coverArt ? resolveMediaUrl(song.coverArt) : song.coverArt,
              artCoverUrl: song.artCoverUrl ? resolveMediaUrl(song.artCoverUrl) : (song.coverArt ? resolveMediaUrl(song.coverArt) : (song.thumbnailUrl ? resolveMediaUrl(song.thumbnailUrl) : undefined))
            }))
          : [];

        const processedTrendingNow = homepageData.trendingSongs && Array.isArray(homepageData.trendingSongs)
          ? homepageData.trendingSongs.map((song: any) => ({
              ...song,
              url: song.url ? resolveMediaUrl(song.url) : song.url,
              coverArt: song.coverArt ? resolveMediaUrl(song.coverArt) : song.coverArt,
              artCoverUrl: song.artCoverUrl ? resolveMediaUrl(song.artCoverUrl) : (song.coverArt ? resolveMediaUrl(song.coverArt) : (song.thumbnailUrl ? resolveMediaUrl(song.thumbnailUrl) : undefined))
            }))
          : [];

        const processedTopCharts = homepageData.topCharts && Array.isArray(homepageData.topCharts)
          ? homepageData.topCharts.map((song: any) => ({
              ...song,
              url: song.url ? resolveMediaUrl(song.url) : song.url,
              coverArt: song.coverArt ? resolveMediaUrl(song.coverArt) : song.coverArt,
              artCoverUrl: song.artCoverUrl ? resolveMediaUrl(song.artCoverUrl) : (song.coverArt ? resolveMediaUrl(song.coverArt) : (song.thumbnailUrl ? resolveMediaUrl(song.thumbnailUrl) : undefined))
            }))
          : [];

        const albumItems: any[] = [];
        
        // First, try to use the dedicated featuredAlbums field from backend
        if (homepageData.featuredAlbums && Array.isArray(homepageData.featuredAlbums) && homepageData.featuredAlbums.length > 0) {
          albumItems.push(...homepageData.featuredAlbums);
        } else {
          // Fallback: filter albums from other sections
          if (homepageData.featuredSongs && Array.isArray(homepageData.featuredSongs)) {
            albumItems.push(...homepageData.featuredSongs.filter((item: any) => item.type?.toString().toUpperCase() === 'ALBUM'));
          }
          if (albumItems.length === 0 && homepageData.trendingSongs && Array.isArray(homepageData.trendingSongs)) {
            albumItems.push(...homepageData.trendingSongs.filter((item: any) => item.type?.toString().toUpperCase() === 'ALBUM'));
          }
          if (albumItems.length === 0 && homepageData.beats && Array.isArray(homepageData.beats)) {
            albumItems.push(...homepageData.beats.filter((item: any) => item.type?.toString().toUpperCase() === 'ALBUM'));
          }
        }

        const processedFeaturedAlbums = albumItems.length > 0
          ? albumItems.map((album: any) => ({
              ...album,
              url: album.url ? resolveMediaUrl(album.url) : album.url,
              coverArt: album.coverArt ? resolveMediaUrl(album.coverArt) : album.coverArt,
              artCoverUrl: album.artCoverUrl ? resolveMediaUrl(album.artCoverUrl) : (album.coverArt ? resolveMediaUrl(album.coverArt) : (album.thumbnailUrl ? resolveMediaUrl(album.thumbnailUrl) : undefined))
            }))
          : [];

        const processedBeats = homepageData.beats && Array.isArray(homepageData.beats)
          ? homepageData.beats
              .filter((beat: any) => beat.type?.toString().toUpperCase() === 'AUDIO')
              .map((beat: any) => ({
                ...beat,
                url: beat.url ? resolveMediaUrl(beat.url) : beat.url,
                coverArt: beat.coverArt ? resolveMediaUrl(beat.coverArt) : beat.coverArt,
                artCoverUrl: beat.artCoverUrl ? resolveMediaUrl(beat.artCoverUrl) : (beat.coverArt ? resolveMediaUrl(beat.coverArt) : (beat.thumbnailUrl ? resolveMediaUrl(beat.thumbnailUrl) : undefined))
              }))
          : [];

        const processedMusicVideos = homepageData.musicVideos && Array.isArray(homepageData.musicVideos)
          ? homepageData.musicVideos.map((video: any) => ({
              ...video,
              url: video.url ? resolveMediaUrl(video.url) : video.url,
              coverArt: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : video.coverArt,
              artCoverUrl: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : (video.coverArt ? resolveMediaUrl(video.coverArt) : (video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : undefined)),
              coverPreview: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : (video.coverArt ? resolveMediaUrl(video.coverArt) : (video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : undefined))
            }))
          : [];

        const processedOtherVideos = homepageData.otherVideos && Array.isArray(homepageData.otherVideos)
          ? homepageData.otherVideos.map((video: any) => ({
              ...video,
              url: video.url ? resolveMediaUrl(video.url) : video.url,
              coverArt: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : video.coverArt,
              artCoverUrl: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : (video.coverArt ? resolveMediaUrl(video.coverArt) : (video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : undefined)),
              coverPreview: video.artCoverUrl ? resolveMediaUrl(video.artCoverUrl) : (video.coverArt ? resolveMediaUrl(video.coverArt) : (video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : undefined))
            }))
          : [];

        const processedArtists: any[] = [];
        const processedPlaylists: any[] = [];
        const processedFeaturedProducers: any[] = [];

        const artistsUrl = `/api/artists`;
        const artistsResponse = await fetchJsonWithTimeout(artistsUrl, 3000);
        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          const artistsArray = Array.isArray(artistsData) ? artistsData : artistsData.artists || [];
          artistsArray.forEach((artist: any) => {
            processedArtists.push({
              ...artist,
              avatarUrl: artist.avatarUrl ? resolveMediaUrl(artist.avatarUrl) : artist.avatarUrl,
              isVerified: artist.isVerified || artist.verified || artist.is_verified || false,
            });
          });
        }

        const playlistsUrl = `/api/playlist`;
        const playlistsResponse = await fetchJsonWithTimeout(playlistsUrl, 3000);
        if (playlistsResponse.ok) {
          const playlistsData = await playlistsResponse.json();
          const playlistsArray = Array.isArray(playlistsData) ? playlistsData : playlistsData.playlists || [];
          playlistsArray.forEach((playlist: any) => {
            processedPlaylists.push({
              ...playlist,
              coverArt: playlist.coverArt ? resolveMediaUrl(playlist.coverArt) : playlist.coverArt,
            });
          });
        }

        const producersUrl = `/api/users`;
        let producersResponse = await fetchJsonWithTimeout(producersUrl, 3000);
        if (!producersResponse.ok) {
          console.warn('Producers proxy failed, retrying direct backend call');
          producersResponse = await fetchJsonWithTimeout(`${API_BASE}/api/v1/users`, 5000);
        }
        if (producersResponse.ok) {
          const producersData = await producersResponse.json();
          const producersArray = Array.isArray(producersData)
            ? producersData
            : Array.isArray(producersData.data)
            ? producersData.data
            : producersData.users || [];

          const fallbackProducers: any[] = [];
          producersArray.forEach((user: any) => {
            const role = user.role?.toString().toUpperCase();
            const normalized = {
              ...user,
              avatarUrl: user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : user.avatarUrl,
              isVerified: user.isVerified || user.verified || user.is_verified || false,
            };

            if (role === 'PRODUCER' || user.isProducer === true || !!user.producerName || !!user.producerBio) {
              processedFeaturedProducers.push(normalized);
            } else if (user.isProducer === true || !!user.producerName || !!user.producerBio) {
              fallbackProducers.push(normalized);
            }
          });

          if (processedFeaturedProducers.length === 0) {
            processedFeaturedProducers.push(...fallbackProducers.slice(0, 6));
          }
        }

        setQuickPicks(processedQuickPicks);
        setTrendingNow(processedTrendingNow);
        setTopCharts(processedTopCharts);
        setFeaturedAlbums(processedFeaturedAlbums);
        setBeats(processedBeats);
        setMusicVideos(processedMusicVideos);
        setOtherVideos(processedOtherVideos);
        setFeaturedArtists(processedArtists);
        setPlaylists(processedPlaylists);
        setFeaturedProducers(processedFeaturedProducers);

        saveCachedHomepageData({
          quickPicks: processedQuickPicks,
          featuredAlbums: processedFeaturedAlbums,
          featuredArtists: processedArtists,
          featuredProducers: processedFeaturedProducers,
          beats: processedBeats,
          trendingNow: processedTrendingNow,
          topCharts: processedTopCharts,
          musicVideos: processedMusicVideos,
          otherVideos: processedOtherVideos,
          playlists: processedPlaylists,
        });
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    const hasCache = loadCachedHomepageData();
    if (hasCache) {
      setIsLoading(false);
      void fetchHomepageData(false);
    } else {
      void fetchHomepageData(true);
    }
  }, []);

  const defaultHeroSlides = [
    {
      title: "We are fwaya (Remix)",
      subtitle: "Lusaka — Recharged",
      image: "/breadcumb3.jpg",
      href: "/browse"
    },
    {
      title: "My Dreams",
      subtitle: "Zed — Infinite",
      image: "/featured5.jpg",
      href: "/browse"
    },
    {
      title: "Birthday",
      subtitle: "Fwaya — Enjoy",
      image: "/featured6.jpg",
      href: "/browse"
    },
    {
      title: "New Single: Ignite",
      subtitle: "Fresh audio release — Track ID 18",
      image: "/featured5.jpg",
      href: "/track/18"
    },
    {
      title: "Official Video Premiere",
      subtitle: "Visual story live now — Video ID 11",
      image: "/featured6.jpg",
      href: "/videos/11"
    }
  ];

  const heroSlides = useMemo(() => {
    const slides: any[] = [];

    if (featuredSongs.length) {
      const item = featuredSongs[0];
      slides.push({
        title: item.title || 'Featured Track',
        subtitle: item.user?.displayName || item.user?.username || item.artist || 'Featured audio',
        image: item.artCoverUrl || item.coverArt || item.thumbnailUrl || item.url || '/featured5.jpg',
        primaryButton: 'Play Track',
        secondaryButton: 'View Details',
        href: item.id && item.title ? `/track/${createMediaSlug(item.title, item.id)}` : '/browse',
        primaryAction: () => {
          if (item.id) {
            playTrack({
              id: item.id,
              title: item.title,
              artist: item.user?.displayName || item.user?.username || item.artist || 'Unknown',
              imageUrl: item.artCoverUrl || item.coverArt || item.thumbnailUrl,
              audioUrl: item.url,
            });
          }
        },
        secondaryAction: () => {
          if (item.id && item.title) {
            router.push(`/track/${createMediaSlug(item.title, item.id)}`);
          }
        },
      });
    }

    if (musicVideos.length) {
      const item = musicVideos[0];
      slides.push({
        title: item.title || 'Featured Video',
        subtitle: item.user?.displayName || item.user?.username || item.artist || 'New video',
        image: item.coverPreview || item.artCoverUrl || item.thumbnailUrl || item.coverArt || item.url || '/featured6.jpg',
        primaryButton: 'Watch Video',
        secondaryButton: 'View Details',
        href: item.id ? `/videos/${item.id}` : '/videos',
        primaryAction: () => {
          if (item.id) router.push(`/videos/${item.id}?autoplay=1`);
        },
        secondaryAction: () => {
          if (item.id) router.push(`/videos/${item.id}`);
        },
      });
    }

    if (slides.length === 0) {
      return defaultHeroSlides;
    }

    return [...slides, ...defaultHeroSlides.slice(0, Math.max(0, 3 - slides.length))];
  }, [featuredSongs, musicVideos, playTrack, router]);

  const safeHeroIndex = heroSlides.length > 0 ? Math.min(heroImageIndex, heroSlides.length - 1) : 0;
  const activeHeroSlide = heroSlides[safeHeroIndex] || heroSlides[0] || defaultHeroSlides[0];

  const handleHeroSlideClick = (slide: any) => {
    if (!slide) return;

    if (slide.href) {
      router.push(slide.href);
      return;
    }

    if (typeof slide.primaryAction === 'function') {
      slide.primaryAction();
    } else if (typeof slide.secondaryAction === 'function') {
      slide.secondaryAction();
    }
  };

  const musicVideoCards = musicVideos.slice(0, 6);
  const otherVideoCards = otherVideos.slice(0, 6);
  const relatedVideoPool = [...musicVideos, ...otherVideos].filter((video: any) => video?.url).slice(0, 10);

  const openVideoPlayer = (video: any) => {
    if (!video?.id) return;
    router.push(`/videos/${video.id}?autoplay=1`);
  };

  useEffect(() => {
    setHeroImageIndex((prev) => (prev < heroSlides.length ? prev : 0));
  }, [heroSlides.length]);

  // Auto-rotate hero slides with sliding animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsSliding(true);
      // Wait for slide animation to complete before changing slide
      setTimeout(() => {
        setHeroImageIndex((prev) => (prev + 1) % Math.max(heroSlides.length, 1));
        setIsSliding(false);
      }, 800); // animation lead-in before switching
    }, 4800); // a slightly longer cycle for smoother viewing
    return () => clearInterval(interval);
  }, [heroSlides.length]);

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
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-50">
          <motion.div
            className="relative"
            animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
          >
            <Image
              src="/fwaya-lp-01.png"
              alt="Fwaya loading logo"
              width={96}
              height={96}
              className="block"
            />
          </motion.div>
        </div>
      )}

      {/* ================= MOBILE ================= */}
          <div className="lg:hidden pb-24 px-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white text-2xl font-semibold">
                {isPlaying ? (
                  <div className="relative overflow-hidden">
                    <span
                      className="text-2xl font-semibold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent"
                      style={{
                        backgroundSize: '200% 200%',
                        animation: 'fwayaColorShift 3s ease-in-out infinite'
                      }}
                    >
                      Fwaya
                    </span>
                    <style>{`
                      @keyframes fwayaColorShift {
                        0% { background-position: 0% 50%; }
                        25% { background-position: 50% 0%; }
                        50% { background-position: 100% 50%; }
                        75% { background-position: 50% 100%; }
                        100% { background-position: 0% 50%; }
                      }
                    `}</style>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <img src="/fwayalogo-01.png" alt="Fwaya" className="h-10 w-auto object-contain opacity-100" />
                    <span className="text-xl font-semibold text-white">Fwaya</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                  Get App
                </button>
                {!user && (
                  <button className="rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400">
                    Premium
                  </button>
                )}
                {user && (
                  <button
                    type="button"
                    aria-label="Premium"
                    className="rounded-full bg-purple-500 p-2.5 text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
                  >
                    <FaStar className="h-4 w-4" />
                  </button>
                )}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 hover:border-white/40 transition-colors"
                    >
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.displayName || user.username || 'User'}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-semibold text-white">
                          {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {showUserMenu && (
                      <>
                        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-3xl bg-black/95 backdrop-blur-xl shadow-xl shadow-black/50 overflow-hidden">
                          <div className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-purple-500">
                                {user.avatarUrl ? (
                                  <Image
                                    src={user.avatarUrl}
                                    alt={user.displayName || user.username || 'User'}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/default-avatar.png';
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{user.displayName || user.username}</p>
                                <p className="truncate text-xs text-white/60">{user.role?.toLowerCase()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 px-1 py-1">
                            <button
                              onClick={() => handleUserMenuNavigation(getDashboardPath(user.role))}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                            >
                              <FaHome className="w-4 h-4 text-purple-300" />
                              <span>Dashboard</span>
                            </button>
                            <button
                              onClick={() => handleUserMenuNavigation('/profile')}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                            >
                              <FaUser className="w-4 h-4 text-purple-300" />
                              <span>Profile</span>
                            </button>
                            <button
                              onClick={() => handleUserMenuNavigation('/browse')}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                            >
                              <FaCompass className="w-4 h-4 text-purple-300" />
                              <span>Browse</span>
                            </button>
                            <button
                              onClick={() => handleUserMenuNavigation('/videos')}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                            >
                              <FaFilm className="w-4 h-4 text-purple-300" />
                              <span>Videos</span>
                            </button>
                            <button
                              onClick={() => handleUserMenuNavigation('/settings')}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                            >
                              <FaCog className="w-4 h-4 text-purple-300" />
                              <span>Settings</span>
                            </button>
                            <button
                              onClick={handleUserLogout}
                              className="flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-sm text-red-400 hover:bg-white/10 transition"
                            >
                              <FaSignOutAlt className="w-4 h-4 text-red-400" />
                              <span>Logout</span>
                            </button>
                          </div>
                        </div>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowUserMenu(false)}
                        />
                      </>
                    )}
                  </div>
                )}
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

        {/* HERO SECTION - Mobile-friendly hero banner */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleHeroSlideClick(activeHeroSlide)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleHeroSlideClick(activeHeroSlide);
            }
          }}
          className="relative mb-3 overflow-hidden rounded-3xl bg-[#0d0f18] min-h-[220px] sm:min-h-[260px] cursor-pointer"
        >
          <motion.div
            key={safeHeroIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <Image
              src={activeHeroSlide?.image || '/featured5.jpg'}
              alt={activeHeroSlide?.title || 'Featured hero banner'}
              fill
              className="object-cover object-center"
            />
          </motion.div>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 py-3">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setHeroImageIndex(idx);
                }}
                className={`h-2 w-2 rounded-full transition ${idx === heroImageIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { name: "For You", key: "for-you" },
            { name: "Videos", key: "videos" },
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
                activeTab === tab.key ? "bg-purple-600 text-white" : "bg-white/5 text-white hover:bg-white/10"
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
                {renderSeeAll('quickPicks')}
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
                      audioUrl: item.audioUrl || item.url,
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

            {/* Music Videos (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Music Videos</h3>
                {renderSeeAll('videos')}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {musicVideoCards.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="w-32 flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => openVideoPlayer(item)}
                  >
                    <div className="relative aspect-[9/16]">
                      {item.coverPreview ? (
                        <div
                          className="absolute inset-0 bg-black"
                          style={{
                            backgroundImage: `url(${item.coverPreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        />
                      ) : item.url ? (
                        <video
                          src={item.url}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <FaPlay className="text-white text-xl" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-gray-300 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[10px]" />
                          <span>{getMediaViews(item).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaComment className="text-[10px]" />
                          <span>{getMediaComments(item).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown Producer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Artists (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Featured Artists</h3>
                {renderSeeAll('featuredArtists')}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <Link key={i} href={`/artists/${artist.id || artist._id}`} className="flex-shrink-0 w-28 text-center cursor-pointer">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-lg hover:shadow-xl transition-shadow mx-auto"
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
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs font-semibold truncate text-white mb-1">{artist.name || 'Unknown'}</p>
                      {artist.isVerified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white" title="Verified artist">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.793 12.2l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">{getArtistFollowers(artist)} followers</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Producers (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Producers & Beat Makers</h3>
                {renderSeeAll('featuredProducers')}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredProducers.slice(0, 6).map((producer: any, i: number) => (
                  <Link key={i} href={`/artists/${producer.id || producer._id}`} className="flex-shrink-0 w-28 text-center cursor-pointer">
                    <div 
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2 shadow-lg hover:shadow-xl transition-shadow mx-auto overflow-hidden"
                      style={{
                        backgroundImage: producer.avatarUrl ? `url(${producer.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!producer.avatarUrl && (
                        <span className="text-white font-semibold text-base">
                          {getProducerInitials(producer)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs font-semibold truncate mb-1">{getProducerDisplayName(producer)}</p>
                      {producer.isVerified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white" title="Verified producer">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.793 12.2l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400">{getProducerFollowers(producer)} followers</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Beats & Instruments (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Beats & Instruments</h3>
                {renderSeeAll('beats')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {beats.slice(0, 6).map((beat: any, i: number) => (
                  <div
                    key={i}
                    className="w-32 flex-shrink-0 cursor-pointer rounded-3xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => playTrack({
                      id: beat.id,
                      title: beat.title,
                      artist: beat.user?.displayName || beat.user?.username || 'Unknown',
                      imageUrl: beat.artCoverUrl,
                      audioUrl: beat.audioUrl || beat.url,
                      duration: beat.duration
                    })}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/10">
                      <div
                        className={`absolute inset-0 ${beat.artCoverUrl ? '' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
                        style={{
                          backgroundImage: beat.artCoverUrl ? `url(${beat.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-semibold truncate text-white mb-1">{beat.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-gray-300 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[10px]" />
                          <span>{getMediaViews(beat).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaComment className="text-[10px]" />
                          <span>{getMediaComments(beat).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-[10px] text-gray-400 truncate">{beat.user?.displayName || beat.user?.username || 'Unknown Producer'}</p>
                        {beat.user?.isVerified && (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white" title="Verified producer">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.793 12.2l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Now (mobile) */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Trending Now</h3>
                {renderSeeAll('trendingNow')}
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
                      audioUrl: item.audioUrl || item.url,
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
                {renderSeeAll('featuredAlbums')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-transparent">
                    <div 
                      className={`aspect-square ${item.artCoverUrl ? '' : 'bg-gradient-to-br from-purple-500 to-pink-500'}` }
                      style={{
                        backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="p-3 bg-transparent">
                      <p className="text-sm font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{getTrackCount(item) || 0} tracks</p>
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
                          audioUrl: track.audioUrl || track.url,
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
                {renderSeeAll('suggestedPlaylists')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[120px] bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0">
                    <div 
                      className={`w-full aspect-square ${item.coverUrl ? '' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-lg mb-2`}
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
                {renderSeeAll('trendingNow')}
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
                      audioUrl: item.audioUrl || item.url,
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
                {renderSeeAll('featuredAlbums')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-transparent">
                    <div 
                      className={`aspect-square ${item.artCoverUrl ? '' : 'bg-gradient-to-br from-purple-500 to-pink-500'}` }
                      style={{
                        backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="p-3 bg-transparent">
                      <p className="text-sm font-semibold truncate text-white mb-1">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{getTrackCount(item) || 0} tracks</p>
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
                  <div key={track.id || i} className="bg-[#080a13] p-3 rounded-lg hover:bg-[#11131c] transition-colors">
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
                          audioUrl: track.audioUrl || track.url,
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
                {renderSeeAll('suggestedPlaylists')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[120px] rounded-xl p-3 cursor-pointer hover:bg-[#11131c] transition-colors flex-shrink-0 bg-transparent">
                    <div 
                      className="w-full aspect-square bg-black rounded-lg mb-2"
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
                {renderSeeAll('trendingNow')}
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
                      audioUrl: item.audioUrl || item.url,
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
                {renderSeeAll('featuredArtists')}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <Link key={i} href={`/artists/${artist.id || artist._id}`} className="flex-shrink-0 text-center cursor-pointer">
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
                    <p className="text-[10px] text-gray-400">{getArtistFollowers(artist)} followers</p>
                  </Link>
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
                {renderSeeAll('featuredAlbums')}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {featuredAlbums.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="min-w-[calc(50%-0.375rem)] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 bg-transparent">
                    <div className="relative">
                      <div 
                        className="aspect-square bg-black"
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                    <div className="p-3 bg-transparent">
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
                  <div key={track.id || i} className="bg-[#080a13] p-3 rounded-lg hover:bg-[#11131c] transition-colors">
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
                          audioUrl: track.audioUrl || track.url,
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
                {renderSeeAll('news')}
              </div>
              <div className="space-y-3">
                {featuredArtists.slice(0, 4).map((artist: any, i: number) => (
                  <Link key={i} href={`/artists/${artist.id || artist._id}`} className="rounded-3xl bg-transparent p-4 block">
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
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-white">{artist.name || artist.username || 'Unknown Artist'}</p>
                          {artist.isVerified && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-purple-600 text-white shadow-sm shadow-purple-600/20" title="Verified artist">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.793 12.2l6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Latest update from your favorite artists</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'videos' && (
          <>
            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Music Videos</h3>
                {renderSeeAll('videos')}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {musicVideoCards.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="w-32 flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => openVideoPlayer(item)}
                  >
                    <div className="relative aspect-[9/16]">
                      <div
                        className={`absolute inset-0 ${item.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <FaPlay className="text-white text-xl" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-gray-300 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[10px]" />
                          <span>{getMediaViews(item).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaComment className="text-[10px]" />
                          <span>{getMediaComments(item).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown Producer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Other Videos</h3>
                {renderSeeAll('otherVideos')}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {otherVideoCards.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="w-32 flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => openVideoPlayer(item)}
                  >
                    <div className="relative aspect-[9/16]">
                      <div
                        className={`absolute inset-0 ${item.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
                        style={{
                          backgroundImage: item.artCoverUrl ? `url(${item.artCoverUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <FaPlay className="text-white text-xl" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate text-white">{item.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-gray-300 mb-1">
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="text-[10px]" />
                          <span>{getMediaViews(item).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaComment className="text-[10px]" />
                          <span>{getMediaComments(item).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{item.user?.displayName || item.user?.username || 'Unknown Artist'}</p>
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
                {renderSeeAll('podcasts')}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {featuredArtists.slice(0, 6).map((artist: any, i: number) => (
                  <Link key={i} href={`/artists/${artist.id || artist._id}`} className="flex-shrink-0 text-center cursor-pointer">
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
                    <p className="text-[10px] text-gray-400">{getArtistFollowers(artist)} followers</p>
                  </Link>
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
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleHeroSlideClick(activeHeroSlide)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleHeroSlideClick(activeHeroSlide);
              }
            }}
            className="relative rounded-3xl mb-10 overflow-hidden h-80 cursor-pointer"
          >
            <motion.div
              key={safeHeroIndex}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <Image
                src={activeHeroSlide?.image || '/featured5.jpg'}
                alt={activeHeroSlide?.title || 'Featured hero banner'}
                fill
                className="object-cover"
              />
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-4 py-4">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setHeroImageIndex(idx);
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition ${idx === heroImageIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
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
                    className={`aspect-[4/5] ${item.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'} group-hover:scale-105 transition-transform`}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(getSectionHref('featuredAlbums'))}
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
                >
                  See All
                </button>
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

          {/* ===== PRODUCERS & BEAT MAKERS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Producers & Beat Makers
              </h3>
            </div>

              <div className="grid grid-cols-6 gap-3">
              {featuredProducers.length === 0 ? (
                <div className="col-span-6 rounded-xl border border-dashed border-white/10 bg-[#080a13] p-6 text-center text-sm text-gray-400">
                  No producers found right now.
                </div>
              ) : (
                featuredProducers.slice(0, 6).map((producer: any, i: number) => (
                  <Link
                    key={i}
                    href={`/artists/${producer.id || producer._id}`}
                    className="text-center cursor-pointer hover:bg-transparent rounded-xl p-3 transition-colors"
                  >
                    <div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-2 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundImage: producer.avatarUrl ? `url(${producer.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {!producer.avatarUrl && (
                        <span className="text-white font-semibold text-base">
                          {getProducerInitials(producer)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold truncate mb-1">
                      {getProducerDisplayName(producer)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getProducerFollowers(producer)} followers
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* ===== MUSIC VIDEOS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Music Videos
              </h3>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {musicVideoCards.map((video: any, i: number) => (
                <div 
                  key={i} 
                  role="button"
                  tabIndex={0}
                  onClick={() => openVideoPlayer(video)}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="relative aspect-[9/16]">
                    {video.coverPreview ? (
                      <div
                        className="absolute inset-0 bg-black"
                        style={{
                          backgroundImage: `url(${video.coverPreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    ) : video.url ? (
                      <video
                        src={video.url}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <FaPlay className="text-white text-xl" />
                    </div>
                  </div>

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-medium truncate text-white">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {video.user?.displayName || video.user?.username || 'Unknown Producer'}
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
                <Link
                  key={i}
                  href={`/artists/${artist.id || artist._id}`}
                  className="text-center cursor-pointer hover:bg-transparent rounded-xl p-3 transition-colors"
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
                </Link>
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
                    className={`aspect-[4/5] ${track.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'} group-hover:scale-105 transition-transform`}
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
                    className={`aspect-[4/5] ${playlist.coverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-lg group-hover:scale-105 transition-transform`}
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

          {/* ===== OTHER VIDEOS ===== */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Other Videos
              </h3>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {otherVideoCards.map((video: any, i: number) => (
                <div 
                  key={i} 
                  role="button"
                  tabIndex={0}
                  onClick={() => openVideoPlayer(video)}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="relative aspect-[9/16]">
                    <div
                      className={`absolute inset-0 ${video.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
                      style={{
                        backgroundImage: video.artCoverUrl ? `url(${video.artCoverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <FaPlay className="text-white text-xl" />
                    </div>
                  </div>

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-medium truncate text-white">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {video.user?.displayName || video.user?.username || 'Unknown Artist'}
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
                    className="flex gap-3 p-3 rounded-xl hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-400">{index + 1}</span>
                    </div>
                    <div
                      className={
                        "w-10 h-10 rounded-lg flex-shrink-0 " +
                        (track.artCoverUrl ? "" : "bg-gradient-to-br from-purple-500 to-pink-500")
                      }
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

          {/* ===== BEATS & INSTRUMENTS ===== */}
          <div className="mt-8 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Beats & Instruments
              </h3>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {beats.slice(0, 6).map((beat: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div
                    className={`aspect-[4/5] ${beat.artCoverUrl ? 'bg-black' : 'bg-gradient-to-br from-purple-500 to-pink-500'} group-hover:scale-105 transition-transform`}
                    style={{
                      backgroundImage: beat.artCoverUrl ? `url(${beat.artCoverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />

                  <div className="p-3 bg-[#080a13]">
                    <p className="text-xs font-medium truncate text-white">
                      {beat.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {beat.user?.displayName || beat.user?.username || 'Unknown Producer'}
                    </p>
                  </div>
                </div>
              ))}
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
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-transparent transition-colors cursor-pointer">
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

      <div className="border-t border-white/10 bg-black/40 py-4 px-5 text-center lg:px-10">
        <Link href="/privacy" className="text-sm text-gray-400 hover:text-white underline">
          Privacy Policy
        </Link>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

    </>
  );
}
