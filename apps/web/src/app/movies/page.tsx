'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movie.service';
import MovieCard from '@/components/movies/MovieCard';
import { Film, RotateCcw, AlertCircle, Search } from 'lucide-react';

export default function MoviesPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data: movies,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['movies', selectedGenre],
    queryFn: () => movieService.getAllMovies(selectedGenre || undefined),
  });

  // Extract unique genres for quick filtering
  const availableGenres = useMemo(() => {
    if (!movies) return [];
    const set = new Set<string>();
    movies.forEach((m) => {
      m.genres?.forEach((g) => {
        if (g.name) set.add(g.name);
      });
    });
    return Array.from(set);
  }, [movies]);

  // Filter movies by search query
  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    if (!searchQuery.trim()) return movies;
    const query = searchQuery.toLowerCase().trim();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.genres?.some((g) => g.name.toLowerCase().includes(query))
    );
  }, [movies, searchQuery]);

  const handleResetFilters = () => {
    setSelectedGenre('');
    setSearchQuery('');
    refetch();
  };

  return (
    <div className="min-h-screen bg-coicine-charcoal pt-32 pb-20 px-6">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">Tất cả phim</h1>
            <p className="text-gray-400">
              Khám phá danh sách các bộ phim chiếu rạp mới nhất tại CoiCine
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên phim..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-coicine-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* Genre Filter Pills */}
        {availableGenres.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === ''
                  ? 'bg-coicine-gold text-black shadow-md shadow-coicine-gold/20'
                  : 'bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              Tất cả
            </button>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-coicine-gold text-black shadow-md shadow-coicine-gold/20'
                    : 'bg-neutral-900 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          /* Loading Skeleton State */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-coicine-ebony rounded-2xl overflow-hidden border border-white/5 animate-pulse flex flex-col h-full"
              >
                <div className="aspect-[2/3] bg-neutral-800/60 relative" />
                <div className="p-4 flex flex-col flex-grow gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-3 bg-neutral-800 rounded-full" />
                    <div className="w-12 h-3 bg-neutral-800 rounded-full" />
                  </div>
                  <div className="w-3/4 h-5 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error State with Retry Button */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-headline font-bold text-white mb-2">
              Không thể tải danh sách phim
            </h3>
            <p className="text-gray-400 max-w-md mb-6 text-sm">
              Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối hoặc thử lại.
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-coicine-gold text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-lg shadow-coicine-gold/20"
            >
              <RotateCcw size={16} />
              Thử lại
            </button>
          </div>
        ) : !filteredMovies || filteredMovies.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-coicine-gold mb-6 shadow-2xl">
              <Film size={36} className="opacity-80" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-white mb-2">
              Không tìm thấy phim phù hợp
            </h3>
            <p className="text-gray-400 max-w-md mb-8 text-sm">
              Hiện tại không có bộ phim nào phù hợp với lựa chọn của bạn hoặc rạp đang cập nhật danh sách phim mới.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 bg-coicine-gold text-black font-bold rounded-full hover:bg-yellow-400 transition-all flex items-center gap-2 shadow-lg shadow-coicine-gold/20 transform hover:scale-105"
            >
              <RotateCcw size={18} />
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          /* Movie Grid using MovieCard */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
