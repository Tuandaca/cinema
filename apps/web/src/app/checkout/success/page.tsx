'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Ticket, Calendar, Clock, MapPin, Download, Popcorn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { useAuth } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const { token } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId!, token!),
    enabled: !!bookingId && !!token,
  });

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-bold">Mã vé không hợp lệ</h1>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=COICINE-TICKET-${bookingId}`;

  const seatNames = booking?.seats?.map((bs: any) => `${bs.seat?.row}${bs.seat?.number}`).join(', ') || 'Đang tải...';
  const movieTitle = booking?.showtime?.movie?.title || 'Đang tải...';
  const roomName = booking?.showtime?.room?.name || 'Phòng chiếu';
  const startTime = booking?.showtime?.startTime ? new Date(booking.showtime.startTime) : null;
  const combosList = booking?.orderItems?.map((oi: any) => `${oi.quantity}x ${oi.combo?.name}`).join(', ');

  return (
    <div className="min-h-screen bg-background pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-zinc-900/80 rounded-3xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
          {/* Success Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white mb-2">Đặt Vé Thành Công!</h1>
            <p className="text-white/60">Vé điện tử của bạn đã sẵn sàng và được lưu vào hệ thống.</p>
          </div>

          {/* Ticket Body */}
          <div className="bg-black/40 rounded-2xl p-6 border border-white/10 relative z-10">
            <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
              <div>
                <h2 className="text-sm text-white/50 mb-1">Mã đặt vé</h2>
                <p className="font-mono text-cyan-400 font-bold tracking-wider">{bookingId.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm text-white/50 mb-1">Trạng thái</h2>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                  {booking?.status || 'PAID'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-1">{movieTitle}</h3>
              <p className="text-sm text-coicine-gold font-medium">
                Tổng tiền: {booking?.totalAmount ? `${booking.totalAmount.toLocaleString('vi-VN')} đ` : '...'}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-white/80">
                  <Ticket className="text-coicine-gold" size={20} />
                  <span>Ghế: <strong className="text-cyan-400">{seatNames}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="text-coicine-gold" size={20} />
                  <span>{roomName}</span>
                </div>
                {startTime && (
                  <>
                    <div className="flex items-center gap-3 text-white/80">
                      <Calendar className="text-coicine-gold" size={20} />
                      <span>{startTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <Clock className="text-coicine-gold" size={20} />
                      <span>{startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </>
                )}
                {combosList && (
                  <div className="flex items-center gap-3 text-white/80">
                    <Popcorn className="text-coicine-gold" size={20} />
                    <span>Bắp nước: {combosList}</span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl shadow-inner shrink-0">
                <img src={qrUrl} alt="E-Ticket QR" className="w-32 h-32" />
              </div>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-background rounded-full -translate-y-1/2 border-r border-white/10"></div>
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-background rounded-full -translate-y-1/2 border-l border-white/10"></div>

          {/* Actions */}
          <div className="mt-8 flex gap-4 relative z-10">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors"
            >
              Về Trang Chủ
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> In Vé / Tải Vé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải vé...</div>}>
        <SuccessContent />
      </Suspense>
    </ProtectedRoute>
  );
}
