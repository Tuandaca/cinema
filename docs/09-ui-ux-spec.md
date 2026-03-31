# 09. UI/UX Specifications & Visual Theme

## 1. Cinematic Visual Theme (Netflix/Premium Style)
- **Primary Color:** Carbon Black (`#0B0B0B`)
- **Accent Color:** Neon Gold (`#FFD700`) hoặc Cyber Cyan (`#00F2FF`)
- **Typography:** Outfit (Sans-serif) cho headlines, Inter cho body text.
- **Glassmorphism:** Sử dụng hiệu ứng `backdrop-blur` cho các thanh header và popup.

## 2. Component Hierarchy (Next.js components)
- `layouts/Header.tsx`: Transparent, mờ dần khi cuộn.
- `components/Hero.tsx`: Video trailer autoplay muted, gradient phủ lên video.
- `components/MovieCard.tsx`: Hover effect zoom, hiển thị Rating & Genre khi hover.
- `components/SeatMap.tsx`: Grid động, màu sắc thay đổi theo trạng thái (Available, Selecting, Reserved).

## 3. Key Pages Design

### 3.1. Landing Page
- Hero section chiếm trọn màn hình đầu tiên.
- Danh sách phim hiển thị dạng Carousel hoặc Grid (Scroll Reveal animation).
- Floating AI Assistant button góc phải dưới.

### 3.2. Seat Booking Page
- Cảm giác "trong rạp": Background tối mờ, tập trung vào màn chiếu (Cinema screen glow effect).
- Micro-interactions: Khi chọn ghế, ghế "nhún" nhẹ (Spring animation) và đổi màu neon.

### 3.3. AI Chat Popup
- Giao diện như ChatGPT nhưng mượt hơn.
- Hiệu ứng "typing" chân thực.
- Quick action buttons (ví dụ: "Đặt vé phim này", "Xem trailer").

## 4. Animation Guidelines (Framer Motion)
- **Page Transitions:** Slide left/right hoặc Fade in-out.
- **Hover zoom:** `whileHover={{ scale: 1.05 }}`.
- **Loading Skeletons:** Hiệu ứng shimmer tinh tế cho tất cả các phần fetch data.
- **Micro-interactions:** Vercel-like button feedback.

## 5. Visual Hierarchy
- Tiêu đề phim cực lớn trên Hero.
- Nút "Book Now" luôn có màu tương phản mạnh nhất.
- Giá tiền hiển thị rõ ràng tại mọi bước (Floating summary).
