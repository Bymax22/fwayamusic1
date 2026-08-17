'use client';

import Image from 'next/image';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
}

export default function VerifiedBadge({
  size = 'md',
  title = 'Verified',
  className = ''
}: VerifiedBadgeProps) {
  const sizeMap = {
    sm: { width: 16, height: 16, class: 'h-4 w-4' },
    md: { width: 20, height: 20, class: 'h-5 w-5' },
    lg: { width: 24, height: 24, class: 'h-6 w-6' }
  };

  const { width, height, class: sizeClass } = sizeMap[size];

  return (
    <Image
      src="/FwayaVerifiedbadge-01.png"
      alt={title}
      width={width}
      height={height}
      title={title}
      className={`inline-flex ${sizeClass} ${className}`}
    />
  );
}
