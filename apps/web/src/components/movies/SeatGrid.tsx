'use client';

import React, { useState, useEffect } from 'react';
import { Seat } from '@/services/booking.service';
import { useSocket } from '@/providers/SocketProvider';

interface SeatGridProps {
  showtimeId: string;
  initialSeats: Seat[];
  onSelectionChange: (selectedSeatIds: string[]) => void;
  currentUserId?: string; // Replace with actual auth user
}

export default function SeatGrid({ showtimeId, initialSeats, onSelectionChange, currentUserId = 'anonymous' }: SeatGridProps) {
  const { socket, isConnected } = useSocket();
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [othersSelecting, setOthersSelecting] = useState<Set<string>>(new Set());

  // Listen to socket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join_showtime', { showtimeId });

    const handleSeatSelecting = (data: { seatId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setOthersSelecting(prev => new Set(prev).add(data.seatId));
      }
    };

    const handleSeatDeselected = (data: { seatId: string; userId: string }) => {
      setOthersSelecting(prev => {
        const next = new Set(prev);
        next.delete(data.seatId);
        return next;
      });
    };

    const handleSeatsLocked = (data: { seatIds: string[]; userId: string }) => {
      setSeats(prev => prev.map(seat => 
        data.seatIds.includes(seat.id) ? { ...seat, status: 'LOCKED', lockedBy: data.userId } : seat
      ));
      // Remove from othersSelecting just in case
      setOthersSelecting(prev => {
        const next = new Set(prev);
        data.seatIds.forEach(id => next.delete(id));
        return next;
      });
      // If we had them selected, remove them (someone else locked them faster)
      if (data.userId !== currentUserId) {
        setSelectedSeatIds(prev => {
          const next = new Set(prev);
          data.seatIds.forEach(id => next.delete(id));
          return next;
        });
      }
    };

    socket.on('seat_selecting', handleSeatSelecting);
    socket.on('seat_deselected', handleSeatDeselected);
    socket.on('seats_locked', handleSeatsLocked);

    return () => {
      socket.emit('leave_showtime', { showtimeId });
      socket.off('seat_selecting', handleSeatSelecting);
      socket.off('seat_deselected', handleSeatDeselected);
      socket.off('seats_locked', handleSeatsLocked);
    };
  }, [socket, isConnected, showtimeId, currentUserId]);

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selectedSeatIds));
  }, [selectedSeatIds, onSelectionChange]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED' || (seat.status === 'LOCKED' && seat.lockedBy !== currentUserId)) {
      return; // Can't select booked or someone else's locked seat
    }

    const newSet = new Set(selectedSeatIds);
    if (newSet.has(seat.id)) {
      newSet.delete(seat.id);
      socket?.emit('deselect_seat', { showtimeId, seatId: seat.id, userId: currentUserId });
    } else {
      if (newSet.size >= 8) {
        alert('You can only select up to 8 seats.');
        return;
      }
      newSet.add(seat.id);
      socket?.emit('select_seat', { showtimeId, seatId: seat.id, userId: currentUserId });
    }
    setSelectedSeatIds(newSet);
  };

  // Group seats by row for rendering
  const rows: { [key: string]: Seat[] } = {};
  seats.forEach(seat => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });
  const rowNames = Object.keys(rows).sort();

  return (
    <div className="w-full flex flex-col items-center gap-6 overflow-x-auto p-4">
      {/* Screen Curved Line */}
      <div className="w-[80%] max-w-2xl h-12 border-t-4 border-cyan-500 rounded-t-[50%] opacity-50 shadow-[0_-10px_20px_rgba(6,182,212,0.3)] flex justify-center items-start pt-2">
        <span className="text-sm text-cyan-500 tracking-widest uppercase font-semibold">Screen</span>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col gap-4">
        {rowNames.map(row => (
          <div key={row} className="flex gap-4 items-center justify-center">
            <span className="w-6 text-center font-outfit text-white/50 font-semibold">{row}</span>
            <div className="flex gap-2">
              {rows[row].sort((a, b) => a.number - b.number).map(seat => {
                const isSelected = selectedSeatIds.has(seat.id);
                const isOthersSelecting = othersSelecting.has(seat.id) && !isSelected;
                const isLocked = seat.status === 'LOCKED' && seat.lockedBy !== currentUserId;
                const isBooked = seat.status === 'BOOKED';

                let seatClasses = "w-10 h-10 rounded-t-lg rounded-b flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer ";

                if (isBooked) {
                  seatClasses += "bg-zinc-800 text-zinc-600 cursor-not-allowed";
                } else if (isLocked) {
                  seatClasses += "bg-red-500/20 text-red-500 border border-red-500/50 cursor-not-allowed";
                } else if (isSelected) {
                  seatClasses += "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-cyan-400";
                } else if (isOthersSelecting) {
                  seatClasses += "bg-zinc-700 text-white animate-pulse border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
                } else {
                  // Available
                  seatClasses += "bg-zinc-700 text-zinc-300 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 border border-transparent";
                  if (seat.type === 'VIP') {
                    seatClasses += " border-b-2 border-b-pink-500";
                  } else if (seat.type === 'SWEETBOX') {
                    seatClasses += " w-22 border-b-2 border-b-purple-500";
                  }
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isBooked || isLocked}
                    className={seatClasses}
                    title={`${row}${seat.number} - ${seat.type}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
            <span className="w-6"></span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-8 justify-center items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-zinc-700"></div>
          <span className="text-zinc-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
          <span className="text-zinc-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-zinc-700 animate-pulse border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          <span className="text-zinc-400">Others Selecting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-red-500/20 border border-red-500/50"></div>
          <span className="text-zinc-400">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-zinc-800"></div>
          <span className="text-zinc-400">Booked</span>
        </div>
      </div>
    </div>
  );
}
