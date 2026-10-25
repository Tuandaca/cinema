'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { adminService } from '@/services/admin.service';
import {
  CalendarClock,
  Plus,
  Trash2,
  Clock,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  Ticket,
} from 'lucide-react';

interface ShowtimeItem {
  id: string;
  startTime: string;
  endTime: string;
  priceBase: number;
  movie: { id: string; title: string; posterUrl: string | null; runtime: number | null };
  room: { id: string; name: string; capacity: number };
  _count?: { bookings: number };
}

export default function AdminShowtimesPage() {
  const { token } = useAuth();
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMovieId, setFilterMovieId] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<string>('');

  // Dropdown lists
  const [moviesList, setMoviesList] = useState<{ id: string; title: string; runtime: number | null }[]>([]);
  const [roomsList, setRoomsList] = useState<{ id: string; name: string; capacity: number }[]>([]);

  // Action / Feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    movieId: '',
    roomId: '',
    startTime: '',
    priceBase: 90000,
  });

  const fetchFiltersData = async () => {
    if (!token) return;
    try {
      const [moviesRes, roomsRes] = await Promise.all([
        adminService.getMovies(token, { limit: 100 }),
        adminService.getRooms(token),
      ]);
      setMoviesList(moviesRes.items);
      setRoomsList(roomsRes);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchShowtimes = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminService.getShowtimes(token, {
        date: filterDate || undefined,
        movieId: filterMovieId || undefined,
        roomId: filterRoomId || undefined,
        page,
        limit: 15,
      });
      setShowtimes(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load showtimes:', err);
      setActionMessage({ type: 'error', text: 'Không thể tải danh sách suất chiếu.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, [token]);

  useEffect(() => {
    fetchShowtimes();
  }, [token, page, filterDate, filterMovieId, filterRoomId]);

  const handleOpenCreateModal = () => {
    const defaultMovie = moviesList[0]?.id || '';
    const defaultRoom = roomsList[0]?.id || '';
    
    // Default start time: tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);

    setFormData({
      movieId: defaultMovie,
      roomId: defaultRoom,
      startTime: localISOTime,
      priceBase: 90000,
    });
    setIsModalOpen(true);
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await adminService.createShowtime(token, {
        movieId: formData.movieId,
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        priceBase: Number(formData.priceBase),
      });

      setActionMessage({ type: 'success', text: 'Tạo suất chiếu mới thành công!' });
      setIsModalOpen(false);
      fetchShowtimes();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể tạo suất chiếu (có thể trùng lịch).',
      });
    }
  };

  const handleDeleteShowtime = async (st: ShowtimeItem) => {
    if (!token) return;
    const confirm = window.confirm(
      `Xác nhận xóa suất chiếu "${st.movie.title}" lúc ${new Date(st.startTime).toLocaleString('vi-VN')}?`,
    );
    if (!confirm) return;

    try {
      await adminService.deleteShowtime(token, st.id);
      setActionMessage({ type: 'success', text: 'Đã xóa suất chiếu thành công!' });
      fetchShowtimes();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa suất chiếu đã có vé.',
      });
    }
  };

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  // Selected movie in modal for previewing end time
  const selectedModalMovie = moviesList.find((m) => m.id === formData.movieId);
  const runtimePreview = selectedModalMovie?.runtime || 120;
  const calculatedEndTime = formData.startTime
    ? new Date(new Date(formData.startTime).getTime() + (runtimePreview + 15) * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Lập Lịch & Quản Lý Suất Chiếu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {total} suất chiếu được cấu hình trong hệ thống rạp.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#d4972d] text-black text-xs font-bold transition shadow-lg shadow-[#E5A93C]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Suất Chiếu</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#14141D] border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Chọn Ngày Chiếu
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#E5A93C]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Lọc Theo Phim
          </label>
          <select
            value={filterMovieId}
            onChange={(e) => {
              setFilterMovieId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#E5A93C]"
          >
            <option value="">Tất cả các phim</option>
            {moviesList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Lọc Theo Phòng Rạp
          </label>
          <select
            value={filterRoomId}
            onChange={(e) => {
              setFilterRoomId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#E5A93C]"
          >
            <option value="">Tất cả các phòng</option>
            {roomsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity} ghế)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Showtimes Table */}
      <div className="rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Thời gian</th>
                <th className="px-4 py-3.5">Phim</th>
                <th className="px-4 py-3.5">Phòng Chiếu</th>
                <th className="px-4 py-3.5">Giá Cơ Sở</th>
                <th className="px-4 py-3.5">Đơn Đặt</th>
                <th className="px-4 py-3.5">Tình Trạng</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <div className="w-6 h-6 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách suất chiếu...
                  </td>
                </tr>
              ) : showtimes.length > 0 ? (
                showtimes.map((st) => {
                  const startTime = new Date(st.startTime);
                  const endTime = new Date(st.endTime);
                  const isFuture = startTime > new Date();

                  return (
                    <tr key={st.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {startTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {st.movie.posterUrl ? (
                            <img
                              src={st.movie.posterUrl}
                              alt={st.movie.title}
                              className="w-8 h-11 object-cover rounded border border-zinc-700/80"
                            />
                          ) : (
                            <div className="w-8 h-11 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <Ticket className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[200px]">
                              {st.movie.title}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {st.movie.runtime || 120} phút
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{st.room.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#E5A93C]">
                        {formatVND(st.priceBase)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-300">
                        {st._count?.bookings || 0} đơn
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isFuture
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {isFuture ? 'Sắp chiếu' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteShowtime(st)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Xóa suất chiếu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    Không tìm thấy suất chiếu nào theo bộ lọc đã chọn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Trang {page} / {totalPages} (Tổng {total} suất)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-medium"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SHOWTIME MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#14141D] border border-zinc-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#E5A93C]" />
              <span>Tạo Mới Suất Chiếu</span>
            </h2>

            <form onSubmit={handleCreateShowtime} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Chọn Phim *</label>
                <select
                  required
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.runtime || 120} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Phòng Chiếu *</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                >
                  {roomsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Sức chứa: {r.capacity} ghế)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Thời Gian Bắt Đầu *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
                {calculatedEndTime && (
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#E5A93C]" />
                    <span>
                      Dự kiến kết thúc: <strong className="text-white">{calculatedEndTime}</strong> (+ 15p dọn phòng)
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Giá Vé Cơ Sở (Ghế thường - VNĐ) *
                </label>
                <input
                  type="number"
                  step="5000"
                  required
                  value={formData.priceBase}
                  onChange={(e) => setFormData({ ...formData, priceBase: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Ghế VIP tự động +50% (1.5x) và Ghế Sweetbox +100% (2.0x).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E5A93C] hover:bg-[#d4972d] text-black font-bold shadow-lg shadow-[#E5A93C]/20"
                >
                  Lưu Suất Chiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
