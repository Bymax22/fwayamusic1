export default function SongCard({ title, artist }: { title: string; artist: string }) {
    return (
      <div className="bg-charcoal p-4 rounded-lg text-center">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-white/60">{artist}</p>
      </div>
    );
  }
  




