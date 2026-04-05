# Fwaya Hooks

Shared React hooks library for Fwaya Music web and mobile applications.

## Hooks

### `usePlayer()`
Main player hook with centralized state management using Zustand.

**Returns:**
- `currentTrack` - Currently playing track
- `isPlaying` - Playback state
- `likedTracks` - Array of liked track IDs
- `recentlyPlayed` - Recent track history
- `queue` - Current playlist queue
- `play(track)` - Start playing a track
- `pause()` - Pause playback
- `togglePlayPause()` - Toggle playback state
- `toggleLike(trackId)` - Toggle like status
- `next()` / `previous()` - Navigate queue

### `useFetchTracks(options)`
Fetch tracks from the Fwaya backend API.

**Options:**
- `apiUrl` - Custom API URL

**Returns:**
- `tracks` - Array of fetched tracks
- `loading` - Loading state
- `error` - Error message if any
- `fetchTracks()` - Trigger fetch

### `useAudioPlayer(url, options)`
HTML Audio API wrapper for web apps.

**Options:**
- `autoplay` - Auto-start playback (default: false)

**Returns:**
- `audioRef` - Ref to audio element
- `isPlaying` - Playback state
- `duration` - Total duration
- `currentTime` - Current playback position
- `volume` - Current volume (0-1)
- `play()` / `pause()` / `seek(time)`
- `setVolume(volume)` - Set volume level

## Usage

### Web (Next.js)
\`\`\`tsx
import { usePlayer } from 'fwaya-hooks';

export default function Player() {
  const { currentTrack, isPlaying, play, pause } = usePlayer();

  return (
    <button onClick={isPlaying ? pause : () => play(currentTrack)}>
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
\`\`\`

### Mobile (React Native)
\`\`\`tsx
import { usePlayer } from 'fwaya-hooks';
import { TouchableOpacity, Text } from 'react-native';

export default function MobilePlayer() {
  const { currentTrack, isPlaying, play, pause } = usePlayer();

  return (
    <TouchableOpacity onPress={isPlaying ? pause : () => play(currentTrack)}>
      <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
    </TouchableOpacity>
  );
}
\`\`\`

## Install

\`\`\`bash
npm install fwaya-hooks
\`\`\`
