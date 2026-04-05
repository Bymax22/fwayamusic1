import { useCallback } from 'react';
import { usePlayerStore } from './store';
import type { Track } from '@fwaya-music/types';

export const usePlayer = () => {
  const store = usePlayerStore();

  const play = useCallback((track: Track) => {
    store.setCurrentTrack(track);
    store.setIsPlaying(true);
    store.addToRecentlyPlayed(track.id);
  }, [store]);

  const pause = useCallback(() => {
    store.setIsPlaying(false);
  }, [store]);

  const resume = useCallback(() => {
    store.setIsPlaying(true);
  }, [store]);

  const togglePlayPause = useCallback(() => {
    store.setIsPlaying(!store.isPlaying);
  }, [store]);

  const toggleLike = useCallback((trackId: string) => {
    store.toggleLike(trackId);
  }, [store]);

  const next = useCallback(() => {
    store.next();
  }, [store]);

  const previous = useCallback(() => {
    store.previous();
  }, [store]);

  const setQueue = useCallback((tracks: Track[]) => {
    store.setQueue(tracks);
    if (tracks.length > 0) {
      store.setCurrentTrack(tracks[0]);
    }
  }, [store]);

  return {
    // State
    currentTrack: store.currentTrack,
    isPlaying: store.isPlaying,
    likedTracks: store.likedTracks,
    recentlyPlayed: store.recentlyPlayed,
    queue: store.queue,
    currentIndex: store.currentIndex,

    // Actions
    play,
    pause,
    resume,
    togglePlayPause,
    toggleLike,
    next,
    previous,
    setQueue,
  };
};
