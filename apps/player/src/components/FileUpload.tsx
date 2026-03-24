'use client'

import { useCallback } from 'react'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const fwayaFile = files.find(file => file.name.endsWith('.fwaya'))
    if (fwayaFile) {
      onFileSelect(fwayaFile)
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div
      className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-white/50 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload className="mx-auto mb-4 w-12 h-12 text-white/70" />
      <p className="text-white text-lg mb-2">Drop your .fwaya file here</p>
      <p className="text-white/70 text-sm">or click to browse</p>
      <input
        id="file-input"
        type="file"
        accept=".fwaya"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}