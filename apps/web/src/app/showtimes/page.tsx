'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Star,
  Film,
  Ticket,
  ChevronRight,
  RotateCcw,
  CalendarX,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  showtimeService,
  ShowtimeItem,
  MovieInfo,
} from '@/services/showtime.service';

interface DateTab {
  key: string; // "YYYY-MM-DD"
  dayLabel: string; // "Hôm nay", "Thứ Hai", etc.
  dateFormatted: string; // "26/10"
}

const VIETNAMESE_DAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

function generateDateTabs(): DateTab[] {
  const tabs: DateTab[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    let dayLabel = VIETNAMESE_DAYS[d.getDay()];
    if (i === 0) dayLabel = 'Hôm nay';
    else if (i === 1) dayLabel = 'Ngày mai';

    tabs.push({
      key,
      dayLabel,
      dateFormatted: `${day}/${month}`,
    });
  }
  return tabs;
}

function formatShowtime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '00:00';
  }
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function MoviePoster({
  posterUrl,
  title,
}: {
  posterUrl: string | null | undefined;
  title: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!posterUrl || hasError) {
    return (
      <div className="w-full h-full aspect-[2/3] bg-gradient-to-br from-zinc-800 to-zinc-900/90 flex flex-col items-center justify-center p-4 text-center border border-white/5 rounded-xl">
        <Film className="w-10 h-10 text-coicine-gold/60 mb-2" />
        <span className="text-xs font-semibold text-gray-400 line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={title}
      onError={() => setHasError(true)}
      className="w-full h-full aspect-[2/3] object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
    />
  );
}

function ShowtimesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse bg-[#121218]/80 rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row gap-6 shadow-xl"
        >
          <div className="w-full sm:w-36 md:w-44 aspect-[2/3] rounded-xl bg-zinc-800/60 shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-7 w-2/3 max-w-md bg-zinc-800/80 rounded-lg" />
            <div className="flex gap-4">
              <div className="h-5 w-24 bg-zinc-800/50 rounded-full" />
              <div className="h-5 w-20 bg-zinc-800/50 rounded-full" />
              <div className="h-5 w-28 bg-zinc-800/50 rounded-full" />
            </div>
            <div className="pt-4 space-y-2">
              <div className="h-4 w-32 bg-zinc-800/40 rounded" />
              <div className="flex flex-wrap gap-3 pt-1">
                {[1, 2, 3, 4].map((pill) => (
                  <div
                    key={pill}
                    className="w-28 h-16 bg-zinc-800/50 rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface MovieGroup {
  movie: MovieInfo;
  showtimes: ShowtimeItem[];
}

function ShowtimesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateTabs = useMemo(() => generateDateTabs(), []);

  const dateParam = searchParams.get('date');
  const initialDate = useMemo(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return dateTabs[0]?.key || '';
  }, [dateParam, dateTabs]);

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  useEffect(() => {
    if (
      dateParam &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
      dateParam !== selectedDate
    ) {
      setSelectedDate(dateParam);
    }
  }, [dateParam, selectedDate]);

  const handleDateClick = (key: string) => {
    setSelectedDate(key);
    router.replace(`/showtimes?date=${key}`, { scroll: false });
  };

  const {
    data: showtimes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['showtimes', selectedDate],
    queryFn: () => showtimeService.getShowtimes(selectedDate),
    staleTime: 60 * 1000,
  });

  const groupedMovies = useMemo<MovieGroup[]>(() => {
    const map = new Map<string, MovieGroup>();

    for (const item of showtimes) {
      const movieId = item.movieId || item.movie?.id;
      if (!movieId) continue;

      if (!map.has(movieId)) {
        map.set(movieId, {
          movie: item.movie || {
            id: movieId,
            title: 'Phim không rõ tiêu đề',
            posterUrl: null,
            runtime: 120,
            rating: null,
          },
          showtimes: [],
        });
      }

      map.get(movieId)!.showtimes.push(item);
    }

    // Sort showtimes chronologically for each movie
    for (const group of map.values()) {
      group.showtimes.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }

    return Array.from(map.values());
  }, [showtimes]);

  const activeTabInfo = dateTabs.find((t) => t.key === selectedDate);
  const activeDateDisplay = activeTabInfo
    ? `${activeTabInfo.dayLabel} (${activeTabInfo.dateFormatted})`
    : selectedDate;

  return (
    <div className="min-h-screen bg-coicine-charcoal text-white pt-28 md:pt-32 pb-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Title Section */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-2 text-coicine-gold text-sm font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={16} />
            <span>Lịch chiếu phim rạp CoiCine</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight mb-3">
            Lịch Chiếu Phim
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl">
            Chọn ngày và suất chiếu phù hợp để thưởng thức các siêu phẩm điện ảnh với chất lượng phòng chiếu và âm thanh đỉnh cao.
          </p>
        </div>

        {/* 7-Day Date Filter Tab Bar */}
        <div className="mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            {dateTabs.map((tab) => {
              const isSelected = selectedDate === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleDateClick(tab.key)}
                  className={`flex flex-col items-center justify-center min-w-[96px] sm:min-w-[110px] py-3 px-3 rounded-2xl transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'bg-coicine-gold text-black font-bold shadow-lg shadow-coicine-gold/20 scale-105'
                      : 'bg-[#121218]/90 text-gray-300 hover:text-white hover:bg-zinc-800/80 border border-white/5'
                  }`}
                >
                  <span
                    className={`text-xs uppercase tracking-wider ${
                      isSelected ? 'font-bold text-black/80' : 'text-gray-400'
                    }`}
                  >
                    {tab.dayLabel}
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-bold mt-0.5 ${
                      isSelected ? 'text-black' : 'text-white'
                    }`}
                  >
                    {tab.dateFormatted}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content States */}
        {isLoading ? (
          <ShowtimesLoadingSkeleton />
        ) : isError ? (
          <div className="bg-[#121218] rounded-2xl p-10 md:p-14 border border-red-500/20 text-center max-w-xl mx-auto my-8">
            <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-headline font-bold text-white mb-2">
              Không thể tải lịch chiếu
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {error instanceof Error
                ? error.message
                : 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng thử lại.'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-coicine-gold text-black font-bold hover:bg-yellow-400 transition-all shadow-md shadow-coicine-gold/20"
            >
              <RotateCcw size={18} />
              Thử lại ngay
            </button>
          </div>
        ) : groupedMovies.length === 0 ? (
          <div className="bg-[#121218]/70 rounded-2xl p-10 md:p-16 border border-white/5 text-center max-w-2xl mx-auto my-8 backdrop-blur-md">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-5 border border-white/5">
              <CalendarX className="w-10 h-10 text-coicine-gold/70" />
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-3">
              Không có suất chiếu cho ngày này
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-8 leading-relaxed">
              Hiện chưa có suất chiếu được xếp lịch cho ngày{' '}
              <span className="text-coicine-gold font-semibold">
                {activeDateDisplay}
              </span>
              . Vui lòng chọn một ngày khác trong tuần hoặc khám phá kho phim đang chiếu tại CoiCine.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {dateTabs.length > 0 && selectedDate !== dateTabs[0].key && (
                <button
                  onClick={() => handleDateClick(dateTabs[0].key)}
                  className="px-6 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-all border border-white/10"
                >
                  Xem lịch chiếu hôm nay ({dateTabs[0].dateFormatted})
                </button>
              )}
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-coicine-gold text-black font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-coicine-gold/20"
              >
                <Film size={18} />
                Khám phá phim đang chiếu
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-gray-300 text-sm md:text-base">
                Có <span className="text-coicine-gold font-bold">{groupedMovies.length}</span> phim đang chiếu vào{' '}
                <span className="text-white font-semibold">{activeDateDisplay}</span>
              </p>
            </div>

            {groupedMovies.map(({ movie, showtimes: movieShowtimes }) => (
              <div
                key={movie.id}
                className="bg-[#121218]/90 rounded-2xl border border-white/5 p-6 md:p-8 backdrop-blur-md shadow-xl hover:border-white/10 transition-all flex flex-col md:flex-row gap-6 md:gap-8 group"
              >
                {/* Movie Poster */}
                <div className="w-32 sm:w-40 md:w-48 shrink-0 mx-auto md:mx-0">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <MoviePoster posterUrl={movie.posterUrl} title={movie.title} />
                  </div>
                </div>

                {/* Movie Details & Showtimes */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Genres */}
                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {movie.genres.map((g) => (
                          <span
                            key={g.id}
                            className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-coicine-gold/10 text-coicine-gold border border-coicine-gold/20"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Movie Title */}
                    <h2 className="text-2xl md:text-3xl font-headline font-bold text-white group-hover:text-coicine-gold transition-colors mb-3">
                      <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
                    </h2>

                    {/* Meta stats: Rating, Duration */}
                    <div className="flex flex-wrap items-center gap-5 text-sm text-gray-300 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Star size={16} className="text-coicine-gold fill-coicine-gold" />
                        <span className="font-bold text-white">
                          {movie.rating ? movie.rating.toFixed(1) : '8.5'}
                        </span>
                        <span className="text-xs text-gray-500">/ 10</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock size={16} />
                        <span>{movie.runtime ? `${movie.runtime} phút` : '120 phút'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar size={16} />
                        <span>2D / 3D / IMAX</span>
                      </div>
                    </div>

                    {/* Showtimes Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <Clock size={14} className="text-coicine-gold" />
                        <span>Các suất chiếu khả dụng</span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {movieShowtimes.map((st) => {
                          const roomName = st.room?.name || 'Phòng 1';
                          const startTime = formatShowtime(st.startTime);
                          const price = formatPrice(st.priceBase);
                          const isPast =
                            new Date(st.startTime).getTime() <= Date.now();

                          if (isPast) {
                            return (
                              <div
                                key={st.id}
                                aria-disabled="true"
                                className="flex flex-col items-center justify-center min-w-[100px] px-4 py-2.5 rounded-xl border border-white/5 bg-zinc-900/40 opacity-50 cursor-not-allowed select-none shadow-none"
                                title="Suất chiếu đã qua"
                              >
                                <span className="text-base sm:text-lg font-mono font-bold text-white/40">
                                  {startTime}
                                </span>
                                <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                  Đã chiếu
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                  <MapPin size={10} />
                                  {roomName}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={st.id}
                              href={`/movies/${movie.id}/booking?showtimeId=${st.id}`}
                              className="group/pill flex flex-col items-center justify-center min-w-[100px] px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900/90 hover:bg-coicine-gold hover:border-coicine-gold transition-all duration-200 cursor-pointer shadow-md"
                            >
                              <span className="text-base sm:text-lg font-mono font-bold text-white group-hover/pill:text-black transition-colors">
                                {startTime}
                              </span>
                              <span className="text-xs text-coicine-gold group-hover/pill:text-black/90 font-semibold mt-0.5 transition-colors">
                                {price}
                              </span>
                              <span className="text-[10px] text-gray-400 group-hover/pill:text-black/70 font-medium transition-colors flex items-center gap-1 mt-0.5">
                                <MapPin size={10} />
                                {roomName}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-gray-400">
                      Chọn khung giờ để xem sơ đồ ghế và đặt chỗ trực tuyến
                    </p>

                    <Link
                      href={`/movies/${movie.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-coicine-gold hover:text-black border border-white/10 text-white text-sm font-semibold transition-all group/btn"
                    >
                      <Ticket size={16} />
                      <span>Chi tiết phim & Đặt vé</span>
                      <ChevronRight
                        size={16}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShowtimesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-coicine-charcoal text-white pt-28 md:pt-32 pb-24 px-4 sm:px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <div className="h-8 w-64 bg-zinc-800/80 rounded-lg animate-pulse mb-3" />
              <div className="h-4 w-96 bg-zinc-800/40 rounded-lg animate-pulse" />
            </div>
            <ShowtimesLoadingSkeleton />
          </div>
        </div>
      }
    >
      <ShowtimesContent />
    </Suspense>
  );
}
