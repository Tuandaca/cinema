import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const getHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

export const adminService = {
  // 1. Analytics
  async getAnalytics(token: string) {
    const res = await axios.get(`${API_URL}/admin/analytics`, getHeaders(token));
    return res.data;
  },

  // 2. Movies
  async getMovies(token: string, params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const res = await axios.get(`${API_URL}/admin/movies`, {
      ...getHeaders(token),
      params,
    });
    return res.data;
  },

  async createMovie(token: string, data: any) {
    const res = await axios.post(`${API_URL}/admin/movies`, data, getHeaders(token));
    return res.data;
  },

  async updateMovie(token: string, id: string, data: any) {
    const res = await axios.put(`${API_URL}/admin/movies/${id}`, data, getHeaders(token));
    return res.data;
  },

  async deleteMovie(token: string, id: string) {
    const res = await axios.delete(`${API_URL}/admin/movies/${id}`, getHeaders(token));
    return res.data;
  },

  async syncMovies(token: string, limit: number = 10) {
    const res = await axios.post(`${API_URL}/admin/movies/sync?limit=${limit}`, {}, getHeaders(token));
    return res.data;
  },

  // 3. Showtimes
  async getShowtimes(token: string, params?: { date?: string; movieId?: string; roomId?: string; page?: number; limit?: number }) {
    const res = await axios.get(`${API_URL}/admin/showtimes`, {
      ...getHeaders(token),
      params,
    });
    return res.data;
  },

  async createShowtime(token: string, data: any) {
    const res = await axios.post(`${API_URL}/admin/showtimes`, data, getHeaders(token));
    return res.data;
  },

  async updateShowtime(token: string, id: string, data: any) {
    const res = await axios.put(`${API_URL}/admin/showtimes/${id}`, data, getHeaders(token));
    return res.data;
  },

  async deleteShowtime(token: string, id: string) {
    const res = await axios.delete(`${API_URL}/admin/showtimes/${id}`, getHeaders(token));
    return res.data;
  },

  // 4. Rooms & Seats
  async getRooms(token: string) {
    const res = await axios.get(`${API_URL}/admin/rooms`, getHeaders(token));
    return res.data;
  },

  async getRoomSeats(token: string, roomId: string) {
    const res = await axios.get(`${API_URL}/admin/rooms/${roomId}/seats`, getHeaders(token));
    return res.data;
  },

  // 5. Bookings
  async getBookings(token: string, params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const res = await axios.get(`${API_URL}/admin/bookings`, {
      ...getHeaders(token),
      params,
    });
    return res.data;
  },

  async updateBookingStatus(token: string, id: string, status: string) {
    const res = await axios.put(`${API_URL}/admin/bookings/${id}/status`, { status }, getHeaders(token));
    return res.data;
  },
};
