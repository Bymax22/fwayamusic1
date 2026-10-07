"use client";
import React from 'react';

type Props = {
  playing?: boolean;
  className?: string;
  accentColor?: string;
};

export default function Waveform({ playing = false, className = '', accentColor = '#9B5DE5' }: Props) {
  return (
    <div className={`waveform inline-flex items-end gap-0.5 ${playing ? 'is-playing' : ''} ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className="waveform-bar block w-0.5 rounded-sm"
          style={{
            backgroundColor: accentColor,
            height: `${7 + (i % 4) * 3}px`,
            animationDelay: `${i * -0.12}s`,
            animationDuration: `${0.72 + (i % 4) * 0.1}s`,
          }}
        />
      ))}
      <style jsx>{`
        .waveform-bar { transform-origin: bottom; opacity: 0.45; }
        .is-playing .waveform-bar { animation: wave 800ms ease-in-out infinite; opacity: 1; }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.35); }
          25% { transform: scaleY(0.8); }
          50% { transform: scaleY(1); }
          75% { transform: scaleY(0.55); }
        }
        @media (prefers-reduced-motion: reduce) {
          .is-playing .waveform-bar { animation: none; transform: none; }
        }
      `}</style>
    </div>
  );
}
