import { fetchWithAuth } from './movie.service'; // We need a way to do auth fetch, let's just use native fetch for now or a custom one if available

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBy?: string;
}

export const bookingService = {
  getSeats: async (showtimeId: string): Promise<Seat[]> => {
    const response = await fetch(`${API_URL}/showtimes/${showtimeId}/seats`);
    if (!response.ok) {
      throw new Error('Failed to fetch seats');
    }
    return response.json();
  },

  lockSeats: async (showtimeId: string, seatIds: string[], token: string): Promise<any> => {
    const response = await fetch(`${API_URL}/showtimes/${showtimeId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seatIds }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to lock seats');
    }
    return response.json();
  },
};
