import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@fwaya-music/types';

interface PlayerStore {
  currentTrack: Track | null;
  isPlaying: boolean;
  likedTracks: string[];
  recentlyPlayed: string[];
  queue: Track[];
  currentIndex: number;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLike: (trackId: string) => void;
  addToRecentlyPlayed: (trackId: string) => void;
  setQueue: (tracks: Track[]) => void;
  next: () => void;
  previous: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      likedTracks: [],
      recentlyPlayed: [],
      queue: [],
      currentIndex: -1,

      setCurrentTrack: (track) =>
        set({ currentTrack: track }),

      setIsPlaying: (playing) =>
        set({ isPlaying: playing }),

      toggleLike: (trackId: string) =>
        set((state) => ({
          likedTracks: state.likedTracks.includes(trackId)
            ? state.likedTracks.filter((id) => id !== trackId)
            : [...state.likedTracks, trackId],
        })),

      addToRecentlyPlayed: (trackId: string) =>
        set((state) => ({
          recentlyPlayed: [
            trackId,
            ...state.recentlyPlayed.filter((id) => id !== trackId),
          ].slice(0, 50), // Keep only last 50
        })),

      setQueue: (tracks) =>
        set({ queue: tracks, currentIndex: 0 }),

      next: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
          set({
            currentIndex: currentIndex + 1,
            currentTrack: queue[currentIndex + 1],
          });
        }
      },

      previous: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0) {
          set({
            currentIndex: currentIndex - 1,
            currentTrack: queue[currentIndex - 1],
          });
        }
      },
    }),
    {
      name: 'player-store',
      partialize: (state) => ({
        likedTracks: state.likedTracks,
        recentlyPlayed: state.recentlyPlayed,
      }),
    }
  )
);
