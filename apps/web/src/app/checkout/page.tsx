'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import {
  ArrowLeft,
  Popcorn,
  Ticket,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle2,
  Copy,
  Building2,
  Check,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import CinematicPoster from '@/components/common/CinematicPoster';

function StripeForm({ onSuccess }: { onSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);
    // In our mock, we just pretend it succeeds
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="p-4 bg-white rounded-xl shadow-inner">
        {/* Real Stripe PaymentElement would go here, but it requires a valid clientSecret from a real Stripe account */}
        {/* We use a mock visual for now since this is a local mock */}
        <div className="text-black text-sm mb-2">Simulated Stripe Element (Mock Mode)</div>
        <input 
          type="text" 
          placeholder="Card number" 
          className="w-full border border-gray-300 p-3 rounded mb-3 text-black"
          defaultValue="4242 4242 4242 4242"
          readOnly
        />
        <div className="flex gap-3">
          <input type="text" placeholder="MM/YY" className="w-1/2 border border-gray-300 p-3 rounded text-black" defaultValue="12/26" readOnly />
          <input type="text" placeholder="CVC" className="w-1/2 border border-gray-300 p-3 rounded text-black" defaultValue="123" readOnly />
        </div>
      </div>
      <button 
        disabled={isProcessing}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
      >
        {isProcessing ? 'Đang xử lý...' : 'Thanh toán qua Stripe'}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const { token } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const showtimeId = searchParams.get('showtimeId');
  const seatsParam = searchParams.get('seats');
  const seatIds = seatsParam ? seatsParam.split(',') : [];

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const storedTime = typeof window !== 'undefined' ? localStorage.getItem(`booking_start_${showtimeId}`) : null;
    if (storedTime) {
      const elapsed = Math.floor((Date.now() - parseInt(storedTime)) / 1000);
      return Math.max(0, 300 - elapsed);
    }
    return 300;
  });
  const [selectedCombos, setSelectedCombos] = useState<{ comboId: string; quantity: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'CARD' | 'QR' | 'SAVED'>('CARD');
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const storedTime = localStorage.getItem(`booking_start_${showtimeId}`);
    
    if (storedTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - parseInt(storedTime)) / 1000);
        const remaining = 300 - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          localStorage.removeItem(`booking_start_${showtimeId}`);
          showWarning('Thời gian giữ ghế của bạn đã hết. Vui lòng chọn lại ghế!');
          router.push(`/movies/${showtimeId}/booking`);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [router, showtimeId, showWarning]);

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

  const { data: combos, isLoading: combosLoading } = useQuery({
    queryKey: ['combos'],
    queryFn: () => bookingService.getCombos(),
  });

  if (!showtimeId || seatIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Phiên đặt vé không hợp lệ</h1>
        <button onClick={() => router.push('/')} className="text-cyan-400 hover:underline">Quay về trang chủ</button>
      </div>
    );
  }

  if (showtimeLoading || seatsLoading || combosLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white/60">Đang tải thông tin đặt vé...</div>;
  }

  const selectedSeats = allSeats?.filter(s => seatIds.includes(s.id)) || [];
  const ticketsPrice = selectedSeats.reduce((sum, s) => {
    const mult = s.type === 'VIP' ? 1.5 : s.type === 'SWEETBOX' ? 2.0 : 1.0;
    return sum + (showtime?.priceBase || 0) * mult;
  }, 0);
  
  const combosPrice = selectedCombos.reduce((acc, curr) => {
    const combo = combos?.find(c => c.id === curr.comboId);
    return acc + (combo?.price || 0) * curr.quantity;
  }, 0);

  const totalAmount = ticketsPrice + combosPrice;

  // VietQR Napas 247 standard URL when bookingId is known
  const vietQrImageUrl = bookingId
    ? `https://img.vietqr.io/image/970436-1028472918-compact2.png?amount=${Math.round(totalAmount)}&addInfo=COICINE-${bookingId.slice(0, 8).toUpperCase()}&accountName=CONG%20TY%20TNHH%20COICINE%20VIETNAM`
    : qrUrl;

  const handleCopy = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showSuccess(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleAddCombo = (comboId: string, delta: number) => {
    setSelectedCombos(prev => {
      const existing = prev.find(p => p.comboId === comboId);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) return prev.filter(p => p.comboId !== comboId);
        return prev.map(p => p.comboId === comboId ? { ...p, quantity: newQuantity } : p);
      }
      if (delta > 0) return [...prev, { comboId, quantity: delta }];
      return prev;
    });
  };

  const handleCreateOrder = async () => {
    setIsOrdering(true);
    try {
      const authToken = token; // Real JWT from useAuth()
      if (!authToken) {
        showError('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      // 1. Create DB Booking
      const booking = await bookingService.createBooking(showtimeId, seatIds, selectedCombos, authToken);
      setBookingId(booking.id);

      // 2. Depending on Tab, get Payment Intent or QR
      if (activeTab === 'CARD') {
        const intent = await bookingService.createPaymentIntent(booking.id, authToken);
        setClientSecret(intent.clientSecret);
      } else if (activeTab === 'QR') {
        const officialVietQrUrl = `https://img.vietqr.io/image/970436-1028472918-compact2.png?amount=${Math.round(totalAmount)}&addInfo=COICINE-${booking.id.slice(0, 8).toUpperCase()}&accountName=CONG%20TY%20TNHH%20COICINE%20VIETNAM`;
        setQrUrl(officialVietQrUrl);
      } else {
        // Saved Card - Mock direct success: confirm payment in DB
        await bookingService.confirmPayment(booking.id, authToken);
        setTimeout(() => handleSuccess(booking.id), 1500);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleSuccess = async (bid?: string) => {
    const targetBookingId = bid || bookingId;
    if (targetBookingId && token) {
      try {
        await bookingService.confirmPayment(targetBookingId, token);
      } catch (err) {
        console.warn('Failed to confirm payment status:', err);
      }
    }
    localStorage.removeItem(`booking_start_${showtimeId}`);
    showSuccess('Thanh toán thành công!');
    router.push(`/checkout/success?bookingId=${targetBookingId}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Quay lại chọn ghế
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
            <CreditCard className="text-cyan-400" size={32} /> Thanh Toán
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-mono text-lg flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span>Thời gian giữ ghế:</span>
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tickets & F&B */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Ticket className="text-cyan-400" /> Thông Tin Đơn Vé
              </h2>
              <div className="flex gap-4">
                <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
                  <CinematicPoster
                    src={showtime?.movie.posterUrl}
                    alt={showtime?.movie.title || 'Movie Poster'}
                    title={showtime?.movie.title}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-bold font-outfit text-xl mb-1">{showtime?.movie.title}</h3>
                  <p className="text-white/60 mb-1">{showtime?.room.name}</p>
                  <p className="text-white/60 mb-3">{new Date(showtime?.startTime || '').toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 inline-block">
                    <p className="text-sm text-white/50 mb-1">Ghế đã chọn ({selectedSeats.length})</p>
                    <p className="font-bold text-cyan-400">{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
                <Popcorn className="text-coicine-gold" /> Bắp Nước & Combo
              </h2>
              <div className="space-y-4">
                {combos?.map((combo) => {
                  const qty = selectedCombos.find(c => c.comboId === combo.id)?.quantity || 0;
                  return (
                    <div key={combo.id} className="bg-black/40 rounded-xl p-4 border border-white/5 flex justify-between items-center hover:border-white/10 transition-colors">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-2xl">
                          🍿
                        </div>
                        <div>
                          <h3 className="font-bold">{combo.name}</h3>
                          <p className="text-sm text-white/50">{combo.description}</p>
                          <p className="text-cyan-400 font-bold mt-1">{combo.price.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-800/50 rounded-full p-1 border border-white/5">
                        <button onClick={() => handleAddCombo(combo.id, -1)} className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition">-</button>
                        <span className="w-4 text-center font-bold">{qty}</span>
                        <button onClick={() => handleAddCombo(combo.id, 1)} className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/40 transition">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Payment Gateway */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/80 rounded-2xl border border-white/10 p-6 sticky top-24 shadow-2xl">
              
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                <span className="text-white/60">Tổng tiền thanh toán</span>
                <span className="text-4xl font-bold text-cyan-400 font-outfit">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>

              {/* Multi-Payment Tabs */}
              <div className="flex bg-black/40 rounded-lg p-1 mb-6 border border-white/5">
                <button 
                  onClick={() => { setActiveTab('CARD'); }} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'CARD' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <CreditCard size={16} /> Thẻ Quốc Tế
                </button>
                <button 
                  onClick={() => { setActiveTab('QR'); }} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'QR' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <QrCode size={16} /> VietQR
                </button>
                <button 
                  onClick={() => { setActiveTab('SAVED'); }} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'SAVED' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Wallet size={16} /> Thẻ Đã Lưu
                </button>
              </div>

              {/* Payment Content Area */}
              <div className="min-h-[200px]">
                {!clientSecret && !vietQrImageUrl && activeTab !== 'SAVED' && (
                  <div className="space-y-4">
                    {activeTab === 'QR' && (
                      <div className="p-4 bg-zinc-800/40 border border-cyan-500/20 rounded-xl text-center space-y-2">
                        <p className="text-sm text-cyan-300 font-semibold">Chuyển khoản liên ngân hàng Napas 247</p>
                        <p className="text-xs text-white/60">Hỗ trợ tất cả ứng dụng ngân hàng (VCB, MB, Techcombank, VietinBank...) và ví điện tử (MoMo, ZaloPay).</p>
                      </div>
                    )}
                    <button 
                      onClick={handleCreateOrder}
                      disabled={isOrdering}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:shadow-none"
                    >
                      {isOrdering ? 'Đang tạo đơn...' : activeTab === 'QR' ? 'Tạo mã VietQR thanh toán' : 'Tiến hành thanh toán'}
                    </button>
                  </div>
                )}

                {/* Tab 1: Stripe Form */}
                {activeTab === 'CARD' && clientSecret && (
                  <div className="animate-in fade-in zoom-in">
                    <StripeForm onSuccess={() => handleSuccess()} />
                  </div>
                )}

                {/* Tab 2: VietQR Code & Napas 247 Banking Info */}
                {activeTab === 'QR' && vietQrImageUrl && (
                  <div className="flex flex-col items-center justify-center py-2 animate-in fade-in zoom-in">
                    {/* VietQR Bank-Grade Image */}
                    <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] border-2 border-cyan-500/30 mb-4 inline-block">
                      <img 
                        src={vietQrImageUrl} 
                        alt="VietQR Napas 247" 
                        className="w-56 h-auto rounded-lg mx-auto" 
                      />
                    </div>
                    
                    <p className="text-white/60 text-xs text-center mb-4">
                      Quét mã bằng ứng dụng Ngân hàng (VCB, MB, Techcombank...) hoặc Ví MoMo/ZaloPay.
                    </p>

                    {/* Bank Transfer Details with 1-click Copy */}
                    <div className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-4 text-sm space-y-3 mb-5">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-white/50 text-xs">Ngân hàng</span>
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <Building2 size={14} className="text-[#E5A93C]" />
                          Vietcombank (Napas 247)
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-white/50 text-xs">Số tài khoản</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">1028472918</span>
                          <button
                            type="button"
                            onClick={() => handleCopy('1028472918', 'accountNo', 'Số tài khoản')}
                            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                            title="Sao chép số tài khoản"
                          >
                            {copiedKey === 'accountNo' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-white/50 text-xs">Chủ tài khoản</span>
                        <span className="font-bold text-white text-xs sm:text-sm">CONG TY TNHH COICINE VIETNAM</span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-white/50 text-xs">Số tiền</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E5A93C]">{totalAmount.toLocaleString('vi-VN')} đ</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(Math.round(totalAmount).toString(), 'amount', 'Số tiền')}
                            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                            title="Sao chép số tiền"
                          >
                            {copiedKey === 'amount' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-xs">Nội dung chuyển khoản</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">
                            {bookingId ? `COICINE-${bookingId.slice(0, 8).toUpperCase()}` : 'COICINE-BOOKING'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bookingId ? `COICINE-${bookingId.slice(0, 8).toUpperCase()}` : 'COICINE-BOOKING', 'addInfo', 'Nội dung chuyển khoản')}
                            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                            title="Sao chép cú pháp chuyển khoản"
                          >
                            {copiedKey === 'addInfo' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={() => handleSuccess()}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3.5 rounded-xl font-bold text-base transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] mb-3"
                    >
                      Xác nhận đã chuyển khoản
                    </button>

                    <button 
                      onClick={() => handleSuccess()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold text-xs underline underline-offset-4"
                    >
                      [Dev Mock] Mô phỏng quét mã thành công
                    </button>
                  </div>
                )}

                {/* Tab 3: Saved Cards */}
                {activeTab === 'SAVED' && (
                  <div className="animate-in fade-in space-y-4">
                    <p className="text-sm text-white/60 mb-2">Chọn thẻ đã lưu để thanh toán 1-chạm:</p>
                    <label className="flex items-center justify-between p-4 bg-zinc-800 border border-cyan-500/50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="saved_card" defaultChecked className="w-4 h-4 text-cyan-500" />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                            <span className="text-[10px] text-blue-800 font-bold italic">VISA</span>
                          </div>
                          <span className="font-mono text-sm tracking-widest">•••• 4242</span>
                        </div>
                      </div>
                      <CheckCircle2 className="text-cyan-400" size={18} />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-zinc-900 border border-white/10 rounded-xl cursor-pointer opacity-50">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="saved_card" className="w-4 h-4" />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                            <span className="text-[10px] text-red-600 font-bold italic">MASTER</span>
                          </div>
                          <span className="font-mono text-sm tracking-widest">•••• 5555</span>
                        </div>
                      </div>
                    </label>

                    <button 
                      onClick={handleCreateOrder}
                      disabled={isOrdering}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:shadow-none mt-4"
                    >
                      {isOrdering ? 'Đang xử lý...' : 'Thanh toán với thẻ đã lưu'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/60">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
