"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';
import { Star, Clock, Calendar, Globe, Play, Ticket, ArrowLeft, Loader2, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = '/api';

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  room: { name: string; capacity: number };
}

const MovieDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [showShowtimes, setShowShowtimes] = useState(false);

  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => movieService.getMovieById(id as string),
    enabled: !!id,
  });

  const { data: showtimes, isLoading: showtimesLoading } = useQuery<Showtime[]>({
    queryKey: ['showtimes', id],
    queryFn: async () => {
      // Fetch showtimes for this movie using the corrected endpoint
      const showtimeRes = await axios.get(`${API_URL}/movies/${id}/showtimes`);
      return showtimeRes.data;
    },
    enabled: !!id && showShowtimes,
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

  const handleBookClick = () => {
    setShowShowtimes(true);
  };

  const handleSelectShowtime = (showtimeId: string) => {
    router.push(`/movies/${id}/booking?showtimeId=${showtimeId}`);
  };

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
                  onClick={handleBookClick}
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

              {/* Showtimes Section */}
              <AnimatePresence>
                {showShowtimes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-10"
                  >
                    <h3 className="text-2xl font-headline font-bold mb-6 flex items-center gap-3">
                      <Calendar className="text-coicine-gold" size={24} />
                      Available Showtimes
                    </h3>
                    {showtimesLoading ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={20} />
                        Loading showtimes...
                      </div>
                    ) : showtimes && showtimes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {showtimes.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => handleSelectShowtime(st.id)}
                            className="group flex items-center justify-between p-5 bg-zinc-900/60 rounded-xl border border-white/5 hover:border-coicine-gold/30 hover:bg-zinc-800/60 transition-all"
                          >
                            <div className="text-left">
                              <p className="text-white font-bold mb-1">
                                {new Date(st.startTime).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-coicine-gold font-mono text-lg">
                                {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' — '}
                                {new Date(st.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">
                                <MapPin size={14} /> {st.room.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-cyan-400 font-bold text-xl">${st.priceBase}</p>
                              <ChevronRight size={20} className="text-white/30 group-hover:text-coicine-gold transition-colors ml-auto mt-1" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-zinc-900/40 rounded-xl border border-white/5 text-center text-gray-400">
                        <p className="mb-2">Chưa có suất chiếu cho phim này.</p>
                        <p className="text-sm text-white/30">Vui lòng quay lại sau hoặc liên hệ rạp.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
