"use client";

import { useEffect, useState } from 'react';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function AvatarImage({ src, alt, className = '', width, height, fill = false }: AvatarImageProps) {
  const [imageSrc, setImageSrc] = useState(src || DEFAULT_AVATAR_URL);

  useEffect(() => {
    setImageSrc(src || DEFAULT_AVATAR_URL);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={`${fill ? 'absolute inset-0 h-full w-full' : ''} ${className}`}
      onError={() => {
        if (imageSrc !== DEFAULT_AVATAR_URL) setImageSrc(DEFAULT_AVATAR_URL);
      }}
    />
  );
}