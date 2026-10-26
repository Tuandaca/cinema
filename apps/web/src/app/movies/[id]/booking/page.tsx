'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import SeatGrid from '@/components/movies/SeatGrid';

// Note: In Next.js 15 App router, params is a promise but since this is a client component
// we can use standard React.use if needed, but often params are directly accessible or we use useParams
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import CinematicPoster from '@/components/common/CinematicPoster';

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const showtimeId = searchParams.get('showtimeId') as string;
  
  const { token, user } = useAuth();
  const { showError } = useToast();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const hasSelectedSeats = selectedSeatIds.length > 0;

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasSelectedSeats) {
      const storedTime = localStorage.getItem(`booking_start_${showtimeId}`);
      if (storedTime) {
        // Run immediately once so we don't wait 1s for the first tick
        const tick = () => {
          const elapsed = Math.floor((Date.now() - parseInt(storedTime)) / 1000);
          const remaining = 300 - elapsed; // 5 minutes
          if (remaining <= 0) {
            clearInterval(interval);
            localStorage.removeItem(`booking_start_${showtimeId}`);
            showError('Hết thời gian giữ ghế. Vui lòng chọn lại!');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setTimeLeft(remaining);
          }
        };
        tick(); // Initial tick
        interval = setInterval(tick, 1000);
      }
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [hasSelectedSeats, showtimeId, showError]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const { data: seats, isLoading: seatsLoading, error: seatsError } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: () => bookingService.getSeats(showtimeId),
    enabled: !!showtimeId,
  });

  const { data: showtime, isLoading: showtimeLoading } = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: () => bookingService.getShowtimeDetails(showtimeId),
    enabled: !!showtimeId,
  });

  const movieId = (params?.id as string) || (showtime as any)?.movie?.id || '';
  const isExpired = Boolean(showtime && new Date(showtime.startTime).getTime() <= Date.now());

  const handleLockSeats = async () => {
    if (isExpired || selectedSeatIds.length === 0 || !token) return;
    setIsLocking(true);
    try {
      await bookingService.lockSeats(showtimeId, selectedSeatIds, token);
      // Redirect to checkout
      const seatsQuery = selectedSeatIds.join(',');
      router.push(`/checkout?showtimeId=${showtimeId}&seats=${seatsQuery}`);
    } catch (err: any) {
      showError(err.message || 'Failed to lock seats');
    } finally {
      setIsLocking(false);
    }
  };

  if (seatsLoading || showtimeLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (seatsError) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading data</div>;
  if (!seats || !showtime) return <div className="min-h-screen flex items-center justify-center">Data not found</div>;

  if (isExpired) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-coicine-charcoal text-white pt-28 pb-16 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-zinc-900/90 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertCircle size={36} />
            </div>
            <h1 className="text-2xl font-bold font-headline text-white mb-3">
              Suất chiếu đã kết thúc
            </h1>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Suất chiếu của phim{' '}
              <span className="text-white font-semibold">{showtime.movie?.title}</span>{' '}
              vào lúc{' '}
              <span className="text-coicine-gold font-mono font-bold">
                {new Date(showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                — {new Date(showtime.startTime).toLocaleDateString('vi-VN')}
              </span>{' '}
              đã diễn ra hoặc đã kết thúc.
            </p>
            <p className="text-xs text-red-400/90 mb-6 bg-red-500/10 py-2.5 px-3 rounded-lg border border-red-500/20">
              Hệ thống đã khóa tính năng chọn ghế và đặt vé cho suất chiếu này.
            </p>
            <button
              onClick={() => router.push(`/movies/${movieId}`)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-coicine-gold/20"
            >
              <ArrowLeft size={18} />
              <span>Quay lại chọn suất chiếu khác</span>
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Movie Info Banner */}
        <div className="mb-8 flex flex-col md:flex-row gap-6 items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="w-24 h-36 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
            <CinematicPoster
              src={showtime.movie.posterUrl}
              alt={showtime.movie.title}
              title={showtime.movie.title}
              className="w-24 h-36 object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-outfit font-bold mb-3">{showtime.movie.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/70 text-sm">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-coicine-gold"/> {showtime.room.name}</div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-coicine-gold"/> {new Date(showtime.startTime).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-coicine-gold"/> {new Date(showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-md mb-8">
          <SeatGrid 
            showtimeId={showtimeId} 
            initialSeats={seats} 
            onSelectionChange={setSelectedSeatIds} 
            currentUserId={user?.id}
          />
        </div>

        <div className="flex justify-between items-center bg-zinc-900/80 p-6 rounded-2xl border border-white/10 sticky bottom-6 z-10 backdrop-blur-xl shadow-2xl">
          <div>
            <p className="text-white/60 text-sm mb-1">Selected Seats</p>
            <p className="text-xl font-bold font-outfit">
              {selectedSeatIds.length > 0 
                ? seats.filter(s => selectedSeatIds.includes(s.id)).map(s => `${s.row}${s.number}`).join(', ') 
                : 'None selected'}
            </p>
          </div>
          <div className="text-right flex items-center gap-6">
            {timeLeft !== null && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-mono text-lg flex flex-col items-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <span className="text-xs text-white/50 mb-1">Time Left</span>
                <span className="font-bold leading-none">{formatTime(timeLeft)}</span>
              </div>
            )}
            <div>
              <p className="text-white/60 text-sm mb-1">Total Price</p>
              <p className="text-2xl font-bold text-cyan-400 font-outfit">
                {selectedSeatIds.length > 0 
                  ? selectedSeatIds.reduce((sum, id) => {
                      const s = seats.find(seat => seat.id === id);
                      const mult = s?.type === 'VIP' ? 1.5 : s?.type === 'SWEETBOX' ? 2.0 : 1.0;
                      return sum + (showtime.priceBase * mult);
                    }, 0).toLocaleString('vi-VN') + ' đ'
                  : '0 đ'}
              </p>
            </div>
            <button
              onClick={handleLockSeats}
              disabled={selectedSeatIds.length === 0 || isLocking}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] disabled:shadow-none"
            >
              {isLocking ? 'Locking...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
