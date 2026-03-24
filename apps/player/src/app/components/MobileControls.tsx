'use client'

import { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart, MoreHorizontal, Download, Settings, Bluetooth, Airplay } from 'lucide-react'

interface MobileControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  isLiked: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleShuffle: () => void
  onCycleRepeat: () => void
  onToggleLike: () => void
  onSkipBack: () => void
  onSkipForward: () => void
}

export function MobileControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffled,
  repeatMode,
  isLiked,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onToggleLike,
  onSkipBack,
  onSkipForward
}: MobileControlsProps) {
  const [showVolume, setShowVolume] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 px-4 py-3 safe-area-bottom">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg pointer-events-none"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded-full transition-colors ${
            isShuffled ? 'text-pink-500 bg-pink-500/20' : 'text-gray-400 active:text-white'
          }`}
        >
          <Shuffle size={20} />
        </button>

        <button
          onClick={onSkipBack}
          className="text-gray-400 active:text-white p-3 transition-colors"
        >
          <SkipBack size={24} />
        </button>

        <button
          onClick={onPlayPause}
          className="bg-pink-600 active:bg-pink-700 text-white p-4 rounded-full transition-colors shadow-lg animate-pulse-glow"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button
          onClick={onSkipForward}
          className="text-gray-400 active:text-white p-3 transition-colors"
        >
          <SkipForward size={24} />
        </button>

        <button
          onClick={onCycleRepeat}
          className={`p-2 rounded-full transition-colors ${
            repeatMode !== 'none' ? 'text-pink-500 bg-pink-500/20' : 'text-gray-400 active:text-white'
          }`}
        >
          <Repeat size={20} />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleLike}
            className={`p-2 rounded-full transition-colors ${
              isLiked ? 'text-pink-500' : 'text-gray-400 active:text-white'
            }`}
          >
            <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          <button className="text-gray-400 active:text-white p-2 transition-colors">
            <Download size={18} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="text-gray-400 active:text-white p-2 transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="text-gray-400 active:text-white p-2 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Volume Slider */}
      {showVolume && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <VolumeX size={16} className="text-gray-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <Volume2 size={16} className="text-gray-400" />
          </div>
        </div>
      )}

      {/* More Options */}
      {showMoreOptions && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <Bluetooth size={16} />
              <span className="text-sm">Bluetooth</span>
            </button>
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <Airplay size={16} />
              <span className="text-sm">AirPlay</span>
            </button>
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <Settings size={16} />
              <span className="text-sm">Settings</span>
            </button>
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <Download size={16} />
              <span className="text-sm">Download</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}