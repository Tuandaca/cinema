import React from 'react';

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-coicine-charcoal pt-32 px-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8 text-coicine-gold">Ưu Đãi & Khuyến Mãi</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/5">
              <div className="h-48 bg-zinc-800 animate-pulse" />
              <div className="p-6">
                <div className="h-6 w-2/3 bg-zinc-700 rounded mb-4" />
                <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-1/2 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
