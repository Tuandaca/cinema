'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { ArrowLeft, Popcorn, Ticket, CreditCard } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const showtimeId = searchParams.get('showtimeId');
  const seatsParam = searchParams.get('seats');
  const seatIds = seatsParam ? seatsParam.split(',') : [];

  // 5 minutes countdown timer
  const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes

  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Your seat reservation has expired. Please select seats again.');
      router.push(`/movies/${showtimeId}/booking`);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router, showtimeId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const { data: showtime, isLoading: showtimeLoading } = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: () => bookingService.getShowtimeDetails(showtimeId!),
    enabled: !!showtimeId,
  });

  const { data: allSeats, isLoading: seatsLoading } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: () => bookingService.getSeats(showtimeId!),
    enabled: !!showtimeId,
  });

  if (!showtimeId || seatIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Invalid Order Session</h1>
        <button onClick={() => router.push('/')} className="text-cyan-400 hover:underline">Return Home</button>
      </div>
    );
  }

  if (showtimeLoading || seatsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading Order Details...</div>;
  }

  if (!showtime || !allSeats) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-red-500">Error loading order</div>;
  }

  const selectedSeats = allSeats.filter(s => seatIds.includes(s.id));
  const totalTicketsPrice = selectedSeats.length * showtime.priceBase;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Back to Booking
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
            <CreditCard className="text-cyan-400" size={32} /> Secure Checkout
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-mono text-lg flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span>Time remaining:</span>
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: F&B & Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Combo Section */}
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
                <Popcorn className="text-coicine-gold" /> Add Food & Beverage (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Placeholder Combos */}
                {[1, 2].map((i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-white/5 flex gap-4 items-center opacity-60">
                    <div className="w-16 h-16 bg-zinc-700 rounded-lg flex items-center justify-center text-2xl">
                      🍿
                    </div>
                    <div>
                      <h3 className="font-bold">Combo {i}</h3>
                      <p className="text-sm text-white/50">1 Popcorn, 1 Drink</p>
                      <p className="text-cyan-400 font-bold mt-1">+$5.00</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/40 mt-4 italic">* F&B Selection will be fully integrated in Phase 5.</p>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div>
            <div className="bg-zinc-900/80 rounded-2xl border border-white/10 p-6 sticky top-24 shadow-2xl">
              <h2 className="text-xl font-bold font-outfit border-b border-white/10 pb-4 mb-4">Order Summary</h2>
              
              <div className="flex gap-4 mb-6">
                 {showtime.movie.posterUrl ? (
                  <img src={showtime.movie.posterUrl} alt={showtime.movie.title} className="w-20 h-28 object-cover rounded shadow-lg" />
                ) : (
                  <div className="w-20 h-28 bg-zinc-800 rounded flex items-center justify-center text-xs">No Poster</div>
                )}
                <div>
                  <h3 className="font-bold font-outfit text-lg">{showtime.movie.title}</h3>
                  <p className="text-sm text-white/60">{showtime.room.name}</p>
                  <p className="text-sm text-white/60">{new Date(showtime.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm border-b border-white/10 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 text-white/80">
                    <Ticket size={18} className="text-cyan-400 shrink-0"/>
                    <div>
                      <p>Tickets ({selectedSeats.length}x)</p>
                      <p className="text-xs text-white/40">{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</p>
                    </div>
                  </div>
                  <span className="font-bold">${totalTicketsPrice}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg text-white/80">Total</span>
                <span className="text-3xl font-bold text-cyan-400 font-outfit">${totalTicketsPrice}</span>
              </div>

              <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
