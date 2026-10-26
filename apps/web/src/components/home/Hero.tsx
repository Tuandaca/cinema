"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Ticket, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '@/services/movie.service';

interface HeroProps {
  movies?: Movie[];
  isLoading?: boolean;
}

// Map high-definition original TMDB backdrops for cinematic display
const TMDB_BACKDROP_MAP: Record<string, string> = {
  'movie-the-dark-knight': 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
  'movie-oppenheimer': 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
  'movie-inception': 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  'movie-interstellar': 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
  'movie-dune-part-two': 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b4q.jpg',
  'movie-avengers-endgame': 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  'movie-avatar-fire-and-ash': 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop',
  'movie-spider-man-no-way-home': 'https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
  'movie-top-gun-maverick': 'https://image.tmdb.org/t/p/original/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg',
  'movie-gladiator-ii': 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL69ovr.jpg',
  'movie-deadpool-and-wolverine': 'https://image.tmdb.org/t/p/original/yDHYTjA3R0neEjyiism93Z4a0Ml.jpg',
};

// Safe fallback catalog with top 5 rated blockbusters if API is loading or empty
const FALLBACK_HERO_MOVIES: Movie[] = [
  {
    id: 'movie-the-dark-knight',
    title: 'The Dark Knight',
    description:
      'Khi mối hiểm họa Joker gieo rắc sự hỗn loạn và hoang mang tột độ lên cư dân Gotham, Batman phải đối mặt với thử thách tâm lý và thể xác lớn nhất để bảo vệ công lý.',
    posterUrl: 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    rating: 9.0,
    runtime: 152,
    released: '2008-07-18',
    language: 'English',
    genres: [
      { id: 'action', name: 'Hành động' },
      { id: 'crime', name: 'Tội phạm' },
      { id: 'drama', name: 'Kịch tính' },
    ],
  },
  {
    id: 'movie-oppenheimer',
    title: 'Oppenheimer',
    description:
      'Câu chuyện hấp dẫn về nhà vật lý lý thuyết J. Robert Oppenheimer và vai trò lãnh đạo dự án Manhattan - phát minh làm thay đổi vĩnh viễn vận mệnh nhân loại.',
    posterUrl: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    rating: 8.9,
    runtime: 180,
    released: '2023-07-21',
    language: 'English',
    genres: [
      { id: 'biography', name: 'Tiểu sử' },
      { id: 'drama', name: 'Kịch tính' },
      { id: 'history', name: 'Lịch sử' },
    ],
  },
  {
    id: 'movie-inception',
    title: 'Inception',
    description:
      'Kẻ trộm bí mật kinh doanh bằng công nghệ xâm nhập giấc mơ nhận nhiệm vụ bất khả thi: cấy ghép một ý tưởng vào tiềm thức của người thừa kế đế chế toàn cầu.',
    posterUrl: 'https://image.tmdb.org/t/p/original/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    rating: 8.8,
    runtime: 148,
    released: '2010-07-16',
    language: 'English',
    genres: [
      { id: 'scifi', name: 'Khoa học viễn tưởng' },
      { id: 'action', name: 'Hành động' },
    ],
  },
  {
    id: 'movie-interstellar',
    title: 'Interstellar',
    description:
      'Trong bối cảnh Trái Đất cạn kiệt tài nguyên, một nhóm nhà thám hiểm dũng cảm xuyên qua hố sâu không gian để tìm kiếm hành tinh mới cho sự sinh tồn của loài người.',
    posterUrl: 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZAZE3Tc',
    rating: 8.6,
    runtime: 169,
    released: '2014-11-07',
    language: 'English',
    genres: [
      { id: 'scifi', name: 'Khoa học viễn tưởng' },
      { id: 'adventure', name: 'Phiêu lưu' },
      { id: 'drama', name: 'Kịch tính' },
    ],
  },
  {
    id: 'movie-dune-part-two',
    title: 'Dune: Part Two',
    description:
      'Paul Atreides liên minh cùng Chani và tộc người Fremen, bước vào cuộc chiến định mệnh báo thù những kẻ đã tàn sát gia tộc và định hình tương lai thiên hà.',
    posterUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b4q.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: 8.5,
    runtime: 166,
    released: '2024-03-01',
    language: 'English',
    genres: [
      { id: 'scifi', name: 'Khoa học viễn tưởng' },
      { id: 'adventure', name: 'Phiêu lưu' },
    ],
  },
];

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

