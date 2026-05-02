"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';
import { Star, Clock, Calendar, Globe, Play, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MovieDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => movieService.getMovieById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-coicine-gold animate-spin" />
        <p className="text-gray-400 font-medium">Loading cinematic details...</p>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6">
        <h2 className="text-3xl font-headline font-bold text-red-500">Movie Not Found</h2>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-coicine-charcoal">
      {/* Backdrop Section */}
      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0">
          {movie.backdropUrl ? (
            <img 
              src={movie.backdropUrl} 
              alt={movie.title} 
              className="w-full h-full object-cover"
            />
          ) : movie.posterUrl ? (
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              className="w-full h-full object-cover blur-md opacity-50 transform scale-110"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-coicine-charcoal via-coicine-charcoal/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-coicine-charcoal/60 via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-28 left-6 md:left-12 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/20 transition-all z-20"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 md:px-12 relative -mt-32 pb-24 z-10">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left: Poster */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 lg:w-1/4 shrink-0"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {movie.posterUrl ? (
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-[2/3] bg-neutral-800 flex items-center justify-center text-gray-500">No Poster</div>
              )}
            </div>
          </motion.div>

          {/* Right: Info */}
          <div className="flex-grow">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {movie.genres.map(genre => (
                  <span key={genre.id} className="px-4 py-1 bg-coicine-gold/10 text-coicine-gold border border-coicine-gold/20 rounded-full text-sm font-medium">
                    {genre.name}
                  </span>
                ))}
              </div>

              <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight tracking-tighter">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-8 mb-10 text-gray-300">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-coicine-gold fill-coicine-gold" />
                  <span className="text-xl font-bold text-white">{movie.rating ? movie.rating.toFixed(2) : 'N/A'}</span>
                  <span className="text-sm">Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-gray-400" />
                  <span className="text-white">{movie.runtime || 'N/A'} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" />
                  <span className="text-white">{movie.released ? new Date(movie.released).getFullYear() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-gray-400" />
                  <span className="text-white uppercase">{movie.language || 'EN'}</span>
                </div>
              </div>

              <p className="text-xl text-gray-400 leading-relaxed mb-12 max-w-3xl">
                {movie.description || "No overview available for this movie."}
              </p>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => router.push('/movies/test-showtime-1/booking')}
                  className="flex items-center gap-3 px-10 py-5 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                >
                  <Ticket size={24} />
                  Book Tickets Now
                </button>
                {movie.trailerUrl && (
                  <a 
                    href={movie.trailerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-10 py-5 bg-white/10 glass rounded-full font-bold hover:bg-white/20 transition-all"
                  >
                    <Play size={24} />
                    Watch Trailer
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
