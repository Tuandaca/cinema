'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Clock, Film, AlertCircle, Wallet, Copy, Check, QrCode } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { bookingService, MyBooking } from '@/services/booking.service';
import CinematicPoster from '@/components/common/CinematicPoster';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(amount: number) {
  return (amount || 0).toLocaleString('vi-VN') + ' đ';
}

type TabKey = 'upcoming' | 'watched' | 'all';

function isPaid(booking: MyBooking): boolean {
  return booking.status === 'PAID' || (booking as any).paymentStatus === 'PAID';
}

function getBookingStatus(booking: MyBooking): 'UPCOMING' | 'WATCHED' | 'CANCELLED' | 'PENDING' {
  if (booking.status === 'CANCELLED') return 'CANCELLED';
  if (!isPaid(booking)) return 'PENDING';
  const now = new Date();
  const start = new Date(booking.showtime.startTime);
  return start > now ? 'UPCOMING' : 'WATCHED';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-28 bg-white/10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'UPCOMING' | 'WATCHED' | 'CANCELLED' | 'PENDING' }) {
  const map = {
    UPCOMING: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    WATCHED: 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };
  const label = {
    UPCOMING: 'Sắp tới',
    WATCHED: 'Đã xem',
    CANCELLED: 'Đã huỷ',
    PENDING: 'Chờ thanh toán',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking }: { booking: MyBooking }) {
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);
  const displayStatus = getBookingStatus(booking);
  const seats = booking.seats?.map((s) => `${s.seat.row}${s.seat.number}`).join(', ') || '—';
  const bookingCode = booking.id ? booking.id.slice(0, 8).toUpperCase() : '';
  const paid = isPaid(booking);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      showSuccess(`Đã sao chép mã vé #${bookingCode}!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Poster Thumbnail */}
        <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 shadow-lg">
          <CinematicPoster
            src={booking.showtime.movie.posterUrl}
            alt={booking.showtime.movie.title}
            title={booking.showtime.movie.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                  #{bookingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"
                  title="Sao chép mã đơn"
                >
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              </div>
              <h3 className="font-bold text-white text-lg truncate">{booking.showtime.movie.title}</h3>
            </div>
            <StatusBadge status={displayStatus} />
          </div>

          <div className="space-y-1 text-sm text-white/60">
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-[#E5A93C]" />
              <span>{formatDate(booking.showtime.startTime)} • {formatTime(booking.showtime.startTime)}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-[#E5A93C] text-xs">🏠</span>
              <span>CoiCine • Phòng {booking.showtime.room.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <Ticket size={14} className="text-cyan-400" />
              <span>Ghế: <strong className="font-mono text-white">{seats}</strong></span>
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="font-bold text-[#E5A93C] text-base">{formatMoney(booking.totalAmount)}</span>
            {paid ? (
              <Link
                href={`/checkout/success?bookingId=${booking.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all hover:scale-105 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                <QrCode size={14} />
                Xem vé điện tử / QR
              </Link>
            ) : (
              <Link
                href={`/checkout?bookingId=${booking.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-colors"
              >
                Thanh toán ngay
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-md">
      <div className="p-3 bg-[#E5A93C]/10 rounded-xl text-[#E5A93C]">{icon}</div>
      <div>
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: TabKey }) {
  const msgMap = {
    upcoming: 'Bạn không có vé sắp chiếu nào. Hãy đặt vé để trải nghiệm ngay!',
    watched: 'Chưa có lịch sử vé đã xem hoặc hết hạn.',
    all: 'Chưa có vé nào trong lịch sử đặt vé.',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-6 bg-zinc-800/50 rounded-full mb-5">
        <Ticket size={40} className="text-white/20" />
      </div>
      <h3 className="text-xl font-bold text-white/60 mb-2">Không tìm thấy vé</h3>
      <p className="text-white/40 mb-6 max-w-md">{msgMap[tab]}</p>
      <Link
        href="/movies"
        className="px-6 py-3 bg-[#E5A93C] text-black font-bold rounded-2xl hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(229,169,60,0.3)]"
      >
        Khám phá phim
      </Link>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function MyTicketsContent() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const { data: bookings = [], isLoading, isError } = useQuery<MyBooking[]>({
    queryKey: ['my-bookings'],
    queryFn: () => bookingService.getMyBookings(token!),
    enabled: !!token,
  });

  const now = new Date();

  // All paid bookings
  const paidBookings = useMemo(() => bookings.filter((b) => isPaid(b)), [bookings]);

  // Dashboard Stats:
  // "Phim đã xem": Only count past screenings (new Date(showtime.startTime) <= now)
  const watchedScreeningsCount = useMemo(
    () => paidBookings.filter((b) => new Date(b.showtime.startTime) <= now).length,
    [paidBookings, now]
  );

  // "Tổng chi tiêu": Sum of totalAmount formatted in VNĐ
  const totalSpent = useMemo(
    () => paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    [paidBookings]
  );

  // "Vé sắp tới": Count of upcoming tickets
  const upcomingCount = useMemo(
    () => paidBookings.filter((b) => new Date(b.showtime.startTime) > now).length,
    [paidBookings, now]
  );

  // Categorized bookings for tabs:
  const upcomingBookings = useMemo(
    () => bookings.filter((b) => isPaid(b) && new Date(b.showtime.startTime) > now),
    [bookings, now]
  );

  const watchedBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (isPaid(b) && new Date(b.showtime.startTime) <= now) ||
          b.status === 'CANCELLED'
      ),
    [bookings, now]
  );

  // Filtered list based on active tab
  const filteredBookings = useMemo(() => {
    if (activeTab === 'upcoming') return upcomingBookings;
    if (activeTab === 'watched') return watchedBookings;
    return bookings;
  }, [activeTab, upcomingBookings, watchedBookings, bookings]);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Vé sắp tới', count: upcomingBookings.length },
    { key: 'watched', label: 'Vé đã xem / Hết hạn', count: watchedBookings.length },
    { key: 'all', label: 'Tất cả', count: bookings.length },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Ticket className="text-[#E5A93C]" size={30} />
            Vé Của Tôi
          </h1>
          <p className="text-white/40 mt-1">Lịch sử đặt vé và vé sắp tới của bạn</p>
        </div>

        {/* Dashboard Statistics in Dark Mode Cards */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Film size={20} />}
              label="Phim đã xem"
              value={`${watchedScreeningsCount}`}
            />
            <StatCard
              icon={<Wallet size={20} />}
              label="Tổng chi tiêu"
              value={formatMoney(totalSpent)}
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Vé sắp tới"
              value={`${upcomingCount}`}
            />
          </div>
        )}

        {/* 3 Tabs with Counters */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-zinc-900/60 rounded-2xl border border-white/5 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-[#E5A93C] text-black shadow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-black/20 text-black font-bold'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={40} className="text-red-400 mb-4" />
            <p className="text-white/60">Không thể tải dữ liệu vé. Vui lòng thử lại sau.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <MyTicketsContent />
    </ProtectedRoute>
  );
}
