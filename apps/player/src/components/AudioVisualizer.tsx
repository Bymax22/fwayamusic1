'use client'

import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null
  audioContext: AudioContext | null
  isPlaying: boolean
}

export function AudioVisualizer({ audioElement, audioContext, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioElement || !audioContext || !canvasRef.current) return

    // Create analyser node
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    // Connect audio element to analyser
    const source = audioContext.createMediaElementSource(audioElement)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      source.disconnect()
      analyser.disconnect()
    }
  }, [audioElement, audioContext])

  useEffect(() => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isPlaying) {
        // Draw static bars when not playing
        ctx.fillStyle = 'rgb(30, 58, 138)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const barCount = 64
        const barWidth = canvas.width / barCount

        for (let i = 0; i < barCount; i++) {
          const barHeight = 20
          ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + Math.sin(Date.now() * 0.001 + i * 0.1) * 0.2})`
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
        }
      } else {
        analyser.getByteFrequencyData(dataArray)

        ctx.fillStyle = 'rgb(17, 24, 39)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const barCount = bufferLength / 2
        const barWidth = canvas.width / barCount

        for (let i = 0; i < barCount; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.8

          // Create gradient
          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
          gradient.addColorStop(0, '#3b82f6')
          gradient.addColorStop(1, '#1e3a8a')

          ctx.fillStyle = gradient
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)

          // Add glow effect
          ctx.shadowColor = '#3b82f6'
          ctx.shadowBlur = 10
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
          ctx.shadowBlur = 0
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full h-48 rounded-lg bg-gray-800"
      />
    </div>
  )
}