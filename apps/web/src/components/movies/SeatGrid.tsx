'use client';

import React, { useState, useEffect } from 'react';
import { Seat } from '@/services/booking.service';
import { useSocket } from '@/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

interface SeatGridProps {
  showtimeId: string;
  initialSeats: Seat[];
  onSelectionChange: (selectedSeatIds: string[]) => void;
  currentUserId?: string;
}

export default function SeatGrid({ showtimeId, initialSeats, onSelectionChange, currentUserId: propUserId }: SeatGridProps) {
  const { user } = useAuth();
  const currentUserId = propUserId || user?.id || '';
  const { socket, isConnected } = useSocket();
  const { showError, showWarning } = useToast();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [othersSelecting, setOthersSelecting] = useState<Set<string>>(new Set());

  // Update local seats when initialSeats change (e.g. from refetch)
  useEffect(() => {
    setSeats(initialSeats);

    // Synchronize othersSelecting and own selection from initialSeats
    const others = new Set<string>();
    const mine = new Set<string>();

    initialSeats.forEach(seat => {
      if (seat.status === 'SELECTING') {
        if (seat.lockedBy && currentUserId && seat.lockedBy === currentUserId) {
          mine.add(seat.id);
        } else {
          others.add(seat.id);
        }
      }
    });

    setOthersSelecting(prev => {
      const merged = new Set(prev);
      others.forEach(id => merged.add(id));
      return merged;
    });

    if (mine.size > 0) {
      setSelectedSeatIds(prev => {
        const merged = new Set(prev);
        mine.forEach(id => merged.add(id));
        return merged;
      });
    }
  }, [initialSeats, currentUserId]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    // Helper to join the showtime room — called on mount and on reconnect
    const joinRoom = () => {
      if (socket.connected) {
        socket.emit('join_showtime', { showtimeId });
      }
    };

    // If already connected when this effect runs, join immediately
    if (isConnected) {
      joinRoom();
    }

    const handleConnect = () => {
      // Rejoin room on reconnect and refetch seats to catch any missed 'seats_locked' events
      joinRoom();
      queryClient.invalidateQueries({ queryKey: ['seats', showtimeId] });
    };

    const handleSeatSelecting = (data: { seatId: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setOthersSelecting(prev => new Set(prev).add(data.seatId));
      }
    };

    const handleSeatDeselected = (data: { seatId: string; userId: string }) => {
      setSeats(prev => prev.map(seat => 
        seat.id === data.seatId && seat.status !== 'BOOKED' && (!seat.lockedBy || seat.lockedBy === data.userId)
          ? { ...seat, status: 'AVAILABLE', lockedBy: undefined }
          : seat
      ));
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
      // If we had them selected, remove them (someone else hard-locked them faster)
      if (data.userId !== currentUserId) {
        setSelectedSeatIds(prev => {
          const next = new Set(prev);
          data.seatIds.forEach(id => next.delete(id));
          return next;
        });
      }
    };

    const handleSelectSuccess = (data: { seatId: string; userId: string }) => {
      if (data.userId === currentUserId) {
        setSelectedSeatIds(prev => {
          const next = new Set(prev);
          next.add(data.seatId);
          return next;
        });
        // Start timer if first seat
        const existingStart = localStorage.getItem(`booking_start_${showtimeId}`);
        if (!existingStart) {
          localStorage.setItem(`booking_start_${showtimeId}`, Date.now().toString());
        }
      }
    };

    const handleSelectFailed = (data: { seatId: string; userId: string }) => {
      if (data.userId === currentUserId) {
        showError('Ghế này vừa bị người khác chọn mất!');
        setSelectedSeatIds(prev => {
          const next = new Set(prev);
          next.delete(data.seatId);
          if (next.size === 0) {
            localStorage.removeItem(`booking_start_${showtimeId}`);
          }
          return next;
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('seat_selecting', handleSeatSelecting);
    socket.on('seat_deselected', handleSeatDeselected);
    socket.on('seats_locked', handleSeatsLocked);
    socket.on('select_seat_success', handleSelectSuccess);
    socket.on('select_seat_failed', handleSelectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('seat_selecting', handleSeatSelecting);
      socket.off('seat_deselected', handleSeatDeselected);
      socket.off('seats_locked', handleSeatsLocked);
      socket.off('select_seat_success', handleSelectSuccess);
      socket.off('select_seat_failed', handleSelectFailed);
      // Leave showtime room on cleanup
      if (socket.connected) {
        socket.emit('leave_showtime', { showtimeId });
      }
    };
  }, [socket, showtimeId, currentUserId, queryClient]);

  // Update parent when selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selectedSeatIds));
  }, [selectedSeatIds, onSelectionChange]);

  const handleSeatClick = (seat: Seat) => {
    const isSelected = selectedSeatIds.has(seat.id);
    const isOthersSelecting = (othersSelecting.has(seat.id) || (seat.status === 'SELECTING' && seat.lockedBy !== currentUserId)) && !isSelected;
    const isLocked = seat.status === 'LOCKED' && seat.lockedBy !== currentUserId;
    const isBooked = seat.status === 'BOOKED';

    if (isBooked || isLocked || isOthersSelecting) {
      return; // Can't select booked, locked by someone else, or seats currently being selected by someone else
    }

    const newSet = new Set(selectedSeatIds);
    if (newSet.has(seat.id)) {
      newSet.delete(seat.id);
      socket?.emit('deselect_seat', { showtimeId, seatId: seat.id, userId: currentUserId });
      setSelectedSeatIds(newSet);
      if (newSet.size === 0) {
        localStorage.removeItem(`booking_start_${showtimeId}`);
      }
    } else {
      if (newSet.size >= 8) {
        showWarning('Bạn chỉ có thể chọn tối đa 8 ghế.');
        return;
      }
      // Optimistically add it
      newSet.add(seat.id);
      socket?.emit('select_seat', { showtimeId, seatId: seat.id, userId: currentUserId });
      setSelectedSeatIds(newSet);
      
      if (newSet.size === 1) { // Was 0 before
         const existingStart = localStorage.getItem(`booking_start_${showtimeId}`);
         if (!existingStart) {
           localStorage.setItem(`booking_start_${showtimeId}`, Date.now().toString());
         }
      }
    }
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
                const isOthersSelecting = (othersSelecting.has(seat.id) || (seat.status === 'SELECTING' && seat.lockedBy !== currentUserId)) && !isSelected;
                const isLocked = seat.status === 'LOCKED' && seat.lockedBy !== currentUserId;
                const isBooked = seat.status === 'BOOKED';
                const isSweetbox = seat.type === 'SWEETBOX';
                const isVip = seat.type === 'VIP';

                // Sweetbox double-seat width (w-24), standard width (w-10)
                const widthClass = isSweetbox ? 'w-24' : 'w-10';

                // Visual spacing & aisles: Sweetbox couples walkway (after seat 4) and couple gaps (after even seats); Standard hall center aisle (after seat 5)
                let aisleClass = '';
                if (isSweetbox) {
                  if (seat.number === 4) {
                    aisleClass = ' mr-8'; // Central walkway aisle
                  } else if (seat.number % 2 === 0 && seat.number < rows[row].length) {
                    aisleClass = ' mr-4'; // Couple spacing
                  }
                } else {
                  if (seat.number === 5 && rows[row].length >= 8) {
                    aisleClass = ' mr-6'; // Center aisle
                  }
                }

                // Subdued type indicator border on seat bottom
                let typeIndicator = '';
                if (isVip) {
                  typeIndicator = ' border-b-2 border-b-pink-500';
                } else if (isSweetbox) {
                  typeIndicator = ' border-b-2 border-b-purple-500';
                }

                let seatClasses = `${widthClass} h-10 rounded-t-lg rounded-b flex items-center justify-center text-xs font-bold transition-all duration-300${aisleClass} `;

                if (isBooked) {
                  seatClasses += `bg-zinc-800 text-zinc-600 cursor-not-allowed${typeIndicator}`;
                } else if (isLocked) {
                  seatClasses += `bg-red-500/20 text-red-500 border border-red-500/50 cursor-not-allowed${typeIndicator}`;
                } else if (isSelected) {
                  seatClasses += `bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-cyan-400 cursor-pointer${typeIndicator}`;
                } else if (isOthersSelecting) {
                  seatClasses += `bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse cursor-not-allowed${typeIndicator}`;
                } else {
                  // Available
                  seatClasses += `bg-zinc-700 text-zinc-300 hover:bg-cyan-500/20 hover:border-cyan-500 hover:text-cyan-400 border border-transparent cursor-pointer${typeIndicator}`;
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isBooked || isLocked || isOthersSelecting}
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
          <span className="text-zinc-400">Ghế trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] border border-cyan-400"></div>
          <span className="text-zinc-400">Ghế bạn chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse"></div>
          <span className="text-amber-300 font-medium">Đang chọn / Giữ chỗ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-red-500/20 border border-red-500/50"></div>
          <span className="text-zinc-400">Đang giữ / Tạm khóa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-zinc-800"></div>
          <span className="text-zinc-400">Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-zinc-700 border-b-2 border-b-pink-500"></div>
          <span className="text-zinc-400">Ghế VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-6 rounded-t bg-zinc-700 border-b-2 border-b-purple-500"></div>
          <span className="text-zinc-400">Sweetbox (Đôi)</span>
        </div>
      </div>
    </div>
  );
}
