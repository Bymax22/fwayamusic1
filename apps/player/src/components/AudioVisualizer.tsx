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
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const barCount = 64
        const barWidth = canvas.width / barCount

        for (let i = 0; i < barCount; i++) {
          const barHeight = 20
          ctx.fillStyle = `rgba(236, 72, 153, ${0.2 + Math.sin(Date.now() * 0.001 + i * 0.1) * 0.15})`
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
        }
      } else {
        analyser.getByteFrequencyData(dataArray)

        // Clear with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)')
        gradient.addColorStop(0.5, 'rgba(39, 39, 42, 0.95)')
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.9)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const barCount = bufferLength / 2
        const barWidth = canvas.width / barCount

        for (let i = 0; i < barCount; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85

          // Create multi-color gradient
          const barGradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
          
          if (i < barCount / 3) {
            barGradient.addColorStop(0, '#ec4899')
            barGradient.addColorStop(1, '#db2777')
          } else if (i < (barCount * 2) / 3) {
            barGradient.addColorStop(0, '#f43f5e')
            barGradient.addColorStop(1, '#e11d48')
          } else {
            barGradient.addColorStop(0, '#06b6d4')
            barGradient.addColorStop(1, '#0891b2')
          }

          ctx.fillStyle = barGradient
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)

          // Add subtle glow effect
          ctx.shadowColor = 'rgba(236, 72, 153, 0.4)'
          ctx.shadowBlur = 15
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
          ctx.shadowBlur = 0
          ctx.shadowColor = 'transparent'
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
    <div className="w-full max-w-4xl mx-auto">
      <canvas
        ref={canvasRef}
        width={1000}
        height={400}
        className="w-full h-96 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-white/5 shadow-2xl"
      />
    </div>
  )
}