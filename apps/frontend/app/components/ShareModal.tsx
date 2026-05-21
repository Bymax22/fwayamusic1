'use client';

import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import { RiWhatsappLine, RiFacebookLine, RiMailLine, RiShareLine } from 'react-icons/ri';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  coverUrl?: string;
  artist?: string;
  genre?: string;
  duration?: string;
  description?: string;
  shareText?: string;
  onShare?: () => void;
}

export default function ShareModal({
  open,
  onClose,
  title,
  url,
  coverUrl,
  artist,
  genre,
  duration,
  description,
  shareText,
}: ShareModalProps) {
  if (!open) {
    return null;
  }

  const fallbackText = `Listen to ${title}${artist ? ` by ${artist}` : ''} on Fwaya.\n${url}`;
  const payload = shareText || fallbackText;
  const subject = `Listen to ${title}${artist ? ` by ${artist}` : ''} on Fwaya`;
  const coverImage = coverUrl || '/default-cover.jpg';

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
      onShare?.();
    } catch (error) {
      console.error('Native share failed', error);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(payload)}`, '_blank');
    onShare?.();
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    onShare?.();
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload)}`);
    onShare?.();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      onShare?.();
    } catch (error) {
      console.error('Copy link failed', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-2xl p-5 max-w-md w-full ring-1 ring-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Share Track</h3>
            <p className="text-sm text-gray-400 mt-1">Send a preview with cover art, track details, and an instant play link.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[140px_1fr] mb-4 items-start">
          <div className="overflow-hidden rounded-3xl bg-white/5 h-36 w-full">
            <Image
              src={coverImage}
              alt={title}
              width={320}
              height={320}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Track</p>
              <p className="text-lg font-semibold text-white">{title}</p>
            </div>
            {artist && (
              <div>
                <p className="text-sm text-gray-400">Artist</p>
                <p className="text-white">{artist}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              {genre && (
                <div>
                  <p className="text-gray-500">Genre</p>
                  <p>{genre}</p>
                </div>
              )}
              {duration && (
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p>{duration}</p>
                </div>
              )}
            </div>
            {description && <p className="text-sm text-gray-300 line-clamp-3">{description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share on WhatsApp"
          >
            <RiWhatsappLine size={22} />
          </button>
          <button
            onClick={handleFacebook}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share on Facebook"
          >
            <RiFacebookLine size={22} />
          </button>
          <button
            onClick={handleEmail}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share via Email"
          >
            <RiMailLine size={22} />
          </button>
          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share using device share"
          >
            <RiShareLine size={22} />
          </button>
          <button
            onClick={handleCopyLink}
            className="col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-purple-500 hover:text-purple-300"
          >
            Copy link
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-400">Share link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 bg-white/5 text-white rounded-2xl px-3 py-2 border border-white/10"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-2xl bg-purple-600 px-4 py-2 text-white hover:bg-purple-500 transition"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
