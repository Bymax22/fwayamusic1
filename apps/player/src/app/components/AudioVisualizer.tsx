// apps/player/src/app/components/AudioVisualizer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  height: number;
  barColor?: string;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying,
  height,
  barColor = '#e51f48',
  barCount = 64,
  barWidth = 3,
  barSpacing = 1,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const sourceRef = useRef<MediaElementAudioSourceNode>();
  const analyserRef = useRef<AnalyserNode>();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;
    
    const initAudioContext = () => {
      try {
        if (audioContextRef.current) return;
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        analyserRef.current.fftSize = 256;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    
    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !isInitialized) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      canvas.width = canvas.clientWidth;
      canvas.height = height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = Math.max(2, (canvas.width / barCount) - barSpacing);
      const startX = (canvas.width - (barWidth + barSpacing) * barCount) / 2;
      
      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[index] || 0;
        const percent = value / 255;
        const barHeight = Math.max(2, percent * height);
        const x = startX + i * (barWidth + barSpacing);
        const y = (canvas.height - barHeight) / 2;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, '#ff4d6d');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Add glow effect
        ctx.shadowBlur = 2;
        ctx.shadowColor = barColor;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    if (isPlaying && isInitialized && audioContextRef.current) {
      if (audioContextRef.current.state !== 'running') {
        audioContextRef.current.resume();
      }
      draw();
    } else if (isPlaying && isInitialized) {
      draw();
    }
    
    // Lazy initialize on first play attempt
    const handlePlay = () => {
      if (!isInitialized) {
        initAudioContext();
      }
    };
    
    audioElement.addEventListener('play', handlePlay);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioElement.removeEventListener('play', handlePlay);
    };
  }, [audioElement, isPlaying, height, barColor, barCount, barSpacing, isInitialized]);
  
  if (!isPlaying) {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`} style={{ height }}>
        {[...Array(barCount)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-white/20 rounded-full"
            style={{ height: 4 }}
            animate={{
              height: [4, 8, 4],
            }}
            transition={{
              duration: 1,
              delay: i * 0.02,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
};