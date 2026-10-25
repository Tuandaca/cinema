'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { adminService } from '@/services/admin.service';
import {
  Armchair,
  Building,
  Calendar,
  Sparkles,
  Heart,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface RoomItem {
  id: string;
  name: string;
  capacity: number;
  totalSeats: number;
  seatCounts: {
    normal: number;
    vip: number;
    sweetbox: number;
  };
  showtimesCount: number;
}

interface RoomSeatsData {
  room: { id: string; name: string; capacity: number };
  rows: {
    row: string;
    seats: { id: string; row: string; number: number; type: string }[];
  }[];
}

export default function AdminTheatersPage() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [roomSeats, setRoomSeats] = useState<RoomSeatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<{ row: string; number: number; type: string } | null>(null);

  const fetchRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminService.getRooms(token);
      setRooms(res);
      if (res.length > 0 && !selectedRoomId) {
        setSelectedRoomId(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomSeats = async (roomId: string) => {
    if (!token || !roomId) return;
    try {
      setLoadingSeats(true);
      const res = await adminService.getRoomSeats(token, roomId);
      setRoomSeats(res);
      setSelectedSeatInfo(null);
    } catch (err) {
      console.error('Failed to load seats for room:', err);
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [token]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomSeats(selectedRoomId);
    }
  }, [token, selectedRoomId]);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Cấu Hình Phòng Chiếu & Sơ Đồ Ghế
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Trực quan hóa layout phòng rạp, phân bổ ghế Thường, VIP và Sweetbox.
        </p>
      </div>

      {/* Rooms Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-10 text-zinc-500">
            <div className="w-6 h-6 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Đang tải danh sách phòng chiếu...
          </div>
        ) : (
          rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#181824] to-[#14141E] border-[#E5A93C] shadow-lg shadow-[#E5A93C]/10'
                    : 'bg-[#121218] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#E5A93C] text-black font-bold'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{room.name}</h3>
                      <p className="text-xs text-zinc-400">
                        Sức chứa thiết kế: {room.capacity} ghế
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 flex items-center gap-1">
                      <span>Đang xem</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Seat Breakdown Badges */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-center">
                  <div className="p-2 rounded-xl bg-zinc-900/60">
                    <div className="text-xs font-semibold text-zinc-300">Thường</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {room.seatCounts.normal}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-xs font-semibold text-amber-300">VIP (1.5x)</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {room.seatCounts.vip}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="text-xs font-semibold text-rose-300">Sweetbox (2x)</div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">
                      {room.seatCounts.sweetbox}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Seat Grid Visualizer Section */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-[#E5A93C]" />
              <span>Sơ Đồ Ghế: {activeRoom?.name}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bấm vào bất kỳ ghế nào để xem chi tiết thông số và phân loại.
            </p>
          </div>

          {/* Seat Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-zinc-700 border border-zinc-600"></div>
              <span className="text-zinc-300">Ghế Thường (1.0x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-[#E5A93C] text-black font-bold text-[8px] flex items-center justify-center">
                VIP
              </div>
              <span className="text-zinc-300">Ghế VIP (1.5x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-4 rounded bg-rose-500 text-white font-bold text-[8px] flex items-center justify-center">
                ❤️
              </div>
              <span className="text-zinc-300">Sweetbox Đôi (2.0x)</span>
            </div>
          </div>
        </div>

        {/* Selected Seat Inspector Banner */}
        {selectedSeatInfo && (
          <div className="p-3 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E5A93C]" />
              <span>
                Ghế đang chọn: <strong className="text-white font-mono">{selectedSeatInfo.row}{selectedSeatInfo.number}</strong> — Phân loại: <strong className="text-[#E5A93C] uppercase">{selectedSeatInfo.type}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedSeatInfo(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Cinema Screen Curve */}
        <div className="w-full max-w-xl mx-auto pt-2 pb-6 text-center">
          <div className="h-2.5 w-full bg-gradient-to-b from-[#E5A93C] to-transparent rounded-t-[100px] opacity-70 shadow-lg shadow-[#E5A93C]/20 mb-2"></div>
          <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-500">
            MÀN HÌNH CHIẾU
          </span>
        </div>

        {/* The Grid */}
        {loadingSeats ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="w-6 h-6 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Đang tải sơ đồ ghế...
          </div>
        ) : roomSeats ? (
          <div className="flex flex-col items-center gap-3.5 py-4 overflow-x-auto">
            {roomSeats.rows.map((rowObj) => (
              <div key={rowObj.row} className="flex items-center gap-3">
                {/* Row Label */}
                <span className="w-6 text-center font-bold text-xs text-zinc-500">
                  {rowObj.row}
                </span>

                {/* Seats in Row */}
                <div className="flex items-center gap-2">
                  {rowObj.seats.map((seat) => {
                    const isVip = seat.type === 'VIP';
                    const isSweetbox = seat.type === 'SWEETBOX';

                    return (
                      <button
                        key={seat.id}
                        onClick={() =>
                          setSelectedSeatInfo({
                            row: seat.row,
                            number: seat.number,
                            type: seat.type,
                          })
                        }
                        title={`Ghế ${seat.row}${seat.number} (${seat.type})`}
                        className={`h-9 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center shadow ${
                          isSweetbox
                            ? 'w-16 bg-rose-600/80 hover:bg-rose-500 text-white border border-rose-400/40'
                            : isVip
                            ? 'w-9 bg-[#E5A93C] hover:bg-[#F5C76D] text-black font-extrabold shadow-md shadow-[#E5A93C]/20'
                            : 'w-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80'
                        }`}
                      >
                        {seat.row}
                        {seat.number}
                      </button>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <span className="w-6 text-center font-bold text-xs text-zinc-500">
                  {rowObj.row}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Chưa có sơ đồ ghế cho phòng này.
          </div>
        )}
      </div>
    </div>
  );
}
