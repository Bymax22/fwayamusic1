"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Play, Pause, Volume2, VolumeX, ArrowsExpand, Heart, Share2, Plus, X } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import VideoCard from "@/components/VideoCard";

interface VideoDetail {
  id: number;
  title: string;
  artist: string;
  channelName: string;
  description: string;
  duration: number;
  views: number;
  likes: number;
  createdAt: string;
  thumbnail: string;
  videoUrl: string;
  related: Array<{
    id: number;
    title: string;
    artist: string;
    duration: number;
    views: number;
    createdAt: string;
    thumbnail: string;
  }>;
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleMute, isMuted } = useAudioPlayer();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const videoId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/media/${videoId}`);
        if (!res.ok) throw new Error("Video not found");
        const data = await res.json();
        const item = data.data || data;
        const mapped = {
          id: item.id,
          title: item.title || item.name || "Untitled",
          artist: item.user?.displayName || item.user?.username || item.artist || "Unknown",
          channelName: item.user?.displayName || item.user?.username || "Unknown",
          description: item.description || item.summary || "No description available.",
          duration: item.duration || item.length || 0,
          views: item.views || item.playCount || 0,
          likes: item.likes || 0,
          createdAt: item.createdAt || item.publishedAt || new Date().toISOString(),
          thumbnail: item.thumbnailUrl || item.artCoverUrl || item.coverArt || "/default-cover.jpg",
          videoUrl: item.videoUrl || item.url || item.audioUrl || "",
          related: (item.relatedVideos || item.related || []).map((relatedItem: any) => ({
            id: relatedItem.id,
            title: relatedItem.title || relatedItem.name || "Untitled",
            artist: relatedItem.user?.displayName || relatedItem.user?.username || relatedItem.artist || "Unknown",
            duration: relatedItem.duration || relatedItem.length || 0,
            views: relatedItem.views || relatedItem.playCount || 0,
            createdAt: relatedItem.createdAt || relatedItem.publishedAt || new Date().toISOString(),
            thumbnail: relatedItem.thumbnailUrl || relatedItem.artCoverUrl || relatedItem.coverArt || "/default-cover.jpg",
          })),
        };
        setVideo(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load video");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      void fetchVideo();
    }
  }, [videoId]);

  const handlePlay = () => {
    if (!video) return;

    if (currentTrack?.id === video.id) {
      togglePlay();
    } else {
      playTrack({
        id: video.id,
        title: video.title,
        artist: video.artist,
        videoUrl: video.videoUrl,
        imageUrl: video.thumbnail,
        type: "VIDEO",
        duration: video.duration,
      });
    }
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <button
          className="mb-6 rounded-full bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-900"
          onClick={() => router.back()}
        >
          Back
        </button>

        {error ? (
          <div className="rounded-3xl bg-slate-950 p-6 text-sm text-red-300">{error}</div>
        ) : loading || !video ? (
          <div className="space-y-4">
            <div className="h-[420px] rounded-3xl bg-slate-900 animate-pulse" />
            <div className="h-8 w-3/5 rounded-full bg-slate-900 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 rounded-3xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950 p-4">
                <div className="aspect-video w-full overflow-hidden rounded-3xl bg-slate-900">
                  <video
                    src={video.videoUrl}
                    controls
                    className="h-full w-full bg-black"
                    onClick={() => setShowControls(true)}
                    onTouchStart={() => setShowControls(true)}
                    onMouseMove={() => setShowControls(true)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl bg-slate-950 p-6">
                  <h1 className="text-2xl font-semibold text-white">{video.title}</h1>
                  <p className="mt-2 text-sm text-slate-400">{video.artist}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{video.views.toLocaleString()} views</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handlePlay}
                      className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                    >
                      {currentTrack?.id === video.id && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      {currentTrack?.id === video.id && isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800">
                      <ArrowsExpand size={16} />
                      Fullscreen
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800">
                      <Heart size={16} />
                      Like
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800">
                      <Share2 size={16} />
                      Share
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800">
                      <Plus size={16} />
                      Save
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950 p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-slate-800" />
                    <div>
                      <p className="text-sm font-semibold text-white">{video.channelName}</p>
                      <p className="text-xs text-slate-400">Channel</p>
                    </div>
                  </div>
                  <div className="mt-6 text-sm leading-7 text-slate-300">{video.description}</div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl bg-slate-950 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Related videos</p>
                  <button className="text-sm text-purple-400 hover:text-purple-300">See all</button>
                </div>
                <div className="space-y-4">
                  {video.related.map((relatedItem) => (
                    <VideoCard key={relatedItem.id} {...relatedItem} href={`/videos/${relatedItem.id}`} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
