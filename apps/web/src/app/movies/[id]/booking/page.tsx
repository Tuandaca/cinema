'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import SeatGrid from '@/components/movies/SeatGrid';

// Note: In Next.js 15 App router, params is a promise but since this is a client component
// we can use standard React.use if needed, but often params are directly accessible or we use useParams
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params.id as string;
  
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedSeatIds.length > 0) {
      const storedTime = localStorage.getItem(`booking_start_${showtimeId}`);
      if (storedTime) {
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - parseInt(storedTime)) / 1000);
          const remaining = 300 - elapsed; // 5 minutes
          if (remaining <= 0) {
            clearInterval(interval);
            localStorage.removeItem(`booking_start_${showtimeId}`);
            alert('Hết thời gian giữ ghế. Vui lòng chọn lại!');
            window.location.reload();
          } else {
            setTimeLeft(remaining);
          }
        }, 1000);
      }
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [selectedSeatIds, showtimeId]);

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

  const handleLockSeats = async () => {
    if (selectedSeatIds.length === 0) return;
    setIsLocking(true);
    try {
      // Dummy token for now
      const token = 'dummy-jwt-token';
      await bookingService.lockSeats(showtimeId, selectedSeatIds, token);
      // Redirect to checkout
      const seatsQuery = selectedSeatIds.join(',');
      router.push(`/checkout?showtimeId=${showtimeId}&seats=${seatsQuery}`);
    } catch (err: any) {
      alert(err.message || 'Failed to lock seats');
    } finally {
      setIsLocking(false);
    }
  };

  if (seatsLoading || showtimeLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (seatsError) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading data</div>;
  if (!seats || !showtime) return <div className="min-h-screen flex items-center justify-center">Data not found</div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Movie Info Banner */}
        <div className="mb-8 flex flex-col md:flex-row gap-6 items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          {showtime.movie.posterUrl ? (
            <img src={showtime.movie.posterUrl} alt={showtime.movie.title} className="w-24 h-auto rounded-lg shadow-lg" />
          ) : (
            <div className="w-24 h-36 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">No Poster</div>
          )}
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
            // currentUserId="user-123" // Replace with actual user ID from auth context
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
                ${selectedSeatIds.length > 0 
                  ? selectedSeatIds.length * showtime.priceBase 
                  : 0}
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
  );
}
