"use client";
import { useEffect, useState } from "react";
import VideoCard from "@/components/VideoCard";
import { useRouter } from "next/navigation";

interface VideoItem {
  id: number;
  title: string;
  artist: string;
  duration: number;
  views: number;
  createdAt: string;
  thumbnail: string;
}

const EMPTY_VIDEO: VideoItem = {
  id: 0,
  title: "",
  artist: "",
  duration: 0,
  views: 0,
  createdAt: new Date().toISOString(),
  thumbnail: "/default-cover.jpg",
};

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [recommended, setRecommended] = useState<VideoItem[]>([]);
  const [trending, setTrending] = useState<VideoItem[]>([]);
  const [newReleases, setNewReleases] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/media");
        if (!res.ok) throw new Error("Failed to load videos");
        const json = await res.json();
        const items = Array.isArray(json.data) ? json.data : json;
        const mapped: VideoItem[] = items.map((item: any) => ({
          id: item.id,
          title: item.title || item.name || "Untitled",
          artist: item.user?.displayName || item.user?.username || item.artist || "Unknown",
          duration: item.duration || item.length || 0,
          views: item.views || item.playCount || 0,
          createdAt: item.createdAt || item.publishedAt || new Date().toISOString(),
          thumbnail: item.thumbnailUrl || item.artCoverUrl || item.coverArt || "/default-cover.jpg",
          videoUrl: item.videoUrl || item.url || item.audioUrl || undefined,
        }));

        setVideos(mapped);
        setTrending(mapped.slice().sort((a, b) => b.views - a.views).slice(0, 8));
        setNewReleases(mapped.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8));
        setRecommended(mapped.slice().filter((_, index) => index < 8));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to fetch videos");
      } finally {
        setLoading(false);
      }
    };

    void fetchVideos();
  }, []);

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">Videos</h1>
            <p className="mt-2 text-sm text-slate-400">
              Discover trending music videos, recommended picks, new releases, and curated playlists.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl bg-slate-950 p-6 text-sm text-red-300">{error}</div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-3xl bg-slate-900 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-64 rounded-3xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Recommended for you</p>
                  <h2 className="text-xl font-semibold text-white">Suggested videos</h2>
                </div>
                <button
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
                  onClick={() => router.push('/videos?section=recommended')}
                >
                  View all
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recommended.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Trending</p>
                  <h2 className="text-xl font-semibold text-white">Trending videos</h2>
                </div>
                <button
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
                  onClick={() => router.push('/videos?section=trending')}
                >
                  View all
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {trending.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">New releases</p>
                  <h2 className="text-xl font-semibold text-white">Latest drops</h2>
                </div>
                <button
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-500"
                  onClick={() => router.push('/videos?section=new-releases')}
                >
                  View all
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {newReleases.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">All videos</p>
                  <h2 className="text-xl font-semibold text-white">Browse the full feed</h2>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <VideoCard key={video.id} {...video} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
