import { useState, useContext, createContext, useEffect, ReactNode } from 'react';

// Track interface
interface Track {
  id: string | number;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl: string;
  url?: string; // For backward compatibility
  coverArt?: string;
  duration?: number;
  isDRMProtected?: boolean;
}

// Create a context for global player state
interface GlobalPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  setCurrentTrack: (track: Track | null) => void;
  togglePlay: () => void;
  playTrack: (track: Track) => void;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | null>(null);

export const GlobalPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
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