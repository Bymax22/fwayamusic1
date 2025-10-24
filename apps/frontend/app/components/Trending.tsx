import SongCard from './SongCard'
export default function Trending() {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Trending Music</h2>
        <div className="grid grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <SongCard key={i} title={`Song ${i + 1}`} artist="Artist Name" />
          ))}
        </div>
      </div>
    );
  }
  