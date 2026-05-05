const BASE_URL = '/api';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: string;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedBy?: string;
}

export interface ShowtimeDetails {
  id: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  movie: {
    title: string;
    posterUrl: string | null;
  };
  room: {
    name: string;
  };
}

export const bookingService = {
  getShowtimeDetails: async (showtimeId: string): Promise<ShowtimeDetails> => {
    const response = await fetch(`${API_URL}/showtimes/${showtimeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch showtime details');
    }
    return response.json();
  },

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

  // Phase 5 API
  getCombos: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/combos`);
    if (!response.ok) {
      throw new Error('Failed to fetch combos');
    }
    return response.json();
  },

  createBooking: async (showtimeId: string, seatIds: string[], combos: { comboId: string; quantity: number }[], token: string): Promise<any> => {
    const response = await fetch(`${API_URL}/showtimes/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ showtimeId, seatIds, combos }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create booking');
    }
    return response.json();
  },

  createPaymentIntent: async (bookingId: string, token: string): Promise<{ clientSecret: string; isMock?: boolean }> => {
    const response = await fetch(`${API_URL}/payment/${bookingId}/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }
    return response.json();
  },

  createQRCode: async (bookingId: string, amount: number, token: string): Promise<{ qrUrl: string }> => {
    const response = await fetch(`${API_URL}/payment/${bookingId}/qr-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create QR code');
    }
    return response.json();
  }
};
