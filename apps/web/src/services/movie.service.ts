import axios from 'axios';

const BASE_URL = '/api';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
console.log('🎬 MovieService using API_URL:', API_URL);

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
  }
};
