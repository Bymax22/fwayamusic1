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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col">
      {/* Header */}
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">{metadata.mediaInfo.title}</h1>
        <p className="text-gray-300">{metadata.mediaInfo.artist}</p>
      </div>

      {/* Visualizer */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AudioVisualizer
          audioElement={audioRef.current}
          audioContext={audioContextRef.current}
          isPlaying={isPlaying}
        />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/20 backdrop-blur-sm">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-6 mb-4">
          <button className="text-white hover:text-blue-400 transition-colors">
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlay}
            className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button className="text-white hover:text-blue-400 transition-colors">
            <SkipForward size={24} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-2">
          <button onClick={toggleMute} className="text-white hover:text-blue-400">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
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
    </div>
  )
}