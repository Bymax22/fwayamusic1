'use client';

import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import { AiFillInstagram, AiFillTikTok, AiFillX } from 'react-icons/ai';
import { RiWhatsappLine, RiFacebookLine, RiMailLine, RiFileCopyLine } from 'react-icons/ri';

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
  onShare,
}: ShareModalProps) {
  if (!open) {
    return null;
  }

  const fallbackText = `Listen to ${title}${artist ? ` by ${artist}` : ''} on Fwaya.\n${url}`;
  const payload = shareText || fallbackText;
  const subject = `Listen to ${title}${artist ? ` by ${artist}` : ''} on Fwaya`;
  const coverImage = coverUrl || '/default-cover.jpg';

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

  const handleInstagram = () => {
    window.open(`https://www.instagram.com/?url=${encodeURIComponent(url)}`, '_blank');
    onShare?.();
  };

  const handleTikTok = () => {
    window.open(`https://www.tiktok.com/search?q=${encodeURIComponent(`${title} ${artist || ''}`)}`, '_blank');
    onShare?.();
  };

  const handleX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(payload)}`, '_blank');
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
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[110px_1fr] mb-4 items-start">
          <div className="overflow-hidden rounded-3xl bg-white/5 h-28 w-full">
            <Image
              src={coverImage}
              alt={title}
              width={280}
              height={280}
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
            onClick={handleCopyLink}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Copy link"
          >
            <RiFileCopyLine size={22} />
          </button>
          <button
            onClick={handleInstagram}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share on Instagram"
          >
            <AiFillInstagram size={22} />
          </button>
          <button
            onClick={handleTikTok}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share on TikTok"
          >
            <AiFillTikTok size={22} />
          </button>
          <button
            onClick={handleX}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 hover:text-purple-300"
            aria-label="Share on X"
          >
            <AiFillX size={22} />
          </button>
          <button
            onClick={handleCopyLink}
            className="col-span-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-purple-500 hover:text-purple-300"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
