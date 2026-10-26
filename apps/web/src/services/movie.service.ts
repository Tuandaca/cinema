import axios from 'axios';

const BASE_URL = '/api';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;



export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  released: string | null;
  runtime: number | null;
  rating: number | null;
  language: string | null;
  genres: Genre[];
}

export interface ShowtimeRoom {
  id?: string;
  name: string;
  capacity?: number;
}

export interface Showtime {
  id: string;
  movieId?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  room: ShowtimeRoom;
}

export interface GetShowtimesParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export type GetShowtimesResponse = Showtime[] & {
  showtimes: Showtime[];
  hasMore: boolean;
};

export const movieService = {
  getAllMovies: async (genre?: string): Promise<Movie[]> => {
    const response = await axios.get(`${API_URL}/movies`, {
      params: { genre }
    });
    return response.data;
  },

  getMovieById: async (id: string): Promise<Movie> => {
    const response = await axios.get(`${API_URL}/movies/${id}`);
    return response.data;
  },

  getShowtimes: async (
    id: string,
    params?: GetShowtimesParams
  ): Promise<GetShowtimesResponse> => {
    const response = await axios.get(`${API_URL}/movies/${id}/showtimes`, {
      params,
    });
    const rawData = response.data;
    const items: Showtime[] = Array.isArray(rawData)
      ? rawData
      : (Array.isArray(rawData?.showtimes) ? rawData.showtimes : []);
    const headerHasMore = response.headers?.['x-has-more'];
    const hasMore =
      headerHasMore === 'true' ||
      headerHasMore === true ||
      Boolean(rawData?.hasMore);

    return Object.assign([...items], {
      showtimes: items,
      hasMore,
    }) as GetShowtimesResponse;
  },
};

