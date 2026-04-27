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

      console.log('GlobalPlayer: Created new audio element');

      // Set up permanent event listeners
      const updateDuration = () => {
        const duration = audio.duration || 0;
        console.log('GlobalPlayer: Duration loaded:', duration);
        setDuration(duration);
      };

      const updateTime = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        console.log('GlobalPlayer: Track ended');
        setIsPlaying(false);
        setCurrentTime(0);
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

      const handlePlaying = () => {
        console.log('GlobalPlayer: Audio started playing');
        setIsPlaying(true);
        setIsLoading(false);
      };

      const handlePause = () => {
        console.log('GlobalPlayer: Audio paused');
        setIsPlaying(false);
      };

      audio.addEventListener("loadedmetadata", updateDuration);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);
      audio.addEventListener("playing", handlePlaying);
      audio.addEventListener("pause", handlePause);

      // Set initial volume
      audio.volume = volume;
      audio.muted = isMuted;

      // Cleanup function
      return () => {
        console.log('GlobalPlayer: Cleaning up audio element');
        audio.removeEventListener("loadedmetadata", updateDuration);
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        audio.removeEventListener("playing", handlePlaying);
        audio.removeEventListener("pause", handlePause);
        audio.pause();
      };
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('GlobalPlayer: No audio element available');
      return;
    }

    const audioUrl = currentTrack?.audioUrl || currentTrack?.url;
    if (!audioUrl) {
      console.error('GlobalPlayer: No audio URL available in current track');
      return;
    }

    if (isPlaying) {
      console.log('GlobalPlayer: Pausing playback');
      audio.pause();
      setIsPlaying(false);
    } else {
      console.log('GlobalPlayer: Starting/resuming playback');
      setIsLoading(true);

      audio.play().then(() => {
        console.log('GlobalPlayer: Playback started successfully');
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((err) => {
        console.error("GlobalPlayer: Play failed:", err);
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  };

  const playTrack = (track: Track | Record<string, unknown>) => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('GlobalPlayer: No audio element available');
      return;
    }

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

    console.log('GlobalPlayer: playTrack called with:', newTrack);

    if (!newTrack.audioUrl) {
      console.error('GlobalPlayer: No audio URL provided in track:', newTrack);
      return;
    }

    setCurrentTrack(newTrack);
    setIsLoading(true);

    const src = newTrack.audioUrl.trim();
    console.log('GlobalPlayer: Setting audio source to:', src);

    // Stop any current playback
    audio.pause();
    audio.currentTime = 0;

    // Clear any existing event listeners to avoid duplicates
    audio.removeEventListener('canplay', audio.canplayHandler);
    audio.removeEventListener('error', audio.errorHandler);
    audio.removeEventListener('loadstart', audio.loadstartHandler);

    // Set up event handlers
    const handleCanPlay = () => {
      console.log('GlobalPlayer: Audio can play, starting playback');
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', audio.errorHandler);
      audio.removeEventListener('loadstart', audio.loadstartHandler);

      audio.play().then(() => {
        console.log('GlobalPlayer: Audio started playing successfully');
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((err) => {
        console.error("GlobalPlayer: Auto-play failed:", err);
        setIsPlaying(false);
        setIsLoading(false);
      });
    };

    const handleError = (e: Event) => {
      console.error('GlobalPlayer: Audio load error:', e);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', audio.loadstartHandler);
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('GlobalPlayer: Audio load started');
      setIsLoading(true);
    };

    // Store handlers on audio element to allow removal
    audio.canplayHandler = handleCanPlay;
    audio.errorHandler = handleError;
    audio.loadstartHandler = handleLoadStart;

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    // Set audio properties
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.src = src;
    audio.load();

    setCurrentTime(0);
    setDuration(0);
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
      console.log('GlobalPlayer: Volume set to:', audio.volume);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    setIsMuted((prev) => {
      const next = !prev;
      if (audio) {
        audio.volume = next ? 0 : volume;
        console.log('GlobalPlayer: Mute toggled, volume now:', audio.volume);
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