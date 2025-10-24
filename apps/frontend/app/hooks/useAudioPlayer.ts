import { useState } from 'react';

export interface Track {
  id: string | number;
  title: string;
  artist: string;
  url: string;
  coverArt: string;
  duration: number;
  likes?: number;
  genre?: string;
  isDRMProtected?: boolean; // <-- Add this line for DRM support
}

export const useAudioPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Add actual audio player logic here
  };

  return {
    currentTrack,
    isPlaying,
    togglePlay,
    setCurrentTrack
  };
};