"use client";

import MovieCard from "@/components/movies/MovieCard";
import { movieService } from "@/services/movie.service";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function MoviesPage() {
  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
  });

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-5xl font-headline font-bold mb-4">Explore Movies</h1>
        <p className="text-gray-400">Discover your next favorite cinematic experience</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-coicine-gold animate-spin" />
          <p className="text-gray-400 font-medium">Fetching cinematic magic...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500">
          Failed to load movies. Please make sure the Backend is running.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {movies?.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
