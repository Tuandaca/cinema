'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import SeatGrid from '@/components/movies/SeatGrid';

// Note: In Next.js 15 App router, params is a promise but since this is a client component
// we can use standard React.use if needed, but often params are directly accessible or we use useParams
import { useParams } from 'next/navigation';

export default function BookingPage() {
  const params = useParams();
  const showtimeId = params.id as string; // The URL might be /movies/[id]/booking or /showtimes/[id]/booking. Let's assume this is /movies/[id]/booking and ID is showtimeId for now, or just use it.
  
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isLocking, setIsLocking] = useState(false);

  const { data: seats, isLoading, error } = useQuery({
    queryKey: ['seats', showtimeId],
    queryFn: () => bookingService.getSeats(showtimeId),
    enabled: !!showtimeId,
  });

  const handleLockSeats = async () => {
    if (selectedSeatIds.length === 0) return;
    setIsLocking(true);
    try {
      // Dummy token for now
      const token = 'dummy-jwt-token';
      await bookingService.lockSeats(showtimeId, selectedSeatIds, token);
      alert('Seats locked successfully! You have 5 minutes to complete payment.');
      // Proceed to checkout/payment page...
    } catch (err: any) {
      alert(err.message || 'Failed to lock seats');
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading seats...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading seats</div>;
  if (!seats) return <div className="min-h-screen flex items-center justify-center">No seats found</div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-outfit font-bold mb-2">Select Your Seats</h1>
          <p className="text-white/60">Choose your perfect spot for the ultimate cinematic experience.</p>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-md mb-8">
          <SeatGrid 
            showtimeId={showtimeId} 
            initialSeats={seats} 
            onSelectionChange={setSelectedSeatIds} 
            currentUserId="user-123" // Replace with actual user ID from auth context
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
            <div>
              <p className="text-white/60 text-sm mb-1">Total Price</p>
              <p className="text-2xl font-bold text-cyan-400 font-outfit">
                ${selectedSeatIds.length > 0 
                  // Simple mock price, in reality fetch from seat/showtime
                  ? selectedSeatIds.length * 15 
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
