'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { decryptAudioData, validateLicense, getDeviceInfo, FwayaFileMetadata } from '@fwaya/player-sdk'
import { AudioVisualizer } from './AudioVisualizer'

interface AdvancedPlayerProps {
  metadata: FwayaFileMetadata
  encryptedData: ArrayBuffer
}

export function AdvancedPlayer({ metadata, encryptedData }: AdvancedPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Decrypt and validate license on mount
  useEffect(() => {
    initializePlayer()
  }, [])

  const initializePlayer = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get device info
      const deviceInfo = getDeviceInfo()

      // Validate license
      const isValid = await validateLicense(
        metadata.mediaId,
        metadata.licenseKey,
        deviceInfo.deviceId
      )

      if (!isValid) {
        throw new Error('Invalid license or device not authorized')
      }

      // Decrypt audio data
      const decrypted = await decryptAudioData(
        encryptedData,
        metadata.licenseKey,
        metadata.encryption.iv,
        metadata.encryption.authTag
      )

      setAudioData(decrypted)

      // Create audio element with decrypted data
      if (audioRef.current) {
        const blob = new Blob([decrypted], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        audioRef.current.src = url

        // Initialize audio context for visualizer
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize player')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Decrypting and loading track...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">Playback Error</div>
          <div className="text-gray-300">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex flex-col">
      {/* Header */}
      <div className="p-6 sm:p-8 text-white border-b border-white/10 backdrop-blur-sm">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1">{metadata.mediaInfo.title}</h1>
        <p className="text-gray-300 text-lg">{metadata.mediaInfo.artist}</p>
      </div>

      {/* Visualizer */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <AudioVisualizer
          audioElement={audioRef.current}
          audioContext={audioContextRef.current}
          isPlaying={isPlaying}
        />
      </div>

      {/* Controls */}
      <div className="p-6 sm:p-8 bg-gradient-to-t from-black/80 to-black/40 backdrop-blur-md border-t border-white/10">
        {/* Progress Bar */}
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(55, 65, 81) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(55, 65, 81) 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-300 mt-2">
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-8">
          <button 
            className="text-gray-400 hover:text-white hover:scale-110 transition-all"
            title="Previous track"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white flex items-center justify-center shadow-lg hover:shadow-pink-500/50 transition-all transform hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>

          <button 
            className="text-gray-400 hover:text-white hover:scale-110 transition-all"
            title="Next track"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-4 bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
          <button 
            onClick={toggleMute} 
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${(isMuted ? 0 : volume) * 100}%, rgb(55, 65, 81) ${(isMuted ? 0 : volume) * 100}%, rgb(55, 65, 81) 100%)`
            }}
          />
          <span className="text-sm text-gray-400 w-8 text-right flex-shrink-0">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}