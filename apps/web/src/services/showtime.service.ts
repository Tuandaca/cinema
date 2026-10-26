import axios from 'axios';

export interface RoomInfo {
  id: string;
  name: string;
  capacity?: number;
}

export interface MovieInfo {
  id: string;
  title: string;
  description?: string | null;
  posterUrl: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  runtime: number | null;
  rating?: number | null;
  status?: string | null;
  genres?: Array<{ id: string; name: string }>;
}

export interface ShowtimeItem {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  movie?: MovieInfo;
  room?: RoomInfo;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const showtimeService = {
  getShowtimes: async (date?: string): Promise<ShowtimeItem[]> => {
    try {
      const response = await axios.get('/api/showtimes', {
        params: date ? { date } : {},
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (error: any) {
      // Resilient fallback: If /api/showtimes returns 404 (e.g. backend route is not yet deployed),
      // gracefully query /api/movies and individual showtimes at /api/movies/:id/showtimes
      if (error?.response?.status === 404) {
        try {
          const moviesRes = await axios.get('/api/movies');
          const movies: MovieInfo[] = Array.isArray(moviesRes.data)
            ? moviesRes.data
            : moviesRes.data?.items || [];

          const results: ShowtimeItem[] = [];
          await Promise.all(
            movies.map(async (movie) => {
              try {
                const stRes = await axios.get(`/api/movies/${movie.id}/showtimes`);
                const stList = Array.isArray(stRes.data) ? stRes.data : [];
                for (const st of stList) {
                  if (date) {
                    const stDate = formatLocalDate(new Date(st.startTime));
                    if (stDate !== date) continue;
                  }
                  results.push({
                    id: st.id,
                    movieId: movie.id,
                    roomId: st.roomId || st.room?.id || '',
                    startTime: st.startTime,
                    endTime: st.endTime,
                    priceBase: st.priceBase,
                    movie: movie,
                    room: st.room || { id: st.roomId || '', name: 'Phòng Chiếu' },
                  });
                }
              } catch {
                // Ignore errors for individual movie showtime fetching
              }
            })
          );
          return results;
        } catch {
          throw error;
        }
      }
      throw error;
    }
  },
};
