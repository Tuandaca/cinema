import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string;
  title: string;
  overview: string | null;
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
