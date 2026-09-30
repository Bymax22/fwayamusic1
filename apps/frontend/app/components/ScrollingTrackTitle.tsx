"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ScrollingTrackTitleProps {
  children: ReactNode;
  isPlaying: boolean;
  className?: string;
}

export default function ScrollingTrackTitle({ children, isPlaying, className = '' }: ScrollingTrackTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setScrollDistance(0);
      return;
    }

    const measure = () => {
      if (!containerRef.current || !contentRef.current) return;
      const contentWidth = contentRef.current.getBoundingClientRect().width;
      setScrollDistance(contentWidth > containerRef.current.clientWidth ? contentWidth : 0);
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  const shouldScroll = isPlaying && scrollDistance > 0;

  return (
    <div ref={containerRef} className="min-w-0 overflow-hidden">
      <motion.div
        animate={shouldScroll ? { x: -scrollDistance } : { x: 0 }}
        transition={{
          duration: shouldScroll ? scrollDistance / 40 : 0,
          repeat: shouldScroll ? Infinity : 0,
          repeatType: 'loop',
          ease: 'linear',
        }}
        className="flex w-max whitespace-nowrap"
      >
        <span ref={contentRef} className={`inline-block pr-8 ${className}`}>
          {children}
        </span>
        {shouldScroll && (
          <span aria-hidden="true" className={`inline-block pr-8 ${className}`}>
            {children}
          </span>
        )}
      </motion.div>
    </div>
  );
}