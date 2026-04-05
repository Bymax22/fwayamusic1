import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioPlayerOptions {
  autoplay?: boolean;
}

export const useAudioPlayer = (url: string, options: UseAudioPlayerOptions = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(options.autoplay ?? false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else if (audioRef.current.src !== url) {
      audioRef.current.src = url;
    }

    const audio = audioRef.current;

    const handleMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) {
      audio.play().catch(() => console.error('Playback failed'));
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url, isPlaying]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);
  const setVolumeValue = useCallback((vol: number) => {
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  return {
    audioRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    play,
    pause,
    seek,
    setVolume: setVolumeValue,
  };
};
