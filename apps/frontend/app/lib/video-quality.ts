export type VideoQualityValue = 'auto' | '1080p' | '720p' | '480p' | '360p';

export interface VideoQualityOption {
  value: VideoQualityValue;
  label: string;
  url: string;
}

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformationLike;
  }
}

const toCloudinaryVariantUrl = (videoUrl: string, width: number, quality: 'good' | 'eco') => {
  if (!videoUrl) return videoUrl;

  try {
    const parsedUrl = new URL(videoUrl);
    const { pathname, origin, search } = parsedUrl;

    if (!pathname.includes('/upload/')) {
      return videoUrl;
    }

    const match = pathname.match(/^(\/[^/]+\/upload\/)(.+)$/);
    if (!match) {
      return videoUrl;
    }

    const prefix = match[1];
    const suffix = match[2];
    const transform = `c_scale,w_${width}/q_auto:${quality}`;

    return `${origin}${prefix}${transform}/${suffix}${search}`;
  } catch {
    return videoUrl;
  }
};

export const getVideoQualityOptions = (videoUrl: string): VideoQualityOption[] => [
  { value: 'auto', label: 'Auto', url: videoUrl },
  { value: '1080p', label: '1080p', url: toCloudinaryVariantUrl(videoUrl, 1920, 'good') },
  { value: '720p', label: '720p', url: toCloudinaryVariantUrl(videoUrl, 1280, 'good') },
  { value: '480p', label: '480p', url: toCloudinaryVariantUrl(videoUrl, 854, 'eco') },
  { value: '360p', label: '360p', url: toCloudinaryVariantUrl(videoUrl, 640, 'eco') },
];

export const getAutoVideoQuality = (): VideoQualityValue => {
  const connection = typeof navigator !== 'undefined' ? navigator.connection : undefined;

  if (connection?.saveData) {
    return '480p';
  }

  const downlink = connection?.downlink ?? 0;
  const effectiveType = connection?.effectiveType ?? '';

  if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink <= 0.5) {
    return '360p';
  }

  if (effectiveType === '3g' || downlink <= 1.5) {
    return '480p';
  }

  if (effectiveType === '4g' || downlink >= 4) {
    return '1080p';
  }

  return '720p';
};

export const resolveVideoQualityUrl = (videoUrl: string, quality: VideoQualityValue) => {
  const selectedQuality = quality === 'auto' ? getAutoVideoQuality() : quality;
  const matchedOption = getVideoQualityOptions(videoUrl).find((option) => option.value === selectedQuality);
  return matchedOption?.url || videoUrl;
};
