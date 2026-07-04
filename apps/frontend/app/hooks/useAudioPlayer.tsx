"use client";
import { useState, useContext, createContext, ReactNode, useRef, useEffect } from 'react';

// Track interface
interface Track {
  id: string | number;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  url?: string; // For backward compatibility
  coverArt?: string;
  duration?: number;
  type?: 'AUDIO' | 'VIDEO' | 'PODCAST' | 'LIVE_STREAM';
  isDRMProtected?: boolean;
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
  currency?: string;
}

type AudioQuality = 'low' | 'normal' | 'high';

// Create a context for global player state
interface GlobalPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  playTrack: (track: Track | Record<string, unknown>) => void;
  stopTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  registerVideoElement: (videoElement: HTMLVideoElement | null) => void;
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
  const [audioQuality, setAudioQuality] = useState<AudioQuality>('high');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideoUrl = (url?: string) => Boolean(url && /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(url));
  const isVideoTrack = (track?: Track | null) => track?.type === 'VIDEO' || isVideoUrl(track?.videoUrl || track?.audioUrl || track?.url);

  const getActiveMedia = (track?: Track | null) => {
    if (isVideoTrack(track)) {
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
      }
      return videoRef.current;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return audioRef.current;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;
    const video = videoRef.current || document.createElement('video');
    videoRef.current = video;

    const updateDuration = () => {
      const activeMedia = isVideoTrack(currentTrack) ? video : audio;
      const duration = activeMedia.duration || 0;
      setDuration(duration);
    };

    const updateTime = () => {
      const activeMedia = isVideoTrack(currentTrack) ? video : audio;
      setCurrentTime(activeMedia.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('GlobalPlayer: Media error:', e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    [audio, video].forEach((media) => {
      media.addEventListener('loadedmetadata', updateDuration);
      media.addEventListener('timeupdate', updateTime);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('loadstart', handleLoadStart);
      media.addEventListener('canplay', handleCanPlay);
      media.addEventListener('error', handleError);
      media.addEventListener('playing', handlePlaying);
      media.addEventListener('pause', handlePause);
      media.volume = isMuted ? 0 : volume;
      media.muted = isMuted;
      media.preload = 'auto';
      media.crossOrigin = 'anonymous';
    });

    return () => {
      [audio, video].forEach((media) => {
        media.removeEventListener('loadedmetadata', updateDuration);
        media.removeEventListener('timeupdate', updateTime);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('loadstart', handleLoadStart);
        media.removeEventListener('canplay', handleCanPlay);
        media.removeEventListener('error', handleError);
        media.removeEventListener('playing', handlePlaying);
        media.removeEventListener('pause', handlePause);
        media.pause();
      });
    };
  }, [currentTrack, isMuted, volume]);

  const applyAudioQualityToUrl = (rawUrl: string) => {
    if (!rawUrl) return rawUrl;
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return trimmed;

    try {
      const url = new URL(trimmed);
      if (url.searchParams.has('quality')) return url.href;

      if (url.pathname.includes('/api/v1/media/') && url.pathname.includes('/stream')) {
        url.searchParams.set('quality', audioQuality);
        return url.href;
      }

      if (url.hostname.includes('cloudinary.com') && url.pathname.includes('/upload/')) {
        const segments = url.pathname.split('/');
        const uploadIndex = segments.findIndex((segment) => segment === 'upload');
        const hasQualityTransform = segments.some((segment) => segment.startsWith('q_'));

        if (uploadIndex >= 0 && !hasQualityTransform) {
          const qualityTransform = audioQuality === 'high'
            ? 'q_auto:best'
            : audioQuality === 'normal'
              ? 'q_auto:good'
              : 'q_auto:low';

          segments.splice(uploadIndex + 1, 0, qualityTransform);
          url.pathname = segments.join('/');
          return url.href;
        }
      }

      return url.href;
    } catch (_error) {
      return trimmed;
    }
  };

  const togglePlay = () => {
    if (typeof window === 'undefined') {
      console.error('GlobalPlayer: togglePlay called on server side');
      return;
    }

    const media = getActiveMedia(currentTrack);
    const mediaUrl = currentTrack?.type === 'VIDEO' ? (currentTrack?.videoUrl || currentTrack?.audioUrl || currentTrack?.url) : (currentTrack?.audioUrl || currentTrack?.url);
    if (!mediaUrl) {
      console.error('GlobalPlayer: No media URL available in current track');
      return;
    }

    const normalizedUrl = applyAudioQualityToUrl(mediaUrl);
    if (!media.src || media.src !== normalizedUrl) {
      media.src = normalizedUrl;
      media.preload = 'auto';
      media.crossOrigin = 'anonymous';
      media.muted = isMuted;
      media.volume = isMuted ? 0 : volume;
      media.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      media.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((err) => {
        console.error('GlobalPlayer: Play failed:', err);
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  };

  const playTrack = (track: Track | Record<string, unknown>) => {
    if (typeof window === 'undefined') {
      console.error('GlobalPlayer: playTrack called on server side');
      return;
    }

    const incoming = track as Partial<Track> & Record<string, unknown>;
    const newTrack = {
      id: incoming.id as string | number,
      title: incoming.title || '',
      artist: incoming.artist || '',
      imageUrl: (incoming.imageUrl as string) || (incoming.coverArt as string) || undefined,
      audioUrl: (incoming.audioUrl as string) || (incoming.url as string) || undefined,
      videoUrl: incoming.videoUrl as string | undefined,
      duration: incoming.duration as number | undefined,
      type: (incoming.type as Track['type']) || (isVideoUrl(incoming.videoUrl as string | undefined) ? 'VIDEO' : 'AUDIO'),
      isDRMProtected: incoming.isDRMProtected as boolean | undefined,
      accessType: (incoming.accessType as Track['accessType']) ?? 'FREE',
      price: incoming.price as number | undefined,
      currency: (incoming.currency as string) ?? 'ZMW'
    };

    const mediaUrl = newTrack.type === 'VIDEO' ? (newTrack.videoUrl || newTrack.audioUrl) : newTrack.audioUrl;
    if (!mediaUrl) {
      console.error('GlobalPlayer: No media URL provided in track:', newTrack);
      return;
    }

    setCurrentTrack(newTrack as Track);
    setIsLoading(true);

    const media = getActiveMedia(newTrack as Track);
    const src = applyAudioQualityToUrl(mediaUrl.trim());

    audioRef.current?.pause();
    videoRef.current?.pause();
    media.currentTime = 0;
    media.src = src;
    media.crossOrigin = 'anonymous';
    media.preload = 'auto';
    media.muted = isMuted;
    media.volume = isMuted ? 0 : volume;
    media.load();

    setCurrentTime(0);
    setDuration(0);

    media.play().then(() => {
      setIsPlaying(true);
      setIsLoading(false);
    }).catch((err) => {
      console.error('GlobalPlayer: Play failed:', err);
      setIsPlaying(false);
      setIsLoading(false);
    });
  };

  const seekTo = (time: number) => {
    if (typeof window === 'undefined') return;
    const media = getActiveMedia(currentTrack);
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    if (typeof window === 'undefined') {
      setVolumeState(newVolume);
      return;
    }

    setVolumeState(newVolume);
    [audioRef.current, videoRef.current].forEach((media) => {
      if (media) {
        media.volume = isMuted ? 0 : newVolume;
      }
    });
  };

  const registerVideoElement = (videoElement: HTMLVideoElement | null) => {
    if (typeof window === 'undefined') return;

    const previousVideo = videoRef.current;
    if (videoElement) {
      videoRef.current = videoElement;
      videoElement.muted = isMuted;
      videoElement.volume = isMuted ? 0 : volume;
      videoElement.preload = 'auto';
      videoElement.crossOrigin = 'anonymous';

      if (currentTrack?.type === 'VIDEO') {
        const mediaUrl = applyAudioQualityToUrl(currentTrack.videoUrl || currentTrack.audioUrl || currentTrack.url || '');
        if (mediaUrl && videoElement.src !== mediaUrl) {
          videoElement.src = mediaUrl;
        }
        videoElement.currentTime = previousVideo?.currentTime ?? videoElement.currentTime ?? 0;
        if (isPlaying) {
          void videoElement.play().catch((err) => {
            console.warn('GlobalPlayer: Failed to resume registered video element:', err);
          });
        }
      }

      if (previousVideo && previousVideo !== videoElement) {
        previousVideo.pause();
      }
      return;
    }

    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.preload = 'auto';
      videoRef.current.crossOrigin = 'anonymous';
    }
  };

  const toggleMute = () => {
    if (typeof window === 'undefined') {
      setIsMuted((prev) => !prev);
      return;
    }

    setIsMuted((prev) => {
      const next = !prev;
      [audioRef.current, videoRef.current].forEach((media) => {
        if (media) {
          media.volume = next ? 0 : volume;
        }
      });
      return next;
    });
  };

  const stopTrack = () => {
    if (typeof window === 'undefined') return;
    [audioRef.current, videoRef.current].forEach((media) => {
      if (media) {
        media.pause();
        media.currentTime = 0;
        media.src = '';
      }
    });
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedAudioQuality = localStorage.getItem('fwaya-audio-quality') as AudioQuality | null;
    if (storedAudioQuality === 'low' || storedAudioQuality === 'normal' || storedAudioQuality === 'high') {
      setAudioQuality(storedAudioQuality);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fwaya-audio-quality', audioQuality);
  }, [audioQuality]);

  // Update audio volume when volume or mute state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    [audioRef.current, videoRef.current].forEach((media) => {
      if (media) {
        media.volume = isMuted ? 0 : volume;
      }
    });
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
      toggleMute,
      stopTrack,
      registerVideoElement,
      audioQuality,
      setAudioQuality
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