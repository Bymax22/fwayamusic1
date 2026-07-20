import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createMediaSlug } from '@/lib/utils';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
}

async function fetchAlbum(albumId: string) {
  const res = await fetch(`${getBackendBaseUrl()}/api/v1/albums/${albumId}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function AlbumDetailPage({ params }: { params: { id: string } }) {
  const album = await fetchAlbum(params.id);
  if (!album) {
    notFound();
  }

  const artistName = album.user?.displayName || album.user?.username || 'Unknown Artist';
  const releaseDate = album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : 'Unknown';

  return (
    <div className="min-h-screen bg-[#02060f] text-white px-4 py-8 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl overflow-hidden bg-[#08111f] shadow-2xl shadow-black/30">
            <div className="relative h-96 bg-black">
              <Image
                src={album.coverUrl || album.artCoverUrl || album.thumbnailUrl || '/default-cover.jpg'}
                alt={album.title || 'Album cover'}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Album</p>
              <h1 className="text-3xl font-semibold">{album.title || 'Untitled Album'}</h1>
              <p className="text-sm text-slate-400">{artistName}</p>
              <div className="grid gap-2 text-sm text-slate-400">
                <p>{album.media?.length ?? 0} tracks</p>
                <p>Released: {releaseDate}</p>
                <p>Status: {album.contentStatus || 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-[#08111f] p-6 shadow-2xl shadow-black/30">
              <h2 className="text-xl font-semibold mb-4">About this album</h2>
              <p className="text-sm leading-7 text-slate-300">
                {album.description || 'No description provided yet.'}
              </p>
            </div>

            <div className="rounded-3xl bg-[#08111f] p-6 shadow-2xl shadow-black/30">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Tracklist</p>
                  <h2 className="text-2xl font-semibold">{album.media?.length ?? 0} tracks</h2>
                </div>
              </div>

              {Array.isArray(album.media) && album.media.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {album.media.map((track: any, index: number) => {
                    const trackTitle = track.title || `Track ${index + 1}`;
                    const trackSlug = createMediaSlug(trackTitle, track.id);
                    const trackHref = track.type?.toString().toUpperCase() === 'VIDEO' ? `/videos/${track.id}` : `/track/${trackSlug}`;
                    return (
                      <Link
                        key={track.id ?? index}
                        href={trackHref}
                        className="flex items-center justify-between gap-4 py-4 transition hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900">
                            {track.artCoverUrl || track.coverArt || track.thumbnailUrl ? (
                              <Image
                                src={track.artCoverUrl || track.coverArt || track.thumbnailUrl}
                                alt={trackTitle}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-purple-600 to-fuchsia-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white truncate">{trackTitle}</p>
                            <p className="text-xs text-slate-400 truncate">{track.user?.displayName || track.user?.username || 'Unknown Artist'}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>{track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '0:00'}</p>
                          <p>{track.type || 'AUDIO'}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">This album has no released tracks yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
