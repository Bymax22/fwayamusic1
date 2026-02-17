"use client";
import { useState, useContext, createContext, ReactNode } from 'react';

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
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  // Accept Track or a plain object with extra metadata (accessType, price, etc.)
  playTrack: (track: Track | Record<string, unknown>) => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | null>(null);

export const GlobalPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track: Track) => {
    // Accept incoming partial/extended objects; coerce to Partial<Track> for safe merging
    const incoming = track as Partial<Track> & Record<string, unknown>;
    setCurrentTrack({
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
    });
    setIsPlaying(true);
  };

  return (
    <GlobalPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      setCurrentTrack,
      togglePlay,
      playTrack
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