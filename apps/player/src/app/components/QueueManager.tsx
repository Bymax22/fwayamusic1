'use client'

import { useState, useEffect } from 'react'
import { FwayaFileMetadata } from '@fwaya/player-sdk'
import { List, X, Play, Pause, MoreHorizontal, Heart, Clock } from 'lucide-react'

interface QueueItem {
  id: string
  metadata: FwayaFileMetadata
  isPlaying: boolean
  isLiked: boolean
}

interface QueueManagerProps {
  currentTrack: FwayaFileMetadata | null
  isPlaying: boolean
  onTrackSelect: (track: FwayaFileMetadata) => void
  onPlayPause: () => void
}

export function QueueManager({
  currentTrack,
  isPlaying,
  onTrackSelect,
  onPlayPause
}: QueueManagerProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [upNext, setUpNext] = useState<QueueItem[]>([])

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('fwaya-queue')
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue)
        setQueue(parsedQueue)
      } catch (error) {
        console.error('Failed to load queue:', error)
      }
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fwaya-queue', JSON.stringify(queue))
  }, [queue])

  // Update up next based on current track
  useEffect(() => {
    if (currentTrack) {
      const currentIndex = queue.findIndex(item => item.id === currentTrack.mediaId.toString())
      if (currentIndex !== -1) {
        setUpNext(queue.slice(currentIndex + 1, currentIndex + 4))
      }
    }
  }, [currentTrack, queue])

  const addToQueue = (metadata: FwayaFileMetadata) => {
    const newItem: QueueItem = {
      id: metadata.mediaId.toString(),
      metadata,
      isPlaying: false,
      isLiked: false
    }

    setQueue(prev => {
      // Don't add duplicates
      if (prev.some(item => item.id === newItem.id)) {
        return prev
      }
      return [...prev, newItem]
    })
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  const toggleLike = (id: string) => {
    setQueue(prev => prev.map(item =>
      item.id === id ? { ...item, isLiked: !item.isLiked } : item
    ))
  }

  const clearQueue = () => {
    setQueue([])
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Queue Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2"
      >
        <List size={20} />
        <span className="hidden md:inline">Queue</span>
        {queue.length > 0 && (
          <span className="bg-pink-600 text-white text-xs rounded-full px-2 py-1">
            {queue.length}
          </span>
        )}
      </button>

      {/* Queue Panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:relative md:inset-auto md:bg-transparent md:backdrop-blur-none">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 md:relative md:w-full md:h-96 md:rounded-xl md:border">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-white font-bold text-lg">Queue</h3>
              <div className="flex items-center space-x-2">
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Current Track */}
            {currentTrack && (
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onPlayPause}
                    className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{currentTrack.mediaInfo.title}</p>
                    <p className="text-gray-400 text-sm truncate">{currentTrack.mediaInfo.artist}</p>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {formatDuration(currentTrack.mediaInfo.duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Up Next */}
            {upNext.length > 0 && (
              <div className="p-4">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Clock size={16} className="mr-2" />
                  Up Next
                </h4>
                <div className="space-y-2">
                  {upNext.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onTrackSelect(item.metadata)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                        <Play size={12} className="text-gray-400 group-hover:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.metadata.mediaInfo.title}</p>
                        <p className="text-gray-400 text-xs truncate">{item.metadata.mediaInfo.artist}</p>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {formatDuration(item.metadata.mediaInfo.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Queue */}
            {queue.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h4 className="text-white font-medium mb-3">Queue ({queue.length})</h4>
                  <div className="space-y-2">
                    {queue.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
                      >
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <button
                          onClick={() => onTrackSelect(item.metadata)}
                          className="flex items-center space-x-3 flex-1 min-w-0"
                        >
                          <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                            <Play size={14} className="text-gray-400 group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.metadata.mediaInfo.title}</p>
                            <p className="text-gray-400 text-xs truncate">{item.metadata.mediaInfo.artist}</p>
                          </div>
                        </button>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => toggleLike(item.id)}
                            className={`p-1 rounded ${item.isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Heart size={14} fill={item.isLiked ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="p-1 rounded text-gray-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {queue.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <List className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">Your queue is empty</p>
                  <p className="text-gray-500 text-sm">Add tracks to start building your queue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}