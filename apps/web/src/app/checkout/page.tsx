'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { ArrowLeft, Popcorn, Ticket, CreditCard, QrCode, Wallet, CheckCircle2 } from 'lucide-react';

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
        {isProcessing ? 'Processing...' : 'Pay with Stripe'}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const showtimeId = searchParams.get('showtimeId');
  const seatsParam = searchParams.get('seats');
  const seatIds = seatsParam ? seatsParam.split(',') : [];

  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [selectedCombos, setSelectedCombos] = useState<{ comboId: string; quantity: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'CARD' | 'QR' | 'SAVED'>('CARD');
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
          alert('Your seat reservation has expired. Please select seats again.');
          router.push(`/movies/${showtimeId}/booking`);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [router, showtimeId]);

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
        <h1 className="text-2xl font-bold mb-4">Invalid Order Session</h1>
        <button onClick={() => router.push('/')} className="text-cyan-400 hover:underline">Return Home</button>
      </div>
    );
  }

  if (showtimeLoading || seatsLoading || combosLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading Order Details...</div>;
  }

  const selectedSeats = allSeats?.filter(s => seatIds.includes(s.id)) || [];
  const ticketsPrice = selectedSeats.length * (showtime?.priceBase || 0);
  
  const combosPrice = selectedCombos.reduce((acc, curr) => {
    const combo = combos?.find(c => c.id === curr.comboId);
    return acc + (combo?.price || 0) * curr.quantity;
  }, 0);

  const totalAmount = ticketsPrice + combosPrice;

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
      const token = 'dummy-token';
      // 1. Create DB Booking
      const booking = await bookingService.createBooking(showtimeId, seatIds, selectedCombos, token);
      setBookingId(booking.id);

      // 2. Depending on Tab, get Payment Intent or QR
      if (activeTab === 'CARD') {
        const intent = await bookingService.createPaymentIntent(booking.id, token);
        setClientSecret(intent.clientSecret);
      } else if (activeTab === 'QR') {
        const qr = await bookingService.createQRCode(booking.id, totalAmount, token);
        setQrUrl(qr.qrUrl);
      } else {
        // Saved Card - Mock direct success
        setTimeout(() => handleSuccess(booking.id), 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize payment');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleSuccess = (bid?: string) => {
    localStorage.removeItem(`booking_start_${showtimeId}`);
    router.push(`/checkout/success?bookingId=${bid || bookingId}`);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Back to Booking
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
            <CreditCard className="text-cyan-400" size={32} /> Checkout
          </h1>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-mono text-lg flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span>Time remaining:</span>
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tickets & F&B */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <Ticket className="text-cyan-400" /> Order Summary
              </h2>
              <div className="flex gap-4">
                 {showtime?.movie.posterUrl ? (
                  <img src={showtime.movie.posterUrl} alt={showtime.movie.title} className="w-24 h-32 object-cover rounded-lg shadow-lg" />
                ) : (
                  <div className="w-24 h-32 bg-zinc-800 rounded-lg flex items-center justify-center text-xs">No Poster</div>
                )}
                <div>
                  <h3 className="font-bold font-outfit text-xl mb-1">{showtime?.movie.title}</h3>
                  <p className="text-white/60 mb-1">{showtime?.room.name}</p>
                  <p className="text-white/60 mb-3">{new Date(showtime?.startTime || '').toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5 inline-block">
                    <p className="text-sm text-white/50 mb-1">Seats ({selectedSeats.length})</p>
                    <p className="font-bold text-cyan-400">{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold font-outfit mb-4 flex items-center gap-2">
                <Popcorn className="text-coicine-gold" /> Food & Beverage Combos
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
                          <p className="text-cyan-400 font-bold mt-1">${combo.price.toFixed(2)}</p>
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
                <span className="text-white/60">Total Amount</span>
                <span className="text-4xl font-bold text-cyan-400 font-outfit">${totalAmount.toFixed(2)}</span>
              </div>

              {/* Multi-Payment Tabs */}
              <div className="flex bg-black/40 rounded-lg p-1 mb-6 border border-white/5">
                <button 
                  onClick={() => {setActiveTab('CARD'); setClientSecret(null); setQrUrl(null);}} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'CARD' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <CreditCard size={16} /> Card
                </button>
                <button 
                  onClick={() => {setActiveTab('QR'); setClientSecret(null); setQrUrl(null);}} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'QR' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <QrCode size={16} /> QR
                </button>
                <button 
                  onClick={() => {setActiveTab('SAVED'); setClientSecret(null); setQrUrl(null);}} 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition flex items-center justify-center gap-2 ${activeTab === 'SAVED' ? 'bg-zinc-800 text-white shadow' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Wallet size={16} /> Saved
                </button>
              </div>

              {/* Payment Content Area */}
              <div className="min-h-[200px]">
                {!clientSecret && !qrUrl && activeTab !== 'SAVED' && (
                  <button 
                    onClick={handleCreateOrder}
                    disabled={isOrdering}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:shadow-none mt-8"
                  >
                    {isOrdering ? 'Generating Order...' : 'Proceed to Payment'}
                  </button>
                )}

                {/* Tab 1: Stripe Form */}
                {activeTab === 'CARD' && clientSecret && (
                  <div className="animate-in fade-in zoom-in">
                    <StripeForm onSuccess={() => handleSuccess()} />
                  </div>
                )}

                {/* Tab 2: QR Code */}
                {activeTab === 'QR' && qrUrl && (
                  <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in">
                    <div className="bg-white p-4 rounded-xl shadow-2xl mb-4">
                      <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-white/60 text-sm text-center mb-6">Scan with MoMo, ZaloPay, or your Banking App.</p>
                    <button 
                      onClick={() => handleSuccess()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold text-sm underline underline-offset-4"
                    >
                      [Dev Mock] Simulate QR Scan Success
                    </button>
                  </div>
                )}

                {/* Tab 3: Saved Cards */}
                {activeTab === 'SAVED' && (
                  <div className="animate-in fade-in space-y-4">
                    <p className="text-sm text-white/60 mb-2">Select a saved card for 1-Click Checkout:</p>
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
                      {isOrdering ? 'Processing...' : 'Pay with Saved Card'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