const Hero: React.FC<HeroProps> = ({ movies, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Sắp xếp các phim theo rating giảm dần và chọn top 5
  const topMovies = useMemo(() => {
    if (!movies || movies.length === 0) return FALLBACK_HERO_MOVIES;
    const sorted = [...movies]
      .filter((m) => (m.rating ?? 0) > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return sorted.slice(0, 5).length > 0 ? sorted.slice(0, 5) : FALLBACK_HERO_MOVIES;
  }, [movies]);

  // Đảm bảo currentIndex luôn hợp lệ khi danh sách phim thay đổi
  useEffect(() => {
    if (currentIndex >= topMovies.length) {
      setCurrentIndex(0);
    }
  }, [topMovies.length, currentIndex]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % topMovies.length);
  }, [topMovies.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + topMovies.length) % topMovies.length);
  }, [topMovies.length]);

  const handleSelectSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Tự động chuyển slide mỗi 6 giây, dừng khi rê chuột hoặc mở modal trailer
  useEffect(() => {
    if (isPaused || isTrailerOpen || topMovies.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, isTrailerOpen, topMovies.length, handleNext]);

  // Đóng trailer khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTrailerOpen(false);
      }
    };
    if (isTrailerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTrailerOpen]);

  // Xử lý vuốt chạm trên thiết bị cảm ứng
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    if (deltaX > 50) {
      handlePrev();
    } else if (deltaX < -50) {
      handleNext();
    }
    touchStartXRef.current = null;
  };

  const currentMovie = topMovies[currentIndex] || topMovies[0];

  const backdropUrl =
    TMDB_BACKDROP_MAP[currentMovie.id] ||
    currentMovie.backdropUrl ||
    currentMovie.posterUrl ||
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop';

  const youtubeId = extractYouTubeId(currentMovie.trailerUrl) || 'EXeTwQWrcwY';

  return (
    <section
      className="relative min-h-[640px] h-[90vh] md:h-screen w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Animated Backdrop Carousel */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentMovie.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Cinematic Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-coicine-charcoal via-coicine-charcoal/80 md:via-coicine-charcoal/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-coicine-charcoal via-transparent to-coicine-charcoal/40" />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Info */}
      <div className="relative h-full container mx-auto px-6 flex flex-col justify-center z-10 pt-16 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMovie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            {/* Badges: Top Rated Rank, Rating, Genres */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-red-600 text-white text-[11px] font-bold rounded uppercase tracking-widest shadow-md">
                #{currentIndex + 1} TOP RATED
              </span>
              <span className="px-3 py-1 bg-coicine-gold/20 border border-coicine-gold/40 text-coicine-gold text-xs font-bold rounded flex items-center gap-1 shadow-[0_0_12px_rgba(255,215,0,0.25)]">
                ★ {currentMovie.rating ? currentMovie.rating.toFixed(1) : '9.0'} Rating
              </span>
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentMovie.genres.slice(0, 3).map((g) => (
                    <span
                      key={g.id || g.name}
                      className="px-2.5 py-1 bg-white/10 glass text-gray-200 text-xs rounded border border-white/10"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
              {currentMovie.runtime && (
                <span className="text-gray-400 text-xs font-medium ml-1">
                  • {currentMovie.runtime} phút
                </span>
              )}
            </div>

            {/* Movie Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-headline font-bold mb-4 leading-tight tracking-tighter text-white drop-shadow-xl uppercase">
              {currentMovie.title}
            </h1>

            {/* Synopsis */}
            <p className="text-gray-300 text-base sm:text-lg md:text-xl mb-8 leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-4 drop-shadow">
              {currentMovie.description}
            </p>

            {/* Action Buttons: Direct Booking & Trailer */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/movies/${currentMovie.id}`}
                className="flex items-center gap-3 px-8 py-4 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_25px_rgba(255,215,0,0.45)] cursor-pointer"
              >
                <Ticket size={20} />
                <span>Đặt vé ngay</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center gap-3 px-7 py-4 bg-white/10 glass text-white rounded-full font-bold hover:bg-white/20 transition-all transform hover:scale-105 border border-white/10 cursor-pointer"
              >
                <Play size={20} className="text-coicine-gold fill-coicine-gold" />
                <span>Xem Trailer</span>
              </button>

              <Link
                href={`/movies/${currentMovie.id}`}
                aria-label="Chi tiết phim"
                className="p-4 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-full transition-all border border-white/10 cursor-pointer"
              >
                <Info size={20} />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls: Pagination Dots, Progress Timer Bar, Prev/Next Buttons */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Pagination Indicators & Progress Bar */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
            {topMovies.map((movie, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => handleSelectSlide(idx)}
                  className={`relative transition-all duration-300 rounded-full cursor-pointer overflow-hidden ${
                    isActive
                      ? 'w-24 sm:w-28 h-5 bg-coicine-gold/20 border border-coicine-gold/60 flex items-center justify-center px-2'
                      : 'w-3 h-3 bg-white/25 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${movie.title}`}
                >
                  {isActive && (
                    <>
                      <motion.div
                        key={`${currentIndex}-${isPaused}`}
                        initial={{ width: '0%' }}
                        animate={{ width: isPaused ? '0%' : '100%' }}
                        transition={{ duration: 6, ease: 'linear' }}
                        className="absolute inset-0 bg-coicine-gold opacity-35"
                      />
                      <span className="relative z-10 text-[9px] font-black text-coicine-gold uppercase tracking-wider truncate">
                        #{idx + 1} TOP
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Prev / Next Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous movie"
              className="p-3 bg-white/10 hover:bg-white/20 glass text-white rounded-full transition-all border border-white/10 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next movie"
              className="p-3 bg-white/10 hover:bg-white/20 glass text-white rounded-full transition-all border border-white/10 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Fade Out */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-coicine-charcoal to-transparent pointer-events-none" />

      {/* Dynamic YouTube Trailer Modal */}
      <AnimatePresence>
        {isTrailerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setIsTrailerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/80">
                <div className="flex items-center gap-3">
                  <Play size={18} className="text-coicine-gold fill-coicine-gold" />
                  <h3 className="font-bold text-white text-base sm:text-lg truncate">
                    Trailer: {currentMovie.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer"
                  aria-label="Close trailer modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* YouTube Video Player Embed */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={`Trailer: ${currentMovie.title}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
