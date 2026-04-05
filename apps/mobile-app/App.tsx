import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  artCoverUrl: string;
  duration: number;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price?: number;
}

const mockTracks: Track[] = [
  { id: 1, title: 'Midnight Dreams', artist: 'Luna Echo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', artCoverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop', duration: 180, accessType: 'FREE' },
  { id: 2, title: 'Neon Nights', artist: 'Cyber Wave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', artCoverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', duration: 240, accessType: 'PREMIUM', price: 9.99 },
  { id: 3, title: 'Digital Soul', artist: 'Pixel Dreams', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', artCoverUrl: 'https://images.unsplash.com/photo-1514575950555-fdcb6b3a0c1e?w=300&h=300&fit=crop', duration: 210, accessType: 'FREE' }
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    const tryFetch = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/v1/media`);
        if (!response.ok) throw new Error('Network response not ok');
        const data = (await response.json()) as Track[];
        setTracks(data.map((item) => ({ ...item, artCoverUrl: item.artCoverUrl || 'https://via.placeholder.com/300' })));
      } catch (error) {
        console.log('Mobile fetch failed, using mock', error);
        setTracks(mockTracks);
      }
    };

    tryFetch();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fwaya Mobile Player</Text>
      <Text style={{ color: 'white', fontSize: 16 }}>Tracks loaded: {tracks.length}</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Image source={{ uri: item.artCoverUrl }} style={styles.cover} />
            <View style={styles.meta}>
              <Text style={styles.trackTitle}>{item.title}</Text>
              <Text style={styles.artist}>{item.artist}</Text>
              <Text style={styles.access}>{item.accessType} {item.price ? `• $${item.price}` : ''}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080A10', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#141925', borderRadius: 12, marginBottom: 12, padding: 12, alignItems: 'center' },
  cover: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  meta: { flex: 1 },
  trackTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  artist: { color: '#ccc', marginTop: 4 },
  access: { color: '#888', marginTop: 2 }
});
