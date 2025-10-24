"use client";
import { useState } from 'react';
import { Play, Music, Headphones, Radio, Mic2, Guitar } from 'lucide-react';
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { PaymentProvider } from "../context/PaymentContext";


interface Genre {
  id: number;
  name: string;
  description: string;
  color: string;
  trackCount: number;
  coverArt: string;
  popularArtists: string[];
}

export default function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  const genres: Genre[] = [
    {
      id: 1,
      name: "Afrobeats",
      description: "Rhythmic sounds from West Africa",
      color: "from-orange-500 to-red-500",
      trackCount: 2450,
      coverArt: "/genres/afrobeats.jpg",
      popularArtists: ["Fwaya Music", "Burna Boy", "Wizkid", "Davido"]
    },
    {
      id: 2,
      name: "Pop",
      description: "Popular mainstream music",
      color: "from-blue-500 to-purple-500",
      trackCount: 1890,
      coverArt: "/genres/pop.jpg",
      popularArtists: ["The Weeknd", "Dua Lipa", "Taylor Swift", "Ariana Grande"]
    },
    {
      id: 3,
      name: "Hip Hop",
      description: "Urban beats and rhymes",
      color: "from-gray-700 to-black",
      trackCount: 1670,
      coverArt: "/genres/hiphop.jpg",
      popularArtists: ["Drake", "Kendrick Lamar", "Travis Scott", "J. Cole"]
    },
    {
      id: 4,
      name: "Electronic",
      description: "Synthetic sounds and beats",
      color: "from-cyan-500 to-blue-500",
      trackCount: 1320,
      coverArt: "/genres/electronic.jpg",
      popularArtists: ["M83", "Daft Punk", "The Chemical Brothers", "Calvin Harris"]
    },
    {
      id: 5,
      name: "R&B",
      description: "Soulful rhythm and blues",
      color: "from-pink-500 to-rose-500",
      trackCount: 980,
      coverArt: "/genres/rnb.jpg",
      popularArtists: ["The Weeknd", "SZA", "Frank Ocean", "Summer Walker"]
    },
    {
      id: 6,
      name: "Rock",
      description: "Guitar-driven anthems",
      color: "from-yellow-500 to-orange-500",
      trackCount: 850,
      coverArt: "/genres/rock.jpg",
      popularArtists: ["Arctic Monkeys", "The Rolling Stones", "Queen", "Led Zeppelin"]
    },
    {
      id: 7,
      name: "Jazz",
      description: "Improvisational classics",
      color: "from-amber-500 to-brown-500",
      trackCount: 620,
      coverArt: "/genres/jazz.jpg",
      popularArtists: ["Miles Davis", "John Coltrane", "Ella Fitzgerald", "Louis Armstrong"]
    },
    {
      id: 8,
      name: "Classical",
      description: "Timeless orchestral masterpieces",
      color: "from-indigo-500 to-purple-500",
      trackCount: 540,
      coverArt: "/genres/classical.jpg",
      popularArtists: ["Beethoven", "Mozart", "Bach", "Chopin"]
    }
  ];

  const getGenreIcon = (genreName: string) => {
    switch (genreName.toLowerCase()) {
      case 'afrobeats': return <Music className="w-6 h-6" />;
      case 'pop': return <Radio className="w-6 h-6" />;
      case 'hip hop': return <Mic2 className="w-6 h-6" />;
      case 'electronic': return <Headphones className="w-6 h-6" />;
      case 'r&b': return <Music className="w-6 h-6" />;
      case 'rock': return <Guitar className="w-6 h-6" />;
      case 'jazz': return <Music className="w-6 h-6" />;
      case 'classical': return <Music className="w-6 h-6" />;
      default: return <Music className="w-6 h-6" />;
    }
  };

  return (
     <ThemeProvider>
      <AuthProvider>
        <PaymentProvider>
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-[#0a3747]/95 to-[#0a1f29]/95 min-h-screen pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Genres</h1>
        <p className="text-gray-400">Discover music by genre and mood</p>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {genres.map(genre => (
          <div 
            key={genre.id}
            className={`bg-gradient-to-br ${genre.color} rounded-2xl p-6 text-white cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group`}
            onClick={() => setSelectedGenre(genre)}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {getGenreIcon(genre.name)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{genre.trackCount}</div>
                  <div className="text-white/80 text-sm">tracks</div>
                </div>
              </div>
              
              <h3 className="font-bold text-xl mb-2">{genre.name}</h3>
              <p className="text-white/80 text-sm mb-4">{genre.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="text-white/90 text-sm">
                  {genre.popularArtists.slice(0, 2).join(', ')}
                  {genre.popularArtists.length > 2 && '...'}
                </div>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <Play className="w-5 h-5" fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Genre Detail Modal */}
      {selectedGenre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a3747] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-br ${selectedGenre.color} p-8 rounded-t-2xl relative`}>
              <button 
                onClick={() => setSelectedGenre(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                ×
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                  {getGenreIcon(selectedGenre.name)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedGenre.name}</h2>
                  <p className="text-white/80">{selectedGenre.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0a3747]/70 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white mb-1">{selectedGenre.trackCount}</div>
                  <div className="text-gray-400 text-sm">Total Tracks</div>
                </div>
                <div className="bg-[#0a3747]/70 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {Math.floor(selectedGenre.trackCount / 100)}K+
                  </div>
                  <div className="text-gray-400 text-sm">Monthly Plays</div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">Popular Artists</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {selectedGenre.popularArtists.map(artist => (
                  <div key={artist} className="bg-[#0a3747]/70 rounded-lg p-3 text-white">
                    {artist}
                  </div>
                ))}
              </div>
              
              <button className="w-full py-3 bg-[#e51f48] hover:bg-[#ff4d6d] text-white rounded-xl transition-colors font-medium">
                Play {selectedGenre.name} Radio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
            </PaymentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}