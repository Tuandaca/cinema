import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-coicine-charcoal pt-32 px-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-headline font-bold mb-8">Về COICINE</h1>
        <div className="prose prose-invert lg:prose-xl">
          <p className="text-xl text-gray-300 leading-relaxed">
            COICINE là hệ thống rạp chiếu phim hiện đại mang đến trải nghiệm điện ảnh đỉnh cao với công nghệ âm thanh vòm và hình ảnh sắc nét.
          </p>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-coicine-gold">10+</p>
              <p className="text-gray-500">Cụm rạp</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-coicine-gold">50+</p>
              <p className="text-gray-500">Phòng chiếu</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-coicine-gold">1M+</p>
              <p className="text-gray-500">Khách hàng</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-coicine-gold">4.9/5</p>
              <p className="text-gray-500">Đánh giá</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
