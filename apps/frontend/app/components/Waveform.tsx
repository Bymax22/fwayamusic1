"use client";
import React from 'react';

type Props = {
  playing?: boolean;
  className?: string;
};

export default function Waveform({ playing = false, className = '' }: Props) {
  return (
    <div className={`waveform inline-flex items-end gap-0.5 ${className}`} aria-hidden>
      {[0,1,2,3,4].map((i) => (
        <span
          key={i}
          className={`block w-0.5 bg-[#e51f48] rounded-sm transform-origin-bottom ${playing ? `animate-wave delay-${i}` : 'opacity-40'}`}
          style={{ height: `${6 + i * 3}px` }}
        />
      ))}
      <style jsx>{`
        .waveform span { transition: height 120ms linear; }
        .animate-wave { animation: wave 900ms linear infinite; }
        @keyframes wave {
          0% { transform: scaleY(1); opacity: 1 }
          25% { transform: scaleY(1.6); opacity: 0.9 }
          50% { transform: scaleY(0.8); opacity: 0.7 }
          75% { transform: scaleY(1.3); opacity: 0.9 }
          100% { transform: scaleY(1); opacity: 1 }
        }
        .delay-0 { animation-delay: 0ms; }
        .delay-1 { animation-delay: 80ms; }
        .delay-2 { animation-delay: 160ms; }
        .delay-3 { animation-delay: 240ms; }
        .delay-4 { animation-delay: 320ms; }
      `}</style>
    </div>
  );
}
