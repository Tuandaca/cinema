'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { adminService } from '@/services/admin.service';
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Film,
  Building,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';

interface BookingItem {
  id: string;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  showtime: {
    id: string;
    startTime: string;
    movie: { id: string; title: string; posterUrl: string | null };
    room: { id: string; name: string };
  };
  seats: {
    id: string;
    price: number;
    seat: { id: string; row: string; number: number; type: string };
  }[];
  orderItems: {
    id: string;
    quantity: number;
    combo: { id: string; name: string; price: number };
  }[];
}

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Booking Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const fetchBookings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminService.getBookings(token, {
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      setBookings(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setActionMessage({ type: 'error', text: 'Không thể tải danh sách đơn vé.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token, page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      await adminService.updateBookingStatus(token, id, newStatus);
      setActionMessage({ type: 'success', text: `Cập nhật trạng thái đơn thành ${newStatus} thành công!` });
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as any });
      }
      fetchBookings();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái đơn.',
      });
    }
  };

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Quản Lý Đơn Hàng & Vé Điện Tử
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {total} đơn đặt vé được lưu trữ trong hệ thống.
          </p>
        </div>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#14141D] border border-zinc-800/80 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Email, Tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#E5A93C]"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#E5A93C]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PENDING">Chờ thanh toán (PENDING)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Mã đơn</th>
                <th className="px-4 py-3.5">Khách hàng</th>
                <th className="px-4 py-3.5">Phim & Suất chiếu</th>
                <th className="px-4 py-3.5">Ghế đã đặt</th>
                <th className="px-4 py-3.5">Tổng tiền</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <div className="w-6 h-6 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách đơn vé...
                  </td>
                </tr>
              ) : bookings.length > 0 ? (
                bookings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  const isPending = b.status === 'PENDING';

                  return (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-300">
                        #{b.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">
                          {b.user?.name || 'Khách vãng lai'}
                        </div>
                        <div className="text-[11px] text-zinc-500">{b.user?.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white truncate max-w-[200px]">
                          {b.showtime?.movie?.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>{b.showtime?.room?.name}</span>
                          <span>•</span>
                          <span>
                            {new Date(b.showtime?.startTime).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-zinc-300">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {b.seats?.map((s) => (
                            <span
                              key={s.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                s.seat.type === 'VIP'
                                  ? 'bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/30'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {s.seat.row}{s.seat.number}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#E5A93C]">
                        {formatVND(b.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{b.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    Không tìm thấy đơn vé nào phù hợp.
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
              Trang {page} / {totalPages} (Tổng {total} đơn)
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

      {/* DETAIL MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#14141D] border border-zinc-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#E5A93C]" />
              <span>Chi Tiết Đơn Đặt Vé</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-5 font-mono">
              Mã giao dịch: #{selectedBooking.id}
            </p>

            <div className="space-y-4 text-xs">
              {/* Customer Info */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Thông Tin Người Đặt
                </p>
                <p className="font-semibold text-white">{selectedBooking.user?.name || 'Khách vãng lai'}</p>
                <p className="text-zinc-400">{selectedBooking.user?.email}</p>
              </div>

              {/* Movie & Showtime */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Suất Chiếu
                </p>
                <p className="font-bold text-base text-[#E5A93C]">{selectedBooking.showtime?.movie?.title}</p>
                <p className="text-zinc-300 mt-0.5">
                  {selectedBooking.showtime?.room?.name} • {new Date(selectedBooking.showtime?.startTime).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Seats & Combos breakdown */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Chi Tiết Ghế & Dịch Vụ
                </p>
                <div className="space-y-1">
                  {selectedBooking.seats?.map((s) => (
                    <div key={s.id} className="flex justify-between text-zinc-300">
                      <span>Ghế {s.seat.row}{s.seat.number} ({s.seat.type})</span>
                      <span className="font-medium text-white">{formatVND(s.price)}</span>
                    </div>
                  ))}
                  {selectedBooking.orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between text-zinc-300">
                      <span>{item.combo.name} x{item.quantity}</span>
                      <span className="font-medium text-white">{formatVND(item.combo.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between font-bold text-sm">
                  <span className="text-white">Tổng cộng:</span>
                  <span className="text-[#E5A93C]">{formatVND(selectedBooking.totalAmount)}</span>
                </div>
              </div>

              {/* Status control */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-zinc-400">Thay đổi trạng thái:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'PAID')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 font-semibold text-xs"
                  >
                    Đánh dấu PAID
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-semibold text-xs"
                  >
                    Hủy Đơn (CANCEL)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
