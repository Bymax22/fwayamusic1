export default function SongCard({ title, artist }: { title: string; artist: string }) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg text-center">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-gray-400">{artist}</p>
      </div>
    );
  }
  