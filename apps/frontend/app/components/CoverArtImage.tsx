"use client";

import { useEffect, useState } from 'react';
import { DEFAULT_MEDIA_COVER_URL } from '@/lib/utils';

interface CoverArtImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}

export default function CoverArtImage({
  src,
  alt,
  className = '',
  fill = false,
  sizes,
}: CoverArtImageProps) {
  const [imageSrc, setImageSrc] = useState(src || DEFAULT_MEDIA_COVER_URL);

  useEffect(() => {
    setImageSrc(src || DEFAULT_MEDIA_COVER_URL);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${fill ? 'absolute inset-0 h-full w-full' : ''} ${className}`}
      sizes={sizes}
      onError={() => {
        if (imageSrc !== DEFAULT_MEDIA_COVER_URL) setImageSrc(DEFAULT_MEDIA_COVER_URL);
      }}
    />
  );
}