import React from 'react';
import Header from '@/components/layout/Header';

export default function ShowtimesPage() {
  return (
    <div className="min-h-screen bg-coicine-charcoal pt-32 px-6">
      <div className="container mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">Lịch Chiếu Phim</h1>
        <div className="bg-zinc-900/40 rounded-2xl p-12 border border-white/5 text-center">
          <p className="text-xl text-gray-400">Tính năng đang được phát triển...</p>
          <p className="mt-4 text-gray-500">Vui lòng chọn phim ở trang chủ để xem lịch chiếu cụ thể.</p>
        </div>
      </div>
    </div>
  );
}
