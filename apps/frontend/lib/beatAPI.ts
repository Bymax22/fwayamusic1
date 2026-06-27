/**
 * Beat Management API Utilities
 * Cleaned TypeScript client for frontend usage
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface UpdateBeatData {
  title?: string;
  description?: string;
  genre?: string;
  bpm?: number;
  price?: number;
  coverFile?: File;
}

interface BeatFilters {
  genre?: string;
  bpm?: number;
  accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  skip?: number;
  take?: number;
}

class BeatAPIClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  /**
   * Get all beats with optional filters
   */
  async getAllBeats(filters?: BeatFilters) {
    const params = new URLSearchParams();
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.bpm) params.append('bpm', String(filters.bpm));
    if (filters?.accessType) params.append('accessType', filters.accessType);
    if (filters?.skip) params.append('skip', String(filters.skip));
    if (filters?.take) params.append('take', String(filters.take));

    const url = params.toString() ? `${API_BASE_URL}/v1/beats?${params}` : `${API_BASE_URL}/v1/beats`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch beats');
    return response.json();
  }

  /** Get single beat by ID */
  async getBeatById(beatId: number) {
    const response = await fetch(`${API_BASE_URL}/v1/beats/${beatId}`);
    if (!response.ok) throw new Error('Failed to fetch beat');
    return response.json();
  }

  /** Get beat with detailed information */
  async getBeatDetailed(beatId: number) {
    const response = await fetch(`${API_BASE_URL}/v1/beats/${beatId}/detailed`);
    if (!response.ok) throw new Error('Failed to fetch beat details');
    return response.json();
  }

  /** Get analytics for a beat */
  async getBeatAnalytics(beatId: number) {
    const response = await fetch(`${API_BASE_URL}/v1/beats/${beatId}/analytics`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  }

  /** Search beats */
  async searchBeats(query: string, filters?: BeatFilters) {
    const params = new URLSearchParams();
    if (filters?.genre) params.append('genre', filters.genre);
    if (filters?.bpm) params.append('bpm', String(filters.bpm));
    if (filters?.accessType) params.append('accessType', filters.accessType);
    const url = params.toString() ? `${API_BASE_URL}/v1/beats/search/${encodeURIComponent(query)}?${params}` : `${API_BASE_URL}/v1/beats/search/${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search beats');
    return response.json();
  }

  /** Upload a new beat */
  async uploadBeat(beatData: {
    title: string;
    description?: string;
    genre: string;
    bpm?: number;
    key?: string;
    price?: number;
    accessType?: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
    audioFile: File;
    coverFile?: File;
  }) {
    const formData = new FormData();
    formData.append('title', beatData.title);
    if (beatData.description) formData.append('description', beatData.description);
    formData.append('genre', beatData.genre);
    if (beatData.bpm) formData.append('bpm', String(beatData.bpm));
    if (beatData.key) formData.append('key', beatData.key);
    if (beatData.price) formData.append('price', String(beatData.price));
    if (beatData.accessType) formData.append('accessType', beatData.accessType);
    formData.append('audio', beatData.audioFile);
    if (beatData.coverFile) formData.append('cover', beatData.coverFile);

    const response = await fetch(`${API_BASE_URL}/v1/beats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload beat');
    return response.json();
  }
}

export default new BeatAPIClient();
