import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Track } from '@fwaya-music/types';

interface UseFetchTracksOptions {
  apiUrl?: string;
}

export const useFetchTracks = (options: UseFetchTracksOptions = {}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = options.apiUrl || process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${apiUrl}/api/v1/media`, {
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });

      setTracks(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tracks';
      setError(message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { tracks, loading, error, fetchTracks };
};
