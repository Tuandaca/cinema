"use client";

import Hero from "@/components/home/Hero";
import MovieCard from "@/components/movies/MovieCard";
import { movieService } from "@/services/movie.service";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
  });

  return (
    <div className="flex flex-col w-full">
      <Hero />
      
      {/* Trending Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-headline font-bold mb-2">Trending Now</h2>
            <p className="text-gray-400">Most watched movies this week</p>
          </div>
          <button className="text-coicine-gold font-bold hover:underline">View All</button>
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
      </section>

      {/* Promo Banner */}
      <section className="py-24 container mx-auto px-6">
        <div className="relative h-64 w-full rounded-3xl overflow-hidden glass border border-white/10 flex items-center p-12">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-coicine-gold/20 to-transparent"></div>
          <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-headline font-bold mb-4">Join CoiCine Membership</h3>
            <p className="text-gray-300 mb-6">Get 20% off on all tickets and exclusive access to early premieres.</p>
            <button className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-coicine-gold transition-colors">
              Sign Up Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
