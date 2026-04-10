"use client";

import { Play, Pause } from "lucide-react";

export default function NowPlayingPanel({
  track,
  isPlaying,
  onPlayPause,
}: any) {
  return (
    <div className="h-full p-4 glass flex flex-col gap-4">

      {/* Album Art */}
      <img
        src={track.imageUrl}
        className="w-full h-[220px] object-cover rounded-xl"
      />

      {/* Info */}
      <div>
        <h2 className="text-lg font-semibold">{track.title}</h2>
        <p className="text-white/60 text-sm">{track.artist}</p>
      </div>

      {/* Progress */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-orange-500 w-1/3" />
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        <button
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center"
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>

      {/* Up Next (Mock) */}
      <div className="mt-4 flex flex-col gap-3">
        <p className="text-white/60 text-sm">Up Next</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-md" />
            <div className="text-sm text-white/70">Track {i}</div>
          </div>
        ))}
      </div>
    </div>
  );
}