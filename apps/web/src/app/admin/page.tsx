'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { adminService } from '@/services/admin.service';
import {
  DollarSign,
  Ticket,
  Film,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  totalRevenue: number;
  totalTickets: number;
  activeMovies: number;
  comingSoonMovies: number;
  totalRooms: number;
  totalSeats: number;
  totalBookings: number;
  pendingBookings: number;
  occupancyRate: number;
  past7Days: { date: string; label: string; revenue: number; tickets: number }[];
  topMovies: { title: string; posterUrl: string | null; revenue: number; tickets: number }[];
  recentBookings: any[];
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAnalytics(token);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-zinc-800 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-900 border border-zinc-800/80 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-72 bg-zinc-900 border border-zinc-800/80 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Lỗi tải dữ liệu</p>
        <p className="text-sm text-zinc-400 mb-4">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition"
        >
          Thử Lại
        </button>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(
    1,
    ...(data?.past7Days.map((d) => d.revenue) || [1]),
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Tổng Quan Hoạt Động
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Theo dõi doanh thu, số lượng vé và công suất phòng vé CoiCine theo thời gian thực.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-200 hover:text-white text-xs font-semibold transition shadow-sm w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E5A93C]' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181822] to-[#12121A] border border-zinc-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-10 h-10 rounded-xl bg-[#E5A93C]/10 border border-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatVND(data?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">Đã thanh toán (PAID)</span>
            </p>
          </div>
        </div>

        {/* Số vé bán */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181822] to-[#12121A] border border-zinc-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Số Vé Đã Bán</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.totalTickets || 0} <span className="text-sm font-normal text-zinc-400">vé</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Tổng số chỗ ngồi phát sinh đơn
            </p>
          </div>
        </div>

        {/* Phim đang chiếu */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181822] to-[#12121A] border border-zinc-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phim Đang Chiếu</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.activeMovies || 0}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              + {data?.comingSoonMovies || 0} phim sắp chiếu
            </p>
          </div>
        </div>

        {/* Tỷ lệ lấp đầy */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#181822] to-[#12121A] border border-zinc-800/80 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tỷ Lệ Lấp Đầy</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.occupancyRate || 0}%
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {data?.totalRooms} phòng rạp ({data?.totalSeats} ghế)
            </p>
          </div>
        </div>
      </div>

      {/* 2. Charts & Top Movies Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu 7 ngày gần nhất */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Biểu Đồ Doanh Thu 7 Ngày Qua</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Doanh số thực tế ghi nhận từ các đơn PAID</p>
            </div>
          </div>

          <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2">
            {data?.past7Days.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round((item.revenue / maxDailyRevenue) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[11px] text-[#E5A93C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatVND(item.revenue)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#E5A93C]/40 to-[#E5A93C] group-hover:from-[#E5A93C] group-hover:to-[#F5C76D] transition-all relative cursor-pointer"
                  >
                    <div className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-black opacity-80">
                      {item.tickets > 0 ? `${item.tickets}v` : ''}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Phim Doanh Thu Cao Nhất */}
        <div className="p-6 rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Top Phim Doanh Thu</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng theo tổng tiền bán vé</p>
          </div>

          <div className="space-y-3.5 mt-5">
            {data?.topMovies && data.topMovies.length > 0 ? (
              data.topMovies.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-800/40 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-xs font-extrabold text-[#E5A93C]">
                      #{idx + 1}
                    </span>
                    {m.posterUrl ? (
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="w-9 h-12 object-cover rounded-md border border-zinc-700/60"
                      />
                    ) : (
                      <div className="w-9 h-12 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {m.title}
                      </p>
                      <p className="text-[11px] text-zinc-500">{m.tickets} vé đã bán</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#E5A93C]">
                      {formatVND(m.revenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-zinc-500">
                Chưa có dữ liệu doanh thu phim
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Recent Bookings Table */}
      <div className="p-6 rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Đơn Đặt Vé Gần Nhất</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Top 10 giao dịch đặt vé mới nhất trong hệ thống</p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-[#E5A93C] hover:text-[#d4972d] transition"
          >
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Phim & Phòng</th>
                <th className="px-4 py-3">Ghế đã chọn</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data?.recentBookings && data.recentBookings.length > 0 ? (
                data.recentBookings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  const isPending = b.status === 'PENDING';
                  return (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-4 py-3 font-mono font-medium text-zinc-400">
                        #{b.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{b.user?.name || 'Khách vãng lai'}</div>
                        <div className="text-[11px] text-zinc-500">{b.user?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {b.showtime?.movie?.title}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {b.showtime?.room?.name} • {new Date(b.showtime?.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-300">
                        {b.seats?.map((s: any) => `${s.seat.row}${s.seat.number}`).join(', ') || 'Chưa chọn'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#E5A93C]">
                        {formatVND(b.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500">
                    Chưa có đơn vé nào trong hệ thống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
