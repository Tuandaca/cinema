"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { movieService, Movie } from '@/services/movie.service';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Play,
  Ticket,
  ArrowLeft,
  Loader2,
  MapPin,
  ChevronRight,
  X,
  Film,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = '/api';

export interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  room: { name: string; capacity: number };
}

interface MovieDetailViewProps {
  id: string;
  initialMovie?: Movie | null;
}

function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function MovieDetailView({ id, initialMovie }: MovieDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'showtimes' | 'overview' | 'details'>('showtimes');
  const [showShowtimes, setShowShowtimes] = useState(true);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Client query with initialData from server SSR
  const { data: movie, isLoading, isError } = useQuery<Movie>({
    queryKey: ['movie', id],
    queryFn: () => movieService.getMovieById(id),
    initialData: initialMovie || undefined,
    enabled: !!id,
  });

  // Showtimes query
  const { data: showtimes, isLoading: showtimesLoading } = useQuery<Showtime[]>({
    queryKey: ['showtimes', id],
    queryFn: async () => {
      const showtimeRes = await axios.get(`${API_URL}/movies/${id}/showtimes`);
      return showtimeRes.data;
    },
    enabled: !!id,
  });

  const youtubeVideoId = useMemo(() => {
    return extractYouTubeId(movie?.trailerUrl || null);
  }, [movie?.trailerUrl]);

  if (isLoading && !movie) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-coicine-charcoal">
        <Loader2 className="w-12 h-12 text-coicine-gold animate-spin" />
        <p className="text-gray-400 font-medium">Đang tải thông tin phim...</p>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-coicine-charcoal">
        <h2 className="text-3xl font-headline font-bold text-red-500">Không tìm thấy phim</h2>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>
      </div>
    );
  }

  const handleBookClick = () => {
    setActiveTab('showtimes');
    setShowShowtimes(true);
    const showtimesEl = document.getElementById('showtimes-section');
    if (showtimesEl) {
      showtimesEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectShowtime = (showtimeId: string) => {
    router.push(`/movies/${id}/booking?showtimeId=${showtimeId}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-coicine-charcoal text-white">
      {/* Backdrop Section */}
      <div className="relative h-[65vh] w-full">
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
              className="w-full h-full object-cover blur-md opacity-40 transform scale-110"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-coicine-charcoal via-coicine-charcoal/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-coicine-charcoal/70 via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-28 left-6 md:left-12 p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-all z-20 text-white shadow-lg"
          aria-label="Quay lại"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Floating Quick Action over Backdrop */}
        {movie.trailerUrl && (
          <button
            onClick={() => setIsTrailerModalOpen(true)}
            className="absolute bottom-16 right-6 md:right-12 flex items-center gap-3 px-6 py-3 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 rounded-full text-white font-medium transition-all group z-20"
          >
            <div className="w-8 h-8 rounded-full bg-coicine-gold text-black flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={16} fill="black" />
            </div>
            <span>Xem Trailer</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 md:px-12 relative -mt-36 pb-24 z-10">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left: Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-1/3 lg:w-1/4 shrink-0"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 group relative">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="aspect-[2/3] bg-neutral-800 flex items-center justify-center text-gray-500">
                  Không có poster
                </div>
              )}
              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-coicine-gold text-black flex items-center justify-center shadow-lg shadow-coicine-gold/30">
                    <Play size={28} fill="black" />
                  </div>
                </button>
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
              {/* Genre Pills */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {movie.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-4 py-1 bg-coicine-gold/10 text-coicine-gold border border-coicine-gold/20 rounded-full text-sm font-medium"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 leading-tight tracking-tight">
                {movie.title}
              </h1>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-6 md:gap-8 mb-8 text-gray-300">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-coicine-gold fill-coicine-gold" />
                  <span className="text-xl font-bold text-white">
                    {movie.rating ? movie.rating.toFixed(1) : 'N/A'}
                  </span>
                  <span className="text-xs text-gray-400">/ 10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-gray-400" />
                  <span className="text-white">{movie.runtime || 'N/A'} phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-gray-400" />
                  <span className="text-white">
                    {movie.released ? new Date(movie.released).getFullYear() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-gray-400" />
                  <span className="text-white uppercase">{movie.language || 'EN'}</span>
                </div>
              </div>

              {/* Primary Call to Action buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <button
                  onClick={handleBookClick}
                  className="flex items-center gap-3 px-8 py-4 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                >
                  <Ticket size={22} />
                  Đặt Vé Ngay
                </button>
                {movie.trailerUrl && (
                  <button
                    onClick={() => setIsTrailerModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-white/10 glass rounded-full font-bold hover:bg-white/20 transition-all text-white"
                  >
                    <Play size={22} />
                    Trailer
                  </button>
                )}
              </div>

              {/* Interactive Tabs */}
              <div className="border-b border-white/10 mb-8 flex gap-8">
                <button
                  onClick={() => {
                    setActiveTab('showtimes');
                    setShowShowtimes(true);
                  }}
                  className={`pb-4 text-base md:text-lg font-semibold flex items-center gap-2 transition-colors relative ${
                    activeTab === 'showtimes'
                      ? 'text-coicine-gold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar size={20} />
                  Lịch Chiếu & Đặt Vé
                  {activeTab === 'showtimes' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-coicine-gold"
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 text-base md:text-lg font-semibold flex items-center gap-2 transition-colors relative ${
                    activeTab === 'overview'
                      ? 'text-coicine-gold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Film size={20} />
                  Cốt Truyện
                  {activeTab === 'overview' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-coicine-gold"
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-4 text-base md:text-lg font-semibold flex items-center gap-2 transition-colors relative ${
                    activeTab === 'details'
                      ? 'text-coicine-gold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Info size={20} />
                  Thông Tin Chi Tiết
                  {activeTab === 'details' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-coicine-gold"
                    />
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div id="showtimes-section">
                {activeTab === 'showtimes' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showtimesLoading ? (
                      <div className="flex items-center gap-3 text-gray-400 p-8">
                        <Loader2 className="animate-spin text-coicine-gold" size={24} />
                        <span>Đang tải danh sách suất chiếu...</span>
                      </div>
                    ) : showtimes && showtimes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {showtimes.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => handleSelectShowtime(st.id)}
                            className="group flex items-center justify-between p-5 bg-zinc-900/60 rounded-xl border border-white/5 hover:border-coicine-gold/30 hover:bg-zinc-800/60 transition-all text-left"
                          >
                            <div>
                              <p className="text-white font-bold mb-1">
                                {new Date(st.startTime).toLocaleDateString('vi-VN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                              <p className="text-coicine-gold font-mono text-lg font-semibold">
                                {new Date(st.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' — '}
                                {new Date(st.endTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                                <MapPin size={14} className="text-coicine-gold" /> {st.room.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-cyan-400 font-bold text-xl">
                                {st.priceBase.toLocaleString('vi-VN')} đ
                              </p>
                              <ChevronRight
                                size={20}
                                className="text-white/30 group-hover:text-coicine-gold transition-colors ml-auto mt-2"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-zinc-900/40 rounded-xl border border-white/5 text-center text-gray-400">
                        <p className="text-lg font-medium mb-2">Chưa có suất chiếu khả dụng</p>
                        <p className="text-sm text-white/40">
                          Các suất chiếu mới sẽ sớm được cập nhật. Vui lòng quay lại sau!
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5"
                  >
                    <h3 className="text-xl font-headline font-bold text-white mb-4">
                      Tóm tắt nội dung
                    </h3>
                    <p className="text-lg text-gray-300 leading-relaxed max-w-4xl">
                      {movie.description || 'Chưa có thông tin tóm tắt cho phim này.'}
                    </p>
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5"
                  >
                    <h3 className="text-xl font-headline font-bold text-white mb-6">
                      Thông số kỹ thuật
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Thời lượng</p>
                        <p className="text-lg font-semibold text-white">
                          {movie.runtime ? `${movie.runtime} phút` : 'Đang cập nhật'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Ngôn ngữ</p>
                        <p className="text-lg font-semibold text-white uppercase">
                          {movie.language || 'Tiếng Anh (Phụ đề Tiếng Việt)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Ngày phát hành</p>
                        <p className="text-lg font-semibold text-white">
                          {movie.released
                            ? new Date(movie.released).toLocaleDateString('vi-VN')
                            : 'Đang cập nhật'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Đánh giá</p>
                        <p className="text-lg font-semibold text-coicine-gold">
                          {movie.rating ? `${movie.rating.toFixed(1)} / 10` : 'Chưa có đánh giá'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Thể loại</p>
                        <p className="text-lg font-semibold text-white">
                          {movie.genres?.map((g) => g.name).join(', ') || 'Đang cập nhật'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Định dạng chiếu</p>
                        <p className="text-lg font-semibold text-cyan-400">2D, 3D, IMAX Laser</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {isTrailerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <Play size={18} className="text-coicine-gold" />
                  <h3 className="font-bold text-white text-lg">
                    Trailer: {movie.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTrailerModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Player Embed */}
              <div className="relative aspect-video w-full bg-black">
                {youtubeVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                    title={`Trailer: ${movie.title}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : movie.trailerUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <p className="text-gray-300">
                      Không thể nhúng trực tiếp trailer từ link này.
                    </p>
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-colors"
                    >
                      Mở Trailer trong tab mới
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Phim hiện chưa có video trailer.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
