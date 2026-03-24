'use client'

import { useCallback, useState } from 'react'
import { Upload, FileAudio, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const fwayaFile = files.find(file => file.name.endsWith('.fwaya'))

    if (fwayaFile) {
      setSelectedFile(fwayaFile)
      onFileSelect(fwayaFile)
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.fwaya')) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])

  const clearSelection = () => {
    setSelectedFile(null)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver
            ? 'border-pink-500 bg-pink-500/10 scale-105'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
          }
          ${selectedFile ? 'bg-slate-800/30' : ''}
        `}
      >
        <input
          type="file"
          accept=".fwaya"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <FileAudio className="w-12 h-12 text-pink-500" />
              <div className="text-left">
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-green-400 text-sm">File ready for playback</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <p className="text-white text-lg font-medium mb-2">
                Drop your .fwaya file here
              </p>
              <p className="text-gray-400 text-sm mb-4">
                or click to browse your files
              </p>
              <p className="text-gray-500 text-xs">
                Only DRM-protected .fwaya files are supported
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm mb-2">Don't have a .fwaya file?</p>
        <a
          href="https://fwaya.com/download"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-500 hover:text-pink-400 text-sm underline"
        >
          Download from Fwaya Music
        </a>
      </div>
    </div>
  )
}