export interface MovieBase {
  title: string;
  year: number;
  ids: {
    trakt?: number;
    slug?: string;
    imdb?: string;
    tmdb?: number;
  };
}

export interface MovieDetails extends MovieBase {
  tagline?: string;
  overview?: string;
  released?: string;
  runtime?: number;
  country?: string;
  trailer?: string;
  homepage?: string;
  status?: string;
  rating?: number;
  votes?: number;
  comment_count?: number;
  updated_at?: string;
  language?: string;
  available_translations?: string[];
  genres?: string[];
  certification?: string;
  // Enrichment from OMDb
  poster?: string;
  omdbRating?: string;
}

export interface IMovieProvider {
  searchMovies(query: string): Promise<MovieBase[]>;
  getTrendingMovies(limit?: number): Promise<MovieBase[]>;
  getMovieDetails(imdbId: string): Promise<MovieDetails>;
}
