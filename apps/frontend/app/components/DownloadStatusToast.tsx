'use client';

import { X } from 'lucide-react';

interface DownloadStatusToastProps {
  title: string;
  status: 'downloading' | 'complete';
  onClose: () => void;
  onView: () => void;
}

export default function DownloadStatusToast({
  title,
  status,
  onClose,
  onView,
}: DownloadStatusToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-0 z-[70] flex w-full max-w-md items-center justify-between gap-3 bg-gradient-to-r from-black via-black/90 to-transparent px-5 py-4 text-sm"
    >
      {status === 'downloading' ? (
        <span className="min-w-0 truncate font-bold text-purple/60">
          Downloading
          <span className="ml-1 inline-flex items-center gap-0.5" aria-label="in progress">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:120ms]">.</span>
            <span className="animate-bounce [animation-delay:240ms]">.</span>
          </span>
          <span className="ml-2 font-normal text-white/75">{title}</span>
        </span>
      ) : (
        <>
          <span className="min-w-0 truncate text-white">Download complete: {title}</span>
          <button
            type="button"
            onClick={onView}
            className="shrink-0 font-semibold text-purple/60 hover:text-purple/45"
          >
            View download
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close download notification"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
