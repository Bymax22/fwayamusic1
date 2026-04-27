"use client";
import { useState, useContext, createContext, ReactNode, useRef, useEffect } from 'react';

// Track interface
interface Track {
  id: string | number;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl?: string;
  url?: string; // For backward compatibility
  coverArt?: string;
  duration?: number;
  isDRMProtected?: boolean;
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
}

// Create a context for global player state
interface GlobalPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  playTrack: (track: Track | Record<string, unknown>) => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | null>(null);

export const GlobalPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      const audio = audioRef.current;

      // Set up event listeners
      const updateDuration = () => {
        console.log('GlobalPlayer: Duration loaded:', audio.duration);
        setDuration(audio.duration || 0);
      };

      const updateTime = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        console.log('GlobalPlayer: Track ended');
        setIsPlaying(false);
      };

      const handleLoadStart = () => {
        console.log('GlobalPlayer: Load started');
        setIsLoading(true);
      };

      const handleCanPlay = () => {
        console.log('GlobalPlayer: Can play now');
        setIsLoading(false);
      };

      const handleError = (e: Event) => {
        console.error('GlobalPlayer: Audio error:', e);
        setIsLoading(false);
        setIsPlaying(false);
      };

      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      // Cleanup function
      return () => {
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        audio.pause();
      };
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack?.audioUrl) {
        audio.play().catch((err) => {
          console.error("GlobalPlayer: Audio play() failed:", err);
          setIsLoading(false);
        });
        setIsPlaying(true);
      }
    }
  };

  const playTrack = (track: Track | Record<string, unknown>) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Accept incoming partial/extended objects; coerce to Partial<Track> for safe merging
    const incoming = track as Partial<Track> & Record<string, unknown>;
    const newTrack = {
      id: incoming.id as string | number,
      title: incoming.title || '',
      artist: incoming.artist || '',
      imageUrl: (incoming.imageUrl as string) || (incoming.coverArt as string) || undefined,
      audioUrl: (incoming.audioUrl as string) || (incoming.url as string) || undefined,
      duration: incoming.duration as number | undefined,
      isDRMProtected: incoming.isDRMProtected as boolean | undefined,
      accessType: (incoming.accessType as Track['accessType']) ?? 'FREE',
      price: incoming.price as number | undefined,
      currency: (incoming.currency as string) ?? 'ZMW'
    };

    setCurrentTrack(newTrack);

    if (newTrack.audioUrl) {
      const src = newTrack.audioUrl.trim();
      console.log('GlobalPlayer: Setting audio source:', src);

      if (src && audio.src !== src) {
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        audio.src = src;
        audio.load();
        setCurrentTime(0);
        setDuration(0);

        // Auto-play when track is loaded
        const playWhenReady = () => {
          console.log('GlobalPlayer: Audio can play, starting playback');
          audio.removeEventListener('canplay', playWhenReady);
          audio.play().catch((err) => {
            console.error("GlobalPlayer: Auto-play failed:", err);
            setIsLoading(false);
          });
        };
        audio.addEventListener('canplay', playWhenReady);
      }

      setIsPlaying(true);
    } else {
      console.log('GlobalPlayer: No valid audio URL provided');
      setIsPlaying(false);
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    setIsMuted((prev) => {
      const next = !prev;
      if (audio) {
        audio.volume = next ? 0 : volume;
      }
      return next;
    });
  };

  // Update audio volume when volume or mute state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <GlobalPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isLoading,
      setCurrentTrack,
      togglePlay,
      playTrack,
      seekTo,
      setVolume,
      toggleMute
    }}>
      {children}
    </GlobalPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within a GlobalPlayerProvider');
  }
  return context;
};