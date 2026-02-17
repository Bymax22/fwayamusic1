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
  // Accept Track plus optional extra metadata (accessType, price, etc.) to allow callers to pass richer objects
  playTrack: (track: Track & Record<string, unknown>) => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | null>(null);

export const GlobalPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track: Track) => {
    setCurrentTrack({
      ...track,
      accessType: track.accessType ?? 'FREE',
      price: track.price,
      currency: track.currency ?? 'ZMW'
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