'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';
import { Star, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MoviesPage() {
  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
  });

  if (isLoading) return <div className="min-h-screen pt-32 text-center">Loading movies...</div>;

  return (
    <div className="min-h-screen bg-coicine-charcoal pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-12">Tất cả phim</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {movies?.map((movie) => (
            <Link 
              key={movie.id} 
              href={`/movies/${movie.id}`}
              className="group bg-zinc-900/40 rounded-2xl overflow-hidden border border-white/5 hover:border-coicine-gold/30 transition-all transform hover:-translate-y-2"
            >
              <div className="aspect-[2/3] relative">
                {movie.posterUrl && (
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 group-hover:text-coicine-gold transition-colors">{movie.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-coicine-gold fill-coicine-gold" />
                    <span>{movie.rating?.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{movie.runtime} min</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
